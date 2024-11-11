import { db } from '../drizzle/db';
import { video } from '../drizzle/schema'
import fs from 'fs';

const mediaPath = "/var/html/media"

async function initVideos() {
    fs.readFile(mediaPath+'/m2.json', 'utf8', async (err: any, data: any) => {
        if(err)
            console.log("ERROR: "+err)
        let dataParsed = JSON.parse(data);
        for(let i = 1; i <= 300; i++) {
            const title = dataParsed["v"+i];
            const mpdPath = mediaPath + "/v"+i+".mpd";
            const jpgPath = mediaPath + "/v"+i+".jpg";
            // console.log(title +" "+ mpdPath +" "+ jpgPath);
            await db.insert(video).values({
                id: "v"+i,
                title: title,
                description: title,
                like: 0,
                dislike: 0,
                status: 'complete',
                views: 0,
                uploaded_by: 1,  //userID?
                manifest_path: mpdPath,
                thumbnail_path: jpgPath
            });
        }
    });
}

initVideos().catch((err)=>{ console.log('ERROR: ' + err); });