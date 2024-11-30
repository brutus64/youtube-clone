import { MongoClient } from 'mongodb';
import { db } from './db.js';
import { User, Video, VideoLike, VideoView } from './schema.js'

import fs from 'fs';
import runMigrations from './migration.js';
const mediaPath = "/var/html/media"

async function reset() {
    //drop existing collections
    db.collection<User>("users").drop().catch((err:any)=>{});
    db.collection<Video>("videos").drop().catch((err:any)=>{});
    db.collection<VideoLike>("vid_like").drop().catch((err:any)=>{});
    db.collection<VideoView>("view").drop().catch((err:any)=>{});
    //create collection
    // const userCollection = db.collection<User>("users");
    // const videoCollection = db.collection<Video>("videos");
    // const likeCollection = db.collection<VideoLike>("vid_like");
    // const viewCollection = db.collection<VideoView>("view");
    //TODO Indexes
}
async function initUser(){
    const userCollection = db.collection<User>("users");
    let user:User = {
        _id: 'danny.wang.2@stonybrook.edu',
        username: 'a',
        email: 'danny.wang.2@stonybrook.edu',
        password: 'a',
        disabled: false,
        verification_key: '10fce3367c91c2643b4dc9720b9f7dc8'
    }
    await userCollection.insertOne(user);
    console.log("DB initialized with USER");
}

async function initVideos() {
    const videoCollection = db.collection<Video>("videos");
    fs.readFile(mediaPath+'/m2.json', 'utf8', async (err: any, data: any) => {
        if(err)
            console.log("ERROR: "+err)
        let dataParsed = JSON.parse(data);
        for(let i = 1; i <= 300; i++) {
            const title = dataParsed["v"+i];
            const mpdPath = mediaPath + "/v"+i+".mpd";
            const jpgPath = mediaPath + "/v"+i+".jpg";
            let vid:Video = {
                _id: "v" + i,
                title: title,
                description: title,
                status: 'complete',
                like: 0,
                dislike: 0,
                views: 0,
                uploaded_by: undefined,
                manifest_path: mpdPath,
                thumbnail_path: jpgPath
            };
            await videoCollection.insertOne(vid);
        }
    });
    console.log("DB initialized with VIDEO");
}

async function initDB(){
    await reset();
    await initUser();
    await initVideos();
}
export default initDB;
