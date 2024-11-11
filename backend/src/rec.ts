import { Gorse } from "gorsejs";
import { db } from "./drizzle/db";
import { video,view } from "./drizzle/schema";
import { and, eq, inArray, notInArray, sql } from "drizzle-orm";

const client = new Gorse({
    endpoint: "http://127.0.0.1:8088",
    secret:"MlmuDfkcU4Wl2SzGtfwSOhTVXKG2Pgmq"
})

export function insertRating(uid: string, vid: string, type: string) {
    client.insertFeedbacks([{
        FeedbackType: type,
        UserId: uid,
        ItemId: vid,
        Timestamp: new Date()
    }]);
}

export function deleteRating(uid: string, vid: string, type: string) {
    client.deleteFeedback({
        type: type,
        userId: uid,
        itemId: vid,
    });
}

// return list of <num> video ids
export async function recommend(uid: string, num: number) {
    const recommendations = await client.getRecommend({
        userId: uid,
        cursorOptions: {n: num},
    });

    //not enough recommendations: insert random unwatched videos
    //does gorse already use as much videos as it can recommend (even bad recommendations)?
    if (recommendations.length < num) { 
        const uidViews = await db.select({vid:view.video_id}).from(view).where(eq(view.user_id,uid));
        const unwatched = await db.select({vid:video.id}).from(video).where(notInArray(video.id,uidViews));
        const notReccAndUnwatched = unwatched.filter(vid => !recommendations.includes(vid));
        
        for (let i = 0; i < notReccAndUnwatched.length; i++) {
            recommendations.push(notReccAndUnwatched[i]);
            if (recommendations.length == num)
                break;
        }

        //no more unwatched videos: insert watched videos
        if (recommendations.length < num) {
            const watched = await db.select({vid:video.id}).from(video).where(inArray(video.id,uidViews)).limit(num-recommendations.length);
            recommendations.push.apply(recommendations,watched);
        }

        // if there are still less than <num> videos in recommendation
        // array at this point, append videos already in the array
        while (recommendations.length < num) {
            let randInd = Math.floor(Math.random() * recommendations.length);
            recommendations.push(recommendations[randInd]);
        } //this will infinite loop if there are zero videos in the system
    }
    return recommendations;
}