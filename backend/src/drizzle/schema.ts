import {boolean, serial, text, integer, json, timestamp, pgTable, primaryKey } from "drizzle-orm/pg-core"

export const user = pgTable("user", {
    id: serial("id").primaryKey(),
    username: text("username"),
    email: text("email"),
    password: text("password"),
    disabled: boolean("disabled").default(true),
    verification_key: text("verification_key")
    //require a list of uploaded videos (probably its id)
    //list of what a user has liked
    //list of what a user has disliked
    //required list of videos viewed
});

export const session = pgTable("session", {
    sid: text("sid").primaryKey(),
    sess: json("sess"),
    expire: timestamp("expire")
});

export const video = pgTable("video", {
    id: text("id").primaryKey(),
    title: text("title"),
    description: text("description"),
    like: integer("like").default(0),
    dislike: integer("dislike").default(0),
    status: text("status"),//for processing status
    views: integer("views").default(0),//view count
    uploaded_by: integer("uploaded_by").references(() => user.id),
    manifest_path: text("manifest_path"),
    thumbnail_path: text("thumbnail_path")
});

//user and videos relationship: Many to Many, a user can like multiple videos
//a video can be liked by mulltiple users
export const vid_like = pgTable("vid_like", {
    user_id: integer("user_id").references(() => user.id),
    video_id: text("video_id").references(() => video.id),
    liked: boolean("liked"),
}, (table) => {
    return {
        pk: primaryKey({ columns: [table.user_id, table.video_id]})
    };
});

export const view = pgTable("view", {
    user_id: integer("user_id").references(() => user.id),
    video_id: text("video_id").references(() => video.id),
    viewed_at: timestamp("viewed_at").defaultNow()
}, (table) => {
    return {
        pk: primaryKey({ columns: [table.user_id, table.video_id]})
    };
});