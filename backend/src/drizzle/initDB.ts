import { db } from '../drizzle/db.js';
import { user, video } from '../drizzle/schema.js'
import fs from 'fs';
import runMigrations from './migration.js';
const mediaPath = "/var/html/media"

async function initUser(){
    const user_init_query = await db.select().from(user);
    if(user_init_query.length <= 0){
        await db.insert(user).values({
            username: "a",
            email: "danny.wang.2@stonybrook.edu",
            password: "a",
            disabled: false,
            verification_key: "10fce3367c91c2643b4dc9720b9f7dc8"
        });
        console.log("DB initialized with USER");
    }
    else
        console.log("DB already has stuff did not initialize USER");
}

async function initVideos() {
    const video_init_query = await db.select().from(video);
    if(video_init_query.length <= 0) {
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
        console.log("DB initialized with VIDEO");
    }
    else
        console.log("DB already has stuff did not initialize VIDEO");

}

async function initDB(){
    await runMigrations();
    await initUser();
    await initVideos();
}
export default initDB;
// initVideos().catch((err)=>{ console.log('ERROR: ' + err); });
// initUser().catch((err) => { console.log("error" + err)});