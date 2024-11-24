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

        if (videoId) { // video similarity algorithm
            rec_videos = await videoSimilarity(videoId,req.user_id,count);
        }
        else { // user similarity algorithm
            rec_videos = await userSimilarity(req.user_id,count);
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