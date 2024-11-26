import { db } from "./drizzle/db";
import { user,vid_like,video,view } from "./drizzle/schema";
import { and, eq, inArray, notInArray } from "drizzle-orm";
import similarity from "compute-cosine-similarity";

interface UserMatrix {
    [userId: number]: {
        [videoId: string]: number;
    };
}

interface VideoMatrix {
    [videoId: string]: {
        [userId: number]: number;
    }
}

interface UserSimilarities {
    user_id: number;
    similar: number;
}

interface VideoSimilarities {
    video_id: string;
    similar: number;
}

export const userSimilarity = async (id:any, count:any, users:any,all_likes:any,avoid_viewed_videos:any,all_videos:any) => {

    // Create a matrix with Row: User, Column: Video ID, each cell is -1,0,1 for disliked, null, liked respectively
    const user_matrix: UserMatrix = {};
    users.forEach(u => {
        user_matrix[u.id] = {};
    });
    
    all_likes.forEach(like => {
        if(like.liked === true)
            user_matrix[like.user_id][like.video_id] = 1;
        else if(like.liked === false)
            user_matrix[like.user_id][like.video_id] = -1;
        else //idk how this would happen since an entry is only added if u click like or dislike
            user_matrix[like.user_id][like.video_id] = 0;
    })

    all_videos.forEach(video => {
        users.forEach(u => {
            if (!(video.id in user_matrix[u.id])) //if video.id doesn't exist in user (it has not clicked like or dislike)
                user_matrix[u.id][video.id] = 0;
        });
    });

    //Compute Cosine Similiarity using the ID's of each row, the scores will be stored with key user id
    const similarities: UserSimilarities[] = [];
    users.forEach(u => {
        if(u.id !== id) {
            // console.log("LENGTH: ",Object.values(user_matrix[u.id]).length);
            const similar = similarity(
                Object.values(user_matrix[id]),
                Object.values(user_matrix[u.id]),
            )
            if(similar)
                similarities.push({ user_id: u.id, similar});
        }
    })

    //sort users by most similar user
    similarities.sort((a,b) => b.similar - a.similar);

   

    //Keep track of what has been added to list
    const rec_seen = new Set();
    
    //1st Choice: Recommend other similar user's videos that hasn't been seen before
    const rec_videos:string[] = [];
    for (const similiar_users of similarities){
        if(similiar_users.similar > 0.0) { //kinda similar
            const liked_videos = all_likes.filter(like => like.user_id === similiar_users.user_id && like.liked === true);
            for(const like_vid of liked_videos){
                if(!rec_seen.has(like_vid.video_id) && !avoid_viewed_videos.has(like_vid.video_id)) {//as long as its not already in the list and on avoid_viewed_videos
                    rec_videos.push(like_vid.video_id); //push video.id into it
                    rec_seen.add(like_vid.video_id);
                }
                if(rec_videos.length >= count) 
                    break;
            }
            if(rec_videos.length >= count)
                break;
        }
    }

    //2nd Choice: Recommend random unseen videos
    if(rec_videos.length < count) {
        // as long as the video is not a video that's viewed already or on the list
        const unwatched_videos = all_videos.filter(v => !avoid_viewed_videos.has(v.id) && !rec_seen.has(v.id)); 
        while(rec_videos.length < count && unwatched_videos.length > 0) {
            const rand_ind = Math.floor(Math.random()*unwatched_videos.length);
            rec_seen.add(unwatched_videos[rand_ind].id);
            rec_videos.push(unwatched_videos[rand_ind].id);
            unwatched_videos.splice(rand_ind,1); //delete 1 element starting at that index
        }
    }

    //3rd Choice: (Final fallback) Recommend random seen videos
    if(rec_videos.length < count) {
        
        const leftover_vid:string[] = Array.from(avoid_viewed_videos); // left over vids are simply in avoid_viewed
        while(rec_videos.length < count && leftover_vid.length > 0){
            const rand_ind = Math.floor(Math.random()*leftover_vid.length);
            rec_videos.push(leftover_vid[rand_ind]);
            leftover_vid.splice(rand_ind,1);
        }
    }

    return rec_videos;
}

export const videoSimilarity = async (id:any, uid:any, count:any, users:any,all_likes:any,avoid_viewed_videos:any,all_videos:any) => {
    // Create a matrix with Row: Video ID, Column: User, each cell is -1,0,1 for disliked, null, liked respectively
    const video_matrix: VideoMatrix = {};
    all_videos.forEach(v => {
        video_matrix[v.id] = {};
    });
    
    all_likes.forEach(like => {
        if(like.liked === true)
            video_matrix[like.video_id][like.user_id] = 1;
        else if(like.liked === false)
            video_matrix[like.video_id][like.user_id] = -1;
        else //idk how this would happen since an entry is only added if u click like or dislike
            video_matrix[like.video_id][like.user_id] = 0;
    })

    all_videos.forEach(video => {
        users.forEach(u => {
            if (!(u.id in video_matrix[video.id])) //if user.id doesn't exist in video (it has not clicked like or dislike)
                video_matrix[video.id][u.id] = 0;
        });
    });    

    //Compute Cosine Similiarity using the ID's of each row, the scores will be stored with key video id
    const similarities: VideoSimilarities[] = [];
    all_videos.forEach(v => {
        if(v.id !== id) {
            const similar = similarity(
                Object.values(video_matrix[id]),
                Object.values(video_matrix[v.id]),
            )
            if(similar)
                similarities.push({ video_id: v.id, similar});
        }
    })

    //sort videos by most similar video
    similarities.sort((a,b) => b.similar - a.similar);
    
    //1st Choice: Recommend videos that hasn't been seen before (all videos from most similar to least similar)
    const rec_videos:string[] = [];
    for (const similar_video of similarities){
        if (!avoid_viewed_videos.has(similar_video.video_id))//as long as its not on avoid_viewed_videos
            rec_videos.push(similar_video.video_id);
        if (rec_videos.length >= count)
            break;
    }

    //2nd Choice: Recommend random seen videos
    if(rec_videos.length < count) {
        const leftover_vid:string[] = Array.from(avoid_viewed_videos); // left over vids are simply in avoid_viewed
        while(rec_videos.length < count && leftover_vid.length > 0){
            const rand_ind = Math.floor(Math.random()*leftover_vid.length);
            rec_videos.push(leftover_vid[rand_ind]);
            leftover_vid.splice(rand_ind,1);
        }
    }
    return rec_videos;
}