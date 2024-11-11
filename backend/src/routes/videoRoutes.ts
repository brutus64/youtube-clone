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
import { Worker } from "bullmq";
import { redisConfig } from "../configs/redisConfig";

const router = Router();
const upload = multer({ dest: '/var/html/media', limits: { fileSize: 900 * 1024 * 1024}})
// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage , limits: { fileSize: 900 * 1024 * 1024}})
router.use(authMiddlware);



router.post("/like", async (req: any, res: any) => {
    try {
        const { id, value } = req.body;
        //check if video_likes already exist 
        const video_query = await db.select().from(video).where(eq(video.id, id));
        if (video_query.length === 0)
            return res.status(200).json({status: "ERROR",error:true,message:"video does not exist"});
console.log("VALUE: "+value);

        //check if vid_like exists already
        const like_query = await db.select().from(vid_like).where(and(eq(vid_like.video_id,id),eq(vid_like.user_id,req.user_id)));

        const db_like_status = like_query[0]?.liked;
console.log("db_like_status: "+db_like_status);
        //video never seen or liked before
        if(like_query.length === 0){
            const like_record = {
                user_id: req.user_id,
                video_id: id,
                liked: value, //can be null
            };
            await db.insert(vid_like).values(like_record);
            if (value === true) {
                await db.update(video).set({
                    like: sql`${video.like} + 1`
                }).where(eq(video.id, id));
            } else if (value === false) {
                await db.update(video).set({
                    dislike: sql`${video.dislike} + 1`
                }).where(eq(video.id, id));
            }
        } 
        else { //like_query already exists
            //
            if(db_like_status === value)
                return res.status(200).json({status: 'ERROR', error: true, message: "cannot submit the same value in /api/like"});
        }
        await db.update(vid_like).set({ liked: value }).where(and(eq(vid_like.user_id,req.user_id),eq(vid_like.video_id,id)));
        //START UPDATING VIDEO DATA DEPENDING ON LIKE VALUE
        //already confirmed to be different values
        if (db_like_status === true && value === false) {
            await db.update(video).set({
                like: sql`${video.like} - 1`,
                dislike: sql`${video.dislike} + 1`
            }).where(eq(video.id,id));
        } else if (db_like_status === true && value === null){
            await db.update(video).set({
                like: sql`${video.like} - 1`
            }).where(eq(video.id,id));
        } else if (db_like_status === false && value === true) {
            await db.update(video).set({
                like: sql`${video.like} + 1`,
                dislike: sql`${video.dislike} - 1`
            }).where(eq(video.id,id));
        } else if (db_like_status === false && value === null) {
            await db.update(video).set({
                dislike: sql`${video.dislike} - 1`
            }).where(eq(video.id,id));
        }
        
        const new_record = await db.select({like: video.like}).from(video).where(eq(video.id,id));
        return res.status(200).json({ status:"OK", likes: new_record[0].like });
        
    } catch(err) {
        return res.status(200).json({ status:"ERROR", error: true, message: "internal server error in /api/like: "+err});
    }
});

//multer handling mp4File will go into req.file
router.post("/upload", upload.single('mp4File'), async (req:any, res:any) => {
    try{
        console.log("ACCEPTING REQUEST TO /api/upload");
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
            // fileBuffer: file.buffer,
            filename_path,
            videoId,
            userId: user_id,
            title
        });
        console.log("VIDEOID upload:",videoId);
        return res.status(200).json({status: "OK", id: videoId});
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
router.get("/processing-status", async (req: any, res: any) => {
    try{
// console.log("user ids: "+req.user_id,video.uploaded_by);
        const video_query = await db.select().from(video).where(eq(req.user_id,video.uploaded_by));
        const videos: VideoStatus[] = [];
        if(video_query.length > 0){
            video_query.forEach(vid => {
                console.log("ID: ", vid.id, '\nTITLE: ', vid.title, '\nSTATUS:', vid.status);
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

const worker = new Worker('uploadQueue', async job => {
    console.log(`PROCESSING JOB ${job.id} IN WORKER`);
    // const { fileBuffer, filename_path, videoId, userId, title } = job.data
    const { filename_path, videoId, userId, title } = job.data
    const outputDir = '/var/html/media';
    const inFile = path.join(outputDir, filename_path);
    // const outputDir = path.join('/root/youtube-clone/media', videoId.toString());
    // fs.writeFileSync(inFile, Buffer.from(fileBuffer));
    // create output directory if it doesn't exist
    if (!fs.existsSync(inFile)) {
        console.log("INPUT FILE DOES NOT EXIST IN WORKER");
    }

    // run the bash script to process the video
    const scriptPath = path.join('/var/html/milestone2','dashscript.sh');
    const command = `bash ${scriptPath} ${filename_path} ${videoId}`;

    //exec will have a mutex lock to finish command run first then it will run the callback to update video
    // return new Promise((resolve, reject) => {
        exec(command, async (error, stdout, stderr) => {
            if (error) {
                console.log(`Error processing video in /api/upload: ${error.message}`);
                await db.update(video).set({ status: 'error' }).where(eq(video.id, videoId));
                // reject(error);
                return;
            }

            console.log("ffmpeg output:", stdout);
            // Update video metadata with status 'complete'
            await db.update(video).set({
                status: 'complete',
                manifest_path: path.join('/var/html/media', `${videoId}.mpd`),
                thumbnail_path: path.join('/var/html/media', `${videoId}.jpg`)
            }).where(eq(video.id, videoId));
            // resolve(true);
        });
    // });
}, {connection: redisConfig, concurrency: 1})

worker.on('active', job => {
    console.log(`process-upload job ${job.id} is now active. working on it!`);
});

worker.on('completed', job => {
    console.log(`process-upload job ${job.id} has completed!`);
});

worker.on('failed', (job : any,err) => {
    console.log(`job failed to upload ${job.id} with err: ${err.message}`)
});
worker.on('ready', () => {
    console.log('Worker successfully connected to Redis');
});

export default router;