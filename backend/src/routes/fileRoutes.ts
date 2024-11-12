import { Router } from "express";
import { authMiddlware } from "../middleware/auth";
import fs from "fs";
import { recommend } from "../rec";
import { db } from "../drizzle/db";
import { vid_like,view,video } from "../drizzle/schema";
import { eq,and } from "drizzle-orm";
import axios from "axios";
const router = Router();

router.use(authMiddlware);

// parameter in body count req.body
router.post("/videos", async (req:any , res:any) => {
    try {
        const { count } = req.body;
        const userId = req.user_id;

        //user liked videos
        const userLikes = await db.select({
            videoId: vid_like.video_id,
            liked: vid_like.liked
        }).from(vid_like)
        .where(eq(vid_like.user_id, userId));

        //all user's liked videos
        const allLikes = await db.select({
            userId: vid_like.user_id,
            videoId: vid_like.video_id,
            liked: vid_like.liked
        }).from(vid_like);

        //all user's viewed videos
        const viewedVideos = await db.select({
            videoId: view.video_id
        }).from(view)
        .where(eq(view.user_id, userId));

        //send
        const recommendationResponse = await axios.post('http://localhost:5001/recommend', {
            userId,
            userLikes,
            allLikes,
            viewedVideos: viewedVideos.map(v => v.videoId),
            count
        });
         // Get recommended video details
         const recommendedVideos = await Promise.all(
            recommendationResponse.data.videos.map(async (videoId: string) => {
                const [videoData] = await db.select().from(video).where(eq(video.id, videoId));
                const [userLike] = await db.select().from(vid_like)
                    .where(and(
                        eq(vid_like.video_id, videoId),
                        eq(vid_like.user_id, userId)
                    ));
                const watched = viewedVideos.some(v => v.videoId === videoId);

                return {
                    id: videoId,
                    description: videoData?.description || "",
                    title: videoData?.title || "",
                    watched,
                    liked: userLike?.liked ?? null,
                    likevalues: videoData?.like || 0
                };
            })
        );

        return res.status(200).json({ status: "OK", videos: recommendedVideos });
    }catch (err){

    }
})
// router.post("/videos", async (req: any, res: any) => {
//     try{
//         const { count } = req.body;
//         const ret_arr = await recommend(req.user_id,count);
//         console.log(ret_arr);
//         return res.status(200).json({status:"OK", videos:ret_arr})
//     }catch(err){
//         return res.status(200).json({status:"ERROR",error:true,message:"internal server error on /api/videos, most likely when reading file"});
//     }
// });

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