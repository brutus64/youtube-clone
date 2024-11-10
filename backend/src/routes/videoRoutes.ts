import { Router } from "express";
import { authMiddlware } from "../middleware/auth";
import { db } from "../drizzle/db";
import { video } from "../drizzle/schema";
import { vid_like } from "../drizzle/schema";
import { and, eq, sql } from "drizzle-orm";
const router = Router();

router.use(authMiddlware);

router.post("/like", async (req: any, res: any) => {
    try {
        const { id, value } = req.body;
        const video_query = await db.select().from(video).where(eq(video.id, id));
        if (video_query.length === 0)
            return res.status(200).json({status: "ERROR",error:true,message:"video does not exist"});
        const like_query = await db.select().from(vid_like).where(eq(vid_like.video_id,id));
        //video never seen or liked before
        if(like_query.length === 0){
            const like_record = {
                user_id: req.user_id,
                video_id: id,
                liked: value, //can be null
            };
            await db.insert(vid_like).values(like_record);
        } 
        else { //like_query already exists
            if(like_query[0].liked === value && (value === true || value === false))
                return res.status(200).json({status: 'ERROR', error: true, message: "cannot submit the same value in /api/like"})
            await db.update(vid_like).set({ liked: value }).where(and(eq(vid_like.user_id,req.user_id),(vid_like.video_id,id)));
        }
        //START UPDATING VIDEO DATA DEPENDING ON LIKE VALUE
        //already confirmed to be different values
        if(value) { //liked the video (originally could be null need to separate cases)
            await db.update(video).set({
                like: sql`${video.like} + 1`,
            }).where(eq(video.id,id));
            if(like_query[0].liked === false) //if it was originally disliked
                await db.update(video).set({
                    dislike: sql`${video.dislike} - 1`
                }).where(eq(video.id,id));
            
        }
        else {
            await db.update(video).set({
                dislike: sql`${video.dislike} + 1`,
            }).where(eq(video.id,id));
            if(like_query[0].liked === true)
                await db.update(video).set({
                    like: sql`${video.like} - 1`
                }).where(eq(video.id,id));
        }
        const new_record = await db.select({like: video.like}).from(video).where(eq(video.id,id));
        return res.status(200).json({ status:"OK", likes: new_record[0].like })
        // Allow a logged in user to “like” a post specified by id. value = true  if thumbs up, value = false if thumbs down and null if the user did not “like” or “dislike” the video.
        // Response format: {likes: number} which is the number of likes on the post. This api should return an error if the new “value” is the same as was already previously set.
    } catch(err) {
        return res.status(200).json({ status:"ERROR", error: true, message: "internal server error in /api/like"})
    }
});

// router.post("/videos", (req, res) => {

// });
//IT IS IN FILEROUTES.ts ALREADY

router.post("/upload", (req, res) => {
    const { author, title, mp4File } = req.body;
});

router.post("/view", (req, res) => {
    const { id } = req.body;
});

router.post("/processing-status", (req, res) => {

});

export default router;