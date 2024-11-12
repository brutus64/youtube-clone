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

        //these are all the users
        const users = await db.select().from(user);

        //these are all the likes in videos
        const all_likes = await db.select().from(vid_like);

        //we want to avoid these videos for user
        const avoid_viewed_videos = await db.select().from(view).where(
            and(
                eq(view.user_id,req.user_id),
                eq(view.viewed,true)
            )
        );

        //we only want to recommend completed videos
        const all_videos = await db.select().from(video).where(
            eq(video.status,"complete")
        );
        // [
        //     1: {video.id: -1,0,1},
        //     2
        // ]
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

        //get similar user's liked videos
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
        
        //get random videos if not enough, that's not viewed
        if(rec_videos.length < count) {
            const unwatched_videos = all_videos.filter(v => !avoid_viewed_videos.some(view => view.video_id === v.id)); //as long as the video is not a video that's viewed already
            while(rec_videos.length < count && unwatched_videos.length > 0) {
                const rand_ind = Math.floor(Math.random()*unwatched_videos.length);
                rec_videos.push(unwatched_videos[rand_ind].id);
                unwatched_videos.splice(rand_ind,1); //delete 1 element starting at that index
            }
        }

        //if still not enough get random videos even if it's viewed
        if(rec_videos.length < count) {
            const leftover_vid = all_videos.filter(v => !rec_videos.some(rec_vid => rec_vid === v.id)); //as long as its not a rec vid already
            while(rec_videos.length < count && leftover_vid.length > 0){
                const rand_ind = Math.floor(Math.random()*leftover_vid.length);
                rec_videos.push(leftover_vid[rand_ind].id);
                leftover_vid.splice(rand_ind,1);
            }
        }

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

router.get("/manifest/:id", (req: any, res: any) => {
    try{
        const id = req.params.id;
        const manifestPath = `/var/html/media/${id}.mpd`;
        console.log("manifest path:", manifestPath);
        console.log("EXISTS?", fs.existsSync(manifestPath));
        if(fs.existsSync(manifestPath)) 
            return res.sendFile(manifestPath);
        return res.status(200).json({status:"ERROR",error:true,message:"manifest not found. for /api/manifest/:id"});
    } catch(err) {
        return res.status(200).json({status:"ERROR",error:true,message:"internal server error from /api/manifest/:id most likely the manifestPath attempt to read does not work"});
    }

});

router.get("/thumbnail/:id", (req: any, res: any) => {
    try {
        const id = req.params.id;
        const thumbnailPath = `/var/html/media/${id}.jpg`;
        console.log("thumbnail path:", thumbnailPath);
        if(fs.existsSync(thumbnailPath))
            return res.sendFile(thumbnailPath);
        return res.status(200).json({status:"ERROR",error:true,message:"thumbnail not found. for /api/thumbnail/:id"});
    } catch(err) {
        return res.status(200).json({status:"ERROR",error:true,message:"internal server error from api/thumbnail/:id most likely the thumbnailPath attempts to read does not work"});
    }
});

export default router;