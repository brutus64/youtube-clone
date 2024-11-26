import { Router } from "express";
import { authMiddlware } from "../middleware/auth";
import fs from "fs";
import { userSimilarity, videoSimilarity } from "../rec";
import { and, eq } from "drizzle-orm";
import { db } from "../drizzle/db";
import { user, vid_like, video, view } from "../drizzle/schema";


const router = Router();

router.use(authMiddlware);



// parameter in body count req.body
router.post("/videos", async (req:any , res:any) => {
    try {
        const { videoId, count } = req.body;
        let rec_videos:any;

        // we should query database here, so we can reuse the data below
        const users = await db.select().from(user);
        const all_likes = await db.select().from(vid_like);
        const avoid_viewed_query = await db.select({video_id:view.video_id}).from(view).where(
            and(
                eq(view.user_id,uid),
                eq(view.viewed,true)
            )
        );
        const avoid_viewed_videos = new Set(avoid_viewed_query.map(view => view.video_id));
        const all_videos = await db.select({ //query subset of columns for slightly better performance
            id:video.id,
            description:video.description,
            title:video.title,
            like:video.like,
        }).from(video);
    
        if (videoId) { // video similarity algorithm
            rec_videos = await videoSimilarity(videoId,req.user_id,count,users,all_likes,avoid_viewed_videos,all_videos);
        }
        else { // user similarity algorithm
            rec_videos = await userSimilarity(req.user_id,count,users,all_likes,avoid_viewed_videos,all_videos);
        }

        // create a hashmap mapping all video ids liked/disliked by the user to the like value
        const user_liked_map = new Map();
        for (const likeobj of all_likes.filter(like => like.user_id === req.user_id))
            user_liked_map.set(likeobj.video_id,likeobj.liked);

        // create a hashmap mapping all video ids to video data
        const id_to_data = new Map();
        for (const vid in all_videos)
            id_to_data.set(vid.id,vid);

        const details = rec_videos.map(rec_vid_id => {
            const video_data = id_to_data.get(rec_vid_id);//const video_data = await db.select().from(video).where(eq(video.id,rec_vid_id)); //get the video data
            const user_liked = (user_liked_map.has(rec_vid_id)) ? user_liked_map.get(rec_vid_id) : null;
            const viewed = avoid_viewed_videos.has(rec_vid_id);
            return {
                id: rec_vid_id,
                description: video_data.description,
                title: video_data.title,
                watched: viewed,
                liked: user_liked,
                likevalues: video_data.like,
            };
        })
        
        //any vid_like.user_id,vid_like.video_id combo that doesn't exist in vid_like we can assume the user has never clicked on like or dislike so its null
        //any view.user_id, view.video_id combo that doesn't exist in view, we can assume the user has never watched it before
        res.status(200).json({status:"OK", videos: details});
    }catch(err:any){
        return res.status(200).json({status:"ERROR", error:true, message:`internal server error in /api/videos: ${err.message}`})
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