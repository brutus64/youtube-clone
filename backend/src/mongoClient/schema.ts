import { MongoClient, ObjectId } from 'mongodb';
export interface User {
    _id: string | ObjectId;
    username: string;
    email: string;
    password: string;
    disabled: boolean; // default: true
    verification_key: string;
}
export interface Video {
    _id: string | ObjectId;
    title: string;
    description: string;
    status: string; // for processing status
    like: number;
    dislike: number;
    views: number;
    uploaded_by: string; // ref to User._id
    manifest_path: string;
    thumbnail_path: string;
}
//user and videos relationship: Many to Many, a user can like multiple videos
//a video can be liked by mulltiple users
export interface VideoLike {
    _id: string;
    user_id: string;
    video_id: string;
    liked: boolean | null;
}
export interface VideoView {
    _id: string;
    user_id: string;
    video_id: string;
    viewed: boolean;
}