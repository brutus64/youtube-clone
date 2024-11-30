import { Worker } from "bullmq";
import { redisConfig } from "../configs/redisConfig.js";
import { videoCollection } from "../mongoClient/db.js";
import { exec } from "child_process";
import path from "path";
import fs from "fs";

const worker = new Worker('uploadQueue', async job => {
    console.log(`PROCESSING JOB ${job.id} IN WORKER`);
    const { filename_path, videoId, userId, title } = job.data
    const outputDir = '/var/html/media';
    const inFile = path.join(outputDir, filename_path);
    // const outputDir = path.join('/root/youtube-clone/media', videoId.toString());

    // create output directory if it doesn't exist
    if (!fs.existsSync(inFile)) {
        console.log("INPUT FILE DOES NOT EXIST IN WORKER");
    }

    // run the bash script to process the video
    const scriptPath = path.join('/var/html/milestone2','dashscript.sh');
    const command = `bash ${scriptPath} ${filename_path} ${videoId}`;

    //exec will have a mutex lock to finish command run first then it will run the callback to update video
    exec(command, async (error, stdout, stderr) => {
        if (error) {
            console.log(`Error processing video in /api/upload: ${error.message}`);
            await videoCollection.updateOne(
                {_id:videoId},
                {$set:{status:"error"}}
            )
            return;
        }

        // Update video metadata with status 'complete'
        await videoCollection.updateOne(
            {_id:videoId},
            {$set:{
                status: 'complete',
                manifest_path: path.join('/var/html/media', `${videoId}.mpd`),
                thumbnail_path: path.join('/var/html/media', `${videoId}.jpg`)
            }}
        )

    })
}, {connection: redisConfig})

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
// console.log("Worker started?");
export default worker;