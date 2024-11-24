import { Router } from "express";
import { authMiddlware } from "../middleware/auth";
import fs from "fs";
import { recommend } from "../rec";
import { and, eq } from "drizzle-orm";
import { db } from "../drizzle/db";
import { user, vid_like, video, view } from "../drizzle/schema";
import similarity from "compute-cosine-similarity";

const router = Router();

router.use(authMiddlware);

interface UserMatrix {
    [userId: number]: {
        [videoId: string]: number;
    };
}

interface Similarities {
    user_id: number;
    similar: number;
}

// parameter in body count req.body
router.post("/videos", async (req:any , res:any) => {
    try {
        const { count } = req.body;

        //User query: get all users to then do cosine similiarity between them
        const users = await db.select().from(user);

        //Video Like query: get all info on videos that have been liked to initialize matrix for cosine similarity
        const all_likes = await db.select().from(vid_like);

        //View query: get all info about viewed videos from this user, used in knowing what videos to leave recommending until the end 
        const avoid_viewed_videos = await db.select().from(view).where(
            and(
                eq(view.user_id,req.user_id),
                eq(view.viewed,true)
            )
        );

        //Video query: only get "complete" videos, don't have to use ids from videos still processing by workers
        const all_videos = await db.select().from(video).where(
            eq(video.status,"complete")
        );
        // [
        //     1: {video.id: -1,0,1},
        //     2
        // ]

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

        // function getValue(d: { [key: string]: number }, i: number, j: number): number {
        //     return Object.values(d)[i];
        // }
        

        //Compute Cosine Similiarity using the ID's of each row, the scores will be stored with key user id
        const similarities: Similarities[] = [];
        users.forEach(u => {
            if(u.id !== req.user_id) {
                const similar = similarity(
                    Object.values(user_matrix[req.user_id]),
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
                    if(!avoid_viewed_videos.some(v => v.video_id === like_vid.video_id))//as long as its not on avoid_viewed_videos
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
            const unwatched_videos = all_videos.filter(v => !avoid_viewed_videos.some(view => view.video_id === v.id)); //as long as the video is not a video that's viewed already
            while(rec_videos.length < count && unwatched_videos.length > 0) {
                const rand_ind = Math.floor(Math.random()*unwatched_videos.length);
                rec_videos.push(unwatched_videos[rand_ind].id);
                unwatched_videos.splice(rand_ind,1); //delete 1 element starting at that index
            }
        }

        //3rd Choice: (Final fallback) Recommend random seen videos
        if(rec_videos.length < count) {
            const leftover_vid = all_videos.filter(v => !rec_videos.some(rec_vid => rec_vid === v.id)); //as long as its not a rec vid already
            while(rec_videos.length < count && leftover_vid.length > 0){
                const rand_ind = Math.floor(Math.random()*leftover_vid.length);
                rec_videos.push(leftover_vid[rand_ind].id);
                leftover_vid.splice(rand_ind,1);
            }
        }

        //Obtain data from recommended video id in the form of [{id,desc,title,watched,liked,# likes}]
        const details = await Promise.all(
            rec_videos.map(async (rec_vid_id: string) => {
                const video_data = await db.select().from(video).where(eq(video.id,rec_vid_id)); //get the video data
                const user_liked = await db.select().from(vid_like).where(
                    and(
                        eq(vid_like.video_id,rec_vid_id),
                        eq(vid_like.user_id,req.user_id)
                    ));
                const viewed = await db.select().from(view).where(
                    and(
                        eq(view.video_id, rec_vid_id),
                        eq(view.user_id, req.user_id)
                    )
                );
                let watch = true;
                if(viewed.length === 0) {
                    watch = false;
                }
                else{
                    if(viewed[0].viewed === false)
                        watch = viewed[0].viewed;
                }
                let liked = null;
                if(user_liked.length > 0){
                    liked = user_liked[0].liked
                }
                return {
                    id: rec_vid_id,
                    description: video_data[0].description,
                    title: video_data[0].title,
                    watched: watch,
                    liked: liked,
                    likevalues: video_data[0].like,
                };
            })
        )
        //any vid_like.user_id,vid_like.video_id combo that doesn't exist in vid_like we can assume the user has never clicked on like or dislike so its null
        //any view.user_id, view.video_id combo that doesn't exist in view, we can assume the user has never watched it before
        res.status(200).json({status:"OK", videos: details});
    }catch(err){
        return res.status(200).json({status:"ERROR", error:true, message:"internal server error in /api/videos:", err})
    }
})

//Obtains manifest id
router.get("/manifest/:id", async (req: any, res: any) => {
    try{
        const id = req.params.id;
        //perhaps switch to using the db then getting the path off of it?
        const video_query = await db.select().from(video).where(eq(id,video.id));
        if(video_query.length > 0)
            console.log("Grabbing from DB: manifest path:", video_query[0].manifest_path);
        const manifestPath = `/var/html/media/${id}.mpd`;
        console.log("ACTUAL manifest path:", manifestPath);
        console.log("EXISTS?", fs.existsSync(manifestPath));
        if(fs.existsSync(manifestPath)) 
            return res.sendFile(manifestPath);
        return res.status(200).json({status:"ERROR",error:true,message:"manifest not found. for /api/manifest/:id"});
    } catch(err) {
        return res.status(200).json({status:"ERROR",error:true,message:"internal server error from /api/manifest/:id most likely the manifestPath attempt to read does not work"});
    }

});

router.get("/thumbnail/:id", async (req: any, res: any) => {
    try {
        const id = req.params.id;
        //perhaps switch to using the db then getting the path off of it?
        const video_query = await db.select().from(video).where(eq(id,video.id));
        if(video_query.length > 0)
            console.log("Grabbing from DB: thumbnail path:", video_query[0].thumbnail_path);
        const thumbnailPath = `/var/html/media/${id}.jpg`;
        console.log("ACTUAL thumbnail path:", thumbnailPath);
        if(fs.existsSync(thumbnailPath))
            return res.sendFile(thumbnailPath);
        return res.status(200).json({status:"ERROR",error:true,message:"thumbnail not found. for /api/thumbnail/:id"});
    } catch(err) {
        return res.status(200).json({status:"ERROR",error:true,message:"internal server error from api/thumbnail/:id most likely the thumbnailPath attempts to read does not work"});
    }
});

// Return video information for display (Not a requirement)
router.get("/video/:id", async (req:any, res:any) => {
    try {
        const id = req.params.id;
        const video_data = await db.select().from(video).where(eq(id,video.id));
        if(video_data.length > 0) {
            console.log("Data for video id ", id, " found");
            const user_liked = await db.select().from(vid_like).where(
                and(
                    eq(vid_like.video_id,id),
                    eq(vid_like.user_id,req.user_id)
                ));
            const viewed = await db.select().from(view).where(
                and(
                    eq(view.video_id,id),
                    eq(view.user_id,req.user_id)
                )
            );
            const details = {
                id: id,
                description: video_data[0].description,
                title: video_data[0].title,
                watched: viewed.length > 0,
                liked: (user_liked.length > 0) ? user_liked[0].liked : null ,
                likevalues: video_data[0].like,
            }
            return res.status(200).json({status:"OK",vdata:details});
        }
        
        return res.status(200).json({status:"ERROR",error:true,message:"video id not found. for /api/video/:id"});
    } catch(err) {
        return res.status(200).json({status:"ERROR",error:true,message:"internal server error from api/video/:id"});
    }
});

export default router;