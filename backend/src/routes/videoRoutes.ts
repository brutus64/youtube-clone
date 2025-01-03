import { Router } from "express";
import { authMiddlware } from "../middleware/auth.js";
import { likeCollection, videoCollection, viewCollection } from "../mongoClient/db.js";
import { ObjectId } from "mongodb";
import path from "path";
import multer from "multer";
import { exec } from "child_process";
import { uploadQueue } from "../redis/uploadQueue.js";
import { Worker } from "bullmq";
import { redisConfig } from "../configs/redisConfig.js";
import { Client } from "memjs";
import crypto from 'crypto';

const router = Router();

// const mc = Client.create("localhost:11211");

const storage = multer.diskStorage({
    destination: '/var/html/media',
    filename: function (req:any, file:any, cb:any) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + '.mp4')
    }
})

//Ideal to actually insert the video into filesystem rather than send it to memory, disk is faster than network transfer in the case of the server we're running
// const upload = multer({ dest: '/var/html/media', limits: { fileSize: 900 * 1024 * 1024}})
const upload = multer({storage: storage});

//The option to use in memory storage for uploading video files.
// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage , limits: { fileSize: 900 * 1024 * 1024}})

router.use(authMiddlware);



router.post("/like", async (req: any, res: any) => {
    try {
        const { id, value } = req.body;

        //get total amount of likes from video
        const like_amount_query = await videoCollection.findOne(
            {_id:id},
            {projection:{like:1}}
        )
        if (!like_amount_query) {
            console.log("Video not found")
            return res.status(200).json({status: "ERROR",error:true,message:"video does not exist"});
        }
        const like_amount:any = like_amount_query.like;

        //Check if Video has been interacted before with Like or Dislike Button
        const like_query = await likeCollection.findOne(
            {video_id:id, user_id: req.user_id},
            {projection:{liked:1}}
        )
        const db_like_status = like_query ? like_query.liked : null;

        //Never interacted before, add entry
        if(like_query === null){
            const like_record = { //type VideoLike
                user_id: req.user_id,
                video_id: id,
                liked: value, //call be null
            };
            //optimization return early if you have the value.
            const adder = value ? 1 : 0;
            try {
                await likeCollection.insertOne(like_record);
            } catch(err) {
                console.log(err);
                return res.status(200).json({status: 'ERROR', error: true, message: "cannot submit the same value in /api/like"});
            }
            res.status(200).json({status: "OK", likes:like_amount + adder});
            
            // await mc.set(id,`${like_amount + adder}`,{ expires:15 });
            //adapt like/dislike count
            if (value === true) {
                await videoCollection.updateOne({ _id: id }, { $inc: { like: 1 } });
            } else if (value === false) {
                await videoCollection.updateOne({ _id: id }, { $inc: { dislike: 1 } });
            }
            return;
        } 
        //Check for Same Value --> Return: Error
        else {
            if(db_like_status === value)
                return res.status(200).json({status: 'ERROR', error: true, message: "cannot submit the same value in /api/like"});
        }
        let adder = value ? 1 : -1; 
        res.status(200).json({status: "OK", likes: like_amount + adder})
        //Update the DB with new liked value.
        await likeCollection.updateOne({ user_id: req.user_id, video_id: id},{ $set: { liked: value } });
        //value with like = true means like + 1, value with like = false means like -1
        
        if(value === null)
            adder = db_like_status ? -1 : 1; //if it ends up true --> null then -1, otherwise false from null then +1
        
        // await mc.set(id,`${like_amount + adder}`,{ expires:15 });
        //Adapt like/dislike count in videos table.
        if (db_like_status === true && value === false) {
            await videoCollection.updateOne({ _id: id },{ $inc: {like: -1, dislike: 1} });
        } else if (db_like_status === true && value === null){
            await videoCollection.updateOne({ _id: id },{ $inc: {like: -1} });
        } else if (db_like_status === false && value === true) {
            await videoCollection.updateOne({ _id: id },{ $inc: {like: 1, dislike: -1} });
        } else if (db_like_status === false && value === null) {
            await videoCollection.updateOne({ _id: id },{ $inc: {dislike: -1} });
        }
        return;
        
        
    } catch(err) {
        console.log(err);
        return res.status(200).json({ status:"ERROR", error: true, message: "internal server error in /api/like: "+err});
    }
});

//multer handling mp4File will upload to "/var/html/media"
router.post("/upload", upload.single('mp4File'), async (req:any, res:any) => {
    try{
        // console.log("ACCEPTING REQUEST TO /api/upload");
        const { author, title, description } = req.body;
        const file = req.file;
        const user_id = req.user_id;

        //If video file isn't uploaded, return ERROR
        if (!file) 
            return res.status(200).json({ status: "ERROR", error: true, message: "No file uploaded at /api/upload" });
        
        //rename the uploaded file to have ".mp4" as multer does not handle extensions when uploading.
        // const originalPath = file.path;
        // const newPath = originalPath + '.mp4';
        // fs.renameSync(originalPath, newPath);
        const fileName = file.filename;
        // console.log("filename with diskstorage", fileName);
        //Inserts into Video Table, the metadata for the video
        const vid_id = `v${fileName.replace(".mp4","")}`;
        // console.log("/UPLOAD fileID: ", vid_id);
        res.status(200).json({status: "OK", id: vid_id});
        //Inserts into Video Table, the metadata for the video
        await videoCollection.insertOne({
            _id: vid_id as any,
            title: title,
            description: description,
            status: 'processing',
            // like: 0,
            // dislike: 0,
            // views: 0,
            uploaded_by: req.user_id,
            manifest_path: "",
            thumbnail_path: ""
        });
        const filename_path = file.filename;

        // console.log("filename_path in /api/upload:", filename_path);

        //Adds the job to the Queue (BullMQ) to be done by a Worker
        // await uploadQueue.add('process-upload', {
        //     // fileBuffer: file.buffer,
        //     filename_path,
        //     vid_id,
        //     userId: user_id,
        //     title
        // });

        //return the video ID
        // console.log("VIDEOID upload:",vid_id);
        // return res.status(200).json({status: "OK", id: videoId});
    } catch(err) {
        console.log(err);
        return res.status(200).json({ status:"ERROR", error:true, message: "internal server error in /api/upload"});
    }
});

router.post("/view", async (req: any, res: any) => {
    try {
        const { id } = req.body;

        //Query "View" Table to see if it existed before or not (has scrolled past it before/played it before or not)
        const view_query = await viewCollection.findOne({ video_id: id, user_id: req.user_id}, { projection: { viewed: 1 } });
        let viewed_before = false;

        //Never seen before: Insert into View Table "True" as you went to that page. Also increment "views" in "Video" Table
        if(view_query === null) {
            await viewCollection.insertOne({
                user_id: req.user_id,
                video_id: id,
                viewed: true
            });
            await videoCollection.updateOne({ _id: id },{ $inc: {views: 1} });
        }
        //Else Query exists, then it must've been viewed before. Idea: For a "View" record to exist, you must interact with the Video --> in other words it has to be "Viewed" if a record exists.
        else
            viewed_before = true;

        //Return data about whether it was viewed before or not.
        return res.status(200).json({status: "OK", viewed: viewed_before});
    } catch(err) {
        console.log(err);
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
        //Query "Video" table to obtain video metadata about all videos uploaded by user
        const video_query = await videoCollection.find({ uploaded_by: req.user_id },{projection: {_id: 1, title: 1, status: 1} }).toArray();
        const videos: VideoStatus[] = [];

        //Append into an array, object of video metadata containing {VideoID, Title, Status}
        if(video_query.length > 0){
            video_query.forEach(vid => {
                // console.log("ID: ", vid.id, '\nTITLE: ', vid.title, '\nSTATUS:', vid.status);
                videos.push({id: vid._id.toString(), title: vid.title, status: vid.status});
            })
        }
        
        //Return array
        return res.status(200).json({status: "OK", videos: videos});
    }catch(err){
        console.log("internal server error at /api/processing-status:", err);
        return res.status(200).json({status:"ERROR", error:true, message: "internal server error at /api/processing-status"});
    }
});

const worker = new Worker('uploadQueue', async job => {
    // console.log(`PROCESSING JOB ${job.id} IN WORKER`);
    // Situation: If we had to upload from memoryStorage (multer) into disk, use this.
    // const { fileBuffer, filename_path, videoId, userId, title } = job.data
    // const outputDir = path.join('/root/youtube-clone/media', videoId.toString());
    // fs.writeFileSync(inFile, Buffer.from(fileBuffer));

    const { filename_path, videoId, userId, title } = job.data
    const outputDir = '/var/html/media';
    const inFile = path.join(outputDir, filename_path);


    // Check that MP4 File exists at correct path
    // if (!fs.existsSync(inFile)) {
    //     console.log("INPUT FILE DOES NOT EXIST IN WORKER");
    // }

    // Obtain bash script command to run FFMPEG script.
    const scriptPath = path.join('/var/html/milestone2','dashscript.sh');
    const command = `bash ${scriptPath} ${filename_path} ${videoId}`;

    //exec will have a mutex lock to finish command run first then it will run the callback to update video
    exec(command, async (error, stdout, stderr) => {
        if (error) {
            console.log(`Error processing video in /api/upload: ${error.message}`);
            await videoCollection.updateOne({ _id: videoId }, { $set: { status: 'error' } } );
            return;
        }

        // console.log("ffmpeg output:", stdout);
        // Update video metadata with status 'complete'
        await videoCollection.updateOne({ _id: videoId }, { $set: { status: 'complete', manifest_path: path.join('/var/html/media', `${videoId}.mpd`), thumbnail_path: path.join('/var/html/media', `${videoId}.jpg`) } } );
    });

    //Workers run in the backend and execute the jobs, the jobs are in a queue stored in redis, workers puts a mutex lock on the job when working and has to update statuses in Redis durign it's work process through it.
// }, {connection: redisConfig, concurrency: 1})
}, {
    connection: redisConfig,
    concurrency: 2, 
    limiter: {
        max: 5,
        duration: 1000
    }
});


//Worker progress report prints:
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