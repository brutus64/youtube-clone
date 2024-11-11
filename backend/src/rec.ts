import { Gorse } from "gorsejs";
import { db } from "./drizzle/db";
import { vid_like,video,view } from "./drizzle/schema";
import { and, eq, inArray, notInArray } from "drizzle-orm";

const client = new Gorse({
    endpoint: "http://127.0.0.1:8088",
    secret:"MlmuDfkcU4Wl2SzGtfwSOhTVXKG2Pgmq"
})

export function insertRating(uid: string, vid: string, type: string) {
    client.upsertFeedbacks([{
        FeedbackType: type,
        UserId: uid,
        ItemId: vid,
        Timestamp: new Date()
    }]); //upsert overwrites past feedback (desired)
}


export function deleteRating(uid: string, vid: string, type: string) {
    client.deleteFeedback({
        type: type,
        userId: uid,
        itemId: vid,
    });
}

// return list of <num> video ids
export async function recommend(uid: number, num: number) {
    console.log("Getting recommendations...")
    const recommendation_ids = await client.getRecommend({
        userId: uid.toString(),
        cursorOptions: {n: num},
    });
    // Response format:
    // - id
    // - description (video)
    // - title (video)
    // - watched (view)
    // - liked (vid_like)
    // - likevalues (video)
    const recommendations:any = recommendation_ids.map(async id => {
        const vidobj:any = await db.select({
            id:video.id,
            description:video.description,
            title:video.title,
            likevalues:video.like
        }).from(video).where(eq(video.id,id));
        vidobj.liked = null; //should be null, since recommendation system only uses new videos (user has not interacted)
        vidobj.watched = false; //should be false, since recommendation system only used unwatched vids
    })

    //not enough recommendations: insert random unwatched videos
    //does gorse already use as much videos as it can recommend (even bad recommendations)?
    if (recommendations.length < num) { 
        console.log("Not enough recommendations! Getting all unwatched videos...")
        const uidViews:any = (await db.select({vid:view.video_id}).from(view).where(eq(view.user_id,uid))).map(v => v.vid);
        const unwatched = await db.select({
            id:video.id,
            description:video.description,
            title:video.title,
            likevalues:video.like
        }).from(video).where(notInArray(video.id,uidViews));
        const notReccAndUnwatched = unwatched.filter(vidobj => !recommendation_ids.includes(vidobj.id));
        
        for (let i = 0; i < notReccAndUnwatched.length; i++) {
            const vidobj:any = notReccAndUnwatched[i];
            vidobj.liked = null;
            vidobj.watched = false;
            recommendations.push(notReccAndUnwatched[i]);
            if (recommendations.length == num)
                break;
        }

        //no more unwatched videos: insert watched videos
        if (recommendations.length < num) {
            console.log("No more unwatched videos! Getting the rest of the database...")
            const watched = await db.select({
                id:video.id,
                description:video.description,
                title:video.title,
                likevalues:video.like
            }).from(video).where(inArray(video.id,uidViews)).limit(num-recommendations.length);
            watched.forEach(async (vidobj:any) => {
                vidobj.watched = true;
                vidobj.liked = await db.select({liked:vid_like.liked}).from(vid_like).where(
                    and(
                        eq(vid_like.user_id,uid),
                        eq(vid_like.video_id,vidobj.id)
                    )
                )
                recommendations.push(vidobj);
            })
            // recommendations.push.apply(recommendations,watched);
        }

        // if there are still less than <num> videos in recommendation
        // array at this point, append videos already in the array
        while (recommendations.length < num) {
            let randInd = Math.floor(Math.random() * recommendations.length);
            recommendations.push({...recommendations[randInd]});
        } //this will infinite loop if there are zero videos in the system
    }
    return recommendations;
}