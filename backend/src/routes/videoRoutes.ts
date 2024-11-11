import { Router } from "express";
import { authMiddlware } from "../middleware/auth";
import { db } from "../drizzle/db";
import { video, view, vid_like } from "../drizzle/schema";
import { and, eq, sql } from "drizzle-orm";
import path from "path";
import fs from "fs";
import multer from "multer";
import { exec } from "child_process";
import { uploadQueue } from "../redis/uploadQueue";
import { insertRating } from "../rec";

const router = Router();
const upload = multer({ dest: '/var/html/media', limits: { fileSize: 100 * 1024 * 1024}})
router.use(authMiddlware);



router.post("/like", async (req: any, res: any) => {
    try {
        const { id, value } = req.body;
        const video_query = await db.select().from(video).where(eq(video.id, id));
        if (video_query.length === 0)
            return res.status(200).json({status: "ERROR",error:true,message:"video does not exist"});
        const like_query = await db.select().from(vid_like).where(eq(vid_like.video_id,id));
        //video never seen or liked before
        if(like_query.length === 0){
            const like_record = {
                user_id: req.user_id,
                video_id: id,
                liked: value, //can be null
            };
            await db.insert(vid_like).values(like_record);
        } 
        else { //like_query already exists
            if(like_query[0].liked === value && (value === true || value === false))
                return res.status(200).json({status: 'ERROR', error: true, message: "cannot submit the same value in /api/like"});
            await db.update(vid_like).set({ liked: value }).where(and(eq(vid_like.user_id,req.user_id),(vid_like.video_id,id)));
        }
        //START UPDATING VIDEO DATA DEPENDING ON LIKE VALUE
        //already confirmed to be different values
        if(value) { //liked the video (originally could be null need to separate cases)
            await db.update(video).set({
                like: sql`${video.like} + 1`,
            }).where(eq(video.id,id));
            if(like_query[0] !== undefined && like_query[0].liked === false) //if it was originally disliked
                await db.update(video).set({
                    dislike: sql`${video.dislike} - 1`
                }).where(eq(video.id,id));
            insertRating(req.user_id,id,"like");
        }
        else {
            await db.update(video).set({
                dislike: sql`${video.dislike} + 1`,
            }).where(eq(video.id,id));
            if(like_query[0] !== undefined && like_query[0].liked === true)
                await db.update(video).set({
                    like: sql`${video.like} - 1`
                }).where(eq(video.id,id));
            insertRating(req.user_id,id,"dislike")
        }
        const new_record = await db.select({like: video.like}).from(video).where(eq(video.id,id));
        return res.status(200).json({ status:"OK", likes: new_record[0].like });
        // Allow a logged in user to “like” a post specified by id. value = true  if thumbs up, value = false if thumbs down and null if the user did not “like” or “dislike” the video.
        // Response format: {likes: number} which is the number of likes on the post. This api should return an error if the new “value” is the same as was already previously set.
    } catch(err) {
        return res.status(200).json({ status:"ERROR", error: true, message: "internal server error in /api/like: "+err});
    }
});

//multer handling mp4File will go into req.file
router.post("/upload", upload.single('mp4File'), async (req:any, res:any) => {
    try{
        const { author, title } = req.body;
        const file = req.file;
        const user_id = req.user_id;
        if (!file) 
            return res.status(200).json({ status: "ERROR", error: true, message: "No file uploaded at /api/upload" });
        const originalPath = file.path;
        const newPath = originalPath + '.mp4';
        fs.renameSync(originalPath, newPath);
        const fileName = file.filename;
        //inserts into db basic stuff and gets id of video
        const [video_id] = await db.insert(video).values({
            id: `v${fileName}`,
            title: title, 
            status: 'processing',
            uploaded_by: req.user_id,
            manifest_path: '',
            thumbnail_path: '',
        }).returning( { id: video.id });
        const videoId = video_id.id;
        const filename_path = file.filename + '.mp4';

        console.log("filename_path in /api/upload:", filename_path);
        await uploadQueue.add('process-upload', {
            filename_path,
            videoId,
            userId: user_id,
            title
        });
        return res.status(200).json({status: "OK", videoId: videoId});
    } catch(err) {
        return res.status(200).json({ status:"ERROR", error:true, message: "internal server error in /api/upload"});
    }
});

router.post("/view", async (req: any, res: any) => {
    try {
        const { id } = req.body;
        const view_query = await db.select().from(view).where(and(eq(view.video_id,id),eq(view.user_id,req.user_id)));

        //never viewed before

        //Theory: It should be impossibled for a view row to be created if this is never called before, impossible for view to be false.
        //*************************************************************** */
        //MAY NEED TO CHANGE LATER DEPENDING ON IMPLEMENTATION OF UPLOAD, COULD INSERT VALUES AT THAT POINT OR JUST DO IT ONLY WHEN THIS IS CALLED
        let viewed_before = false;
        if(view_query.length === 0) {
            await db.insert(view).values({
                user_id: req.user_id,
                video_id: id,
                viewed: true,
            });
        }
        else
            viewed_before = true;

        insertRating(req.user_id,id,"view");
        // POST /api/view { id }
        // Mark video “id” as viewed by the logged in user.  This API call should be made by the UI on videos that were not previously watched whenever that video is first “played” for the user. 
        // Response format: {viewed: Boolean}, viewed = true if user has viewed this post before and false otherwise
        return res.status(200).json({status: "OK", viewed: viewed_before});
    } catch(err) {
        return res.status(200).json({status:"ERROR",error:true,message:"internal server error at /api/view"});
    }
});

interface VideoStatus {
    id: string | null;
    title: string | null;
    status: string | null;
}
router.post("/processing-status", async (req: any, res: any) => {
    try{
        const video_query = await db.select().from(video).where(eq(req.username,video.uploaded_by));
        const videos: VideoStatus[] = [];
        if(video_query.length > 0){
            video_query.forEach(vid => {
                videos.push({id: vid.id, title: vid.title, status: vid.status});
            })
        }
        //im assuming it is okay to return empty array if there's nothing uploaded
        return res.status(200).json({status: "OK", videos: videos});
    }catch(err){
        console.log("internal server error at /api/processing-status:", err);
        return res.status(200).json({status:"ERROR", error:true, message: "internal server error at /api/processing-status"});
    }
});

export default router;