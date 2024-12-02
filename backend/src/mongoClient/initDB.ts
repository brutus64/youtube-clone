import { MongoClient, ObjectId } from 'mongodb';
import { db } from './db.js';
import fs from 'fs';

// import runMigrations from './migration.js';
const mediaPath = "/var/html/media"

async function reset() {
    //drop existing collections
    await db.collection("users").drop();
    await db.collection("videos").drop();
    await db.collection("vid_like").drop();
    await db.collection("view").drop();
    await db.collection("user_sessions").drop();
    //create collection
    await db.createCollection('users');
    await db.createCollection('videos');
    await db.createCollection('vid_like');
    await db.createCollection('view');
    await db.createCollection('user_sessions');

    //create/delete indexes
    await db.collection("vid_like").dropIndexes();
    await db.collection("vid_like").createIndex({user_id:1,video_id:1},{ unique: true })
}
async function initUser(){
    const userCollection = db.collection("users");
    await userCollection.insertOne({
        _id: "init" as any,
        username: 'a',
        email: 'danny.wang.2@stonybrook.edu',
        password: 'a',
        disabled: false,
        verification_key: '10fce3367c91c2643b4dc9720b9f7dc8'
    });
    console.log("DB initialized with USER");
}

async function initVideos() {
    const videoCollection = db.collection("videos");
    fs.readFile(mediaPath+'/m2.json', 'utf8', async (err: any, data: any) => {
        if(err)
            console.log("ERROR: "+err)
        let dataParsed = JSON.parse(data);
        for(let i = 1; i <= 300; i++) {
            const title = dataParsed["v"+i];
            const mpdPath = mediaPath + "/v"+i+".mpd";
            const jpgPath = mediaPath + "/v"+i+".jpg";
            await videoCollection.insertOne({
                _id: "v"+i as any,
                title: title,
                description: title,
                status: 'complete',
                like: 0,
                dislike: 0,
                views: 0,
                uploaded_by: undefined,
                manifest_path: mpdPath,
                thumbnail_path: jpgPath
            });
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
