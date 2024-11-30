import { Router } from "express";
import { authMiddlware } from "../middleware/auth.js";
import fs from "fs";
import { userSimilarity, videoSimilarity } from "../rec.js";
import { and, eq } from "drizzle-orm";
import { db, likeCollection, videoCollection, viewCollection } from "../mongoClient/db.js";
import { ObjectId } from 'mongodb';
import { User, Video, VideoLike, VideoView } from "../mongoClient/schema.js";


const router = Router();

router.use(authMiddlware);

// parameter in body count req.body
router.post("/videos", async (req:any , res:any) => {
    try {
        const { videoId, count } = req.body;
        let rec_videos:any;

        //get video data and pass it into funtion instead of querying twice
        const video_data = await videoCollection.find(
            {}, //filter
            { projection: { _id: 1, title: 1, description: 1, like: 1 } } //feilds to return
        ).toArray();
        if (videoId) { // video similarity algorithm
            rec_videos = await videoSimilarity(videoId,req.user_id,count,video_data);
        }
        else { // user similarity algorithm
            rec_videos = await userSimilarity(req.user_id,count,video_data);
        }
        const user_liked = await likeCollection.find(
            { user_id: new ObjectId(req.user_id) }, 
            { projection: { video_id: 1, liked: 1 } }
        ).toArray();
        const user_viewed = await viewCollection.find(
            { user_id: new ObjectId(req.user_id) },
            { projection: { video_id: 1, viewed: 1 } }
        ).toArray();

        let hashmap = new Map();
        video_data.forEach(video => {
            hashmap.set(video.id, {
                id: video.id,
                title: video.title,
                description: video.description,
                likevalues: video.like,
                watched: false,
                liked: null,
            });
        });
        user_liked.forEach((entry:any) => {
            hashmap.get(entry.video_id).liked = entry.liked;
        });
        user_viewed.forEach((entry:any)=>{
            hashmap.get(entry.video_id).watched = entry.viewed;
        })
        const details = rec_videos.map((rec_vid_id:string) => {
            return hashmap.get(rec_vid_id);
        });

        //any vid_like.user_id,vid_like.video_id combo that doesn't exist in vid_like we can assume the user has never clicked on like or dislike so its null
        //any view.user_id, view.video_id combo that doesn't exist in view, we can assume the user has never watched it before
        res.status(200).json({status:"OK", videos: details});
    }catch(err:any){
        console.log(err)
        return res.status(200).json({status:"ERROR", error:true, message:`internal server error in /api/videos: ${err.message}`})
    }
})

//Obtains manifest id
router.get("/manifest/:id", async (req: any, res: any) => {
    try{
        const id = req.params.id;
        const manifestPath = `/var/html/media/${id}.mpd`;
// console.log("ACTUAL manifest path:", manifestPath);
// console.log("EXISTS?", fs.existsSync(manifestPath));
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
        const thumbnailPath = `/var/html/media/${id}.jpg`;
// console.log("ACTUAL thumbnail path:", thumbnailPath);
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
        const video_data = await videoCollection.findOne({ _id: new ObjectId(id) });
        if(video_data !== null) {
            console.log("Data for video id ", id, " found");
            const user_liked = await db.collection('vid_like').findOne({video_id: id, user_id: req.user_id});
            const viewed = await db.collection('view').findOne({video_id: id, user_id: req.user_id});
            const details = {
                id: id,
                description: video_data.description,
                title: video_data.title,
                watched: (viewed === null) ? false : true,
                liked: (user_liked === null) ? null : user_liked.liked,
                likevalues: video_data.like,
            }
            return res.status(200).json({status:"OK",vdata:details});
        }
        
        return res.status(200).json({status:"ERROR",error:true,message:"video id not found. for /api/video/:id"});
    } catch(err) {
        return res.status(200).json({status:"ERROR",error:true,message:"internal server error from api/video/:id"});
    }
});

export default router;