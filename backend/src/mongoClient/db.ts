import { MongoClient } from 'mongodb';
import { User, Video, VideoLike, VideoView } from './schema';

const url = process.env.DATABASE_URL;
if (!url) {
    throw new Error("Database URL was not set");
}

const client = new MongoClient(url, {
    maxPoolSize: 75,  // Max number of concurrent connections in the pool
    connectTimeoutMS: 10000  // Timeout for connecting
});

async function connectToDB() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        return client.db('youtube'); //name of db
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;
    }
}

export const db = await connectToDB();
export const userCollection = db.collection("users");
export const videoCollection = db.collection("videos");
export const likeCollection = db.collection("vid_like");
export const viewCollection = db.collection("view");