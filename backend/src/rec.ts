import { db } from "./drizzle/db.js";
import { user,vid_like,video,view } from "./drizzle/schema.js";
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

export const userSimilarity = async (id:any, count:any, all_videos:any) => {
    //User query: get all users to then do cosine similiarity between them
    const users = await db.select({id:user.id}).from(user);

    //Video Like query: get all info on videos that have been liked to initialize matrix for cosine similarity
    const all_likes = await db.select().from(vid_like);

    //View query: get all info about viewed videos from this user, used in knowing what videos to leave recommending until the end 
    const avoid_viewed_videos = await db.select({video_id:view.video_id}).from(view).where(
        and(
            eq(view.user_id,id),
            eq(view.viewed,true)
        )
    );

    const avoid_viewed_videos_set = new Set(avoid_viewed_videos.map((v:any) => v.video_id));

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

    all_videos.forEach((video:any) => {
        users.forEach(u => {
            if (!(video.id in user_matrix[u.id])) //if video.id doesn't exist in user (it has not clicked like or dislike)
                user_matrix[u.id][video.id] = 0;
        });
    });

    // function getValue(d: { [key: string]: number }, i: number, j: number): number {
    //     return Object.values(d)[i];
    // }
    // console.log("TYPE: ",typeof user_matrix[0]);
    // console.log("CUR USER LENGTH: ",Object.values(user_matrix[id]).length);



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

    //1st Choice: Recommend other similar user's videos that hasn't been seen before
    const rec_videos:string[] = [];
    for (const similiar_users of similarities){
        if(similiar_users.similar > 0.0) { //kinda similar
            const liked_videos = all_likes.filter(like => like.user_id === similiar_users.user_id && like.liked === true);
            for(const like_vid of liked_videos){
                if(!avoid_viewed_videos_set.has(like_vid.video_id))//as long as its not on avoid_viewed_videos
                    rec_videos.push(like_vid.video_id); //push video.id into it
                if(rec_videos.length >= count) 
                    break;
            }
            if(rec_videos.length >= count)
                break;
        }
    }

    //2nd Choice: Recommend random unseen videos
    if(rec_videos.length < count) {
        const unwatched_videos = all_videos.filter((v:any) => !avoid_viewed_videos_set.has(v.id)); //as long as the video is not a video that's viewed already
        while(rec_videos.length < count && unwatched_videos.length > 0) {
            const rand_ind = Math.floor(Math.random()*unwatched_videos.length);
            rec_videos.push(unwatched_videos[rand_ind].id);
            unwatched_videos.splice(rand_ind,1); //delete 1 element starting at that index
        }
    }

    //3rd Choice: (Final fallback) Recommend random seen videos
    if(rec_videos.length < count) {
        const leftover_vid = all_videos.filter((v:any) => !rec_videos.some(rec_vid => rec_vid === v.id)); //as long as its not a rec vid already
        while(rec_videos.length < count && leftover_vid.length > 0){
            const rand_ind = Math.floor(Math.random()*leftover_vid.length);
            rec_videos.push(leftover_vid[rand_ind].id);
            leftover_vid.splice(rand_ind,1);
        }
    }

    return rec_videos;
}

export const videoSimilarity = async (id:any, uid:any, count:any,all_videos:any) => {
    //User query: get all users
    const users = await db.select({id:user.id}).from(user);

    //Video Like query: get all info on videos that have been liked to initialize matrix for cosine similarity
    const all_likes = await db.select().from(vid_like);

    //View query: get all info about viewed videos from this user, used in knowing what videos to leave recommending until the end 
    const avoid_viewed_videos = await db.select({video_id:view.video_id}).from(view).where(
        and(
            eq(view.user_id,uid),
            eq(view.viewed,true)
        )
    );

    //Video query: only get "complete" videos, don't have to use ids from videos still processing by workers
    // const all_videos = await db.select().from(video)
    // .where(
    //     eq(video.status,"complete")
    // );
    // [
    //     1: {video.id: -1,0,1},
    //     2
    // ]

    // Create a matrix with Row: Video ID, Column: User, each cell is -1,0,1 for disliked, null, liked respectively
    const video_matrix: VideoMatrix = {};
    all_videos.forEach((v:any) => {
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

    all_videos.forEach((video:any) => {
        users.forEach(u => {
            if (!(u.id in video_matrix[video.id])) //if user.id doesn't exist in video (it has not clicked like or dislike)
                video_matrix[video.id][u.id] = 0;
        });
    });    

    //Compute Cosine Similiarity using the ID's of each row, the scores will be stored with key video id
    const similarities: VideoSimilarities[] = [];
    all_videos.forEach((v:any) => {
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
    
    const avoid_viewed_videos_set = new Set(avoid_viewed_videos.map((v:any) => v.video_id));

    //1st Choice: Recommend videos that hasn't been seen before (all videos from most similar to least similar)
    const rec_videos:string[] = [];
    for (const similar_video of similarities){
        if (!avoid_viewed_videos_set.has(similar_video.video_id))//as long as its not on avoid_viewed_videos
            rec_videos.push(similar_video.video_id);
        if (rec_videos.length >= count)
            break;
    }

    //2nd Choice: Recommend random seen videos
    if(rec_videos.length < count) {
        const leftover_vid = all_videos.filter((v:any) => !rec_videos.some(rec_vid => rec_vid === v.id)); //as long as its not a rec vid already
        while(rec_videos.length < count && leftover_vid.length > 0){
            const rand_ind = Math.floor(Math.random()*leftover_vid.length);
            rec_videos.push(leftover_vid[rand_ind].id);
            leftover_vid.splice(rand_ind,1);
        }
    }
    return rec_videos;
}