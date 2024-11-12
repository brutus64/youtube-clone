import psycopg2
import pandas as pd
import random
from flask import Flask, jsonify
# ----------------------- MODEL ---------------------
from surprise import Dataset, Reader, SVDpp, SVD
from surprise.model_selection import train_test_split
from surprise import accuracy

def get_user_video_ratings(conn):
    cur = conn.cursor()
    # Query for liked/disliked videos
    cur.execute("""
        SELECT user_id, video_id, liked 
        FROM vid_like;
    """)
    liked_disliked = cur.fetchall()
    # Query for viewed videos (that are neither liked nor disliked)
    cur.execute("""
        SELECT user_id, video_id
        FROM view
        WHERE viewed = TRUE
        AND (user_id, video_id) NOT IN (SELECT user_id, video_id FROM vid_like);
    """)
    viewed = cur.fetchall()
    cur.close()
    # Create rating data (1 for liked, -1 for disliked, 0 for viewed)
    ratings = []
    # Process liked/disliked
    for user_id, video_id, liked in liked_disliked:
        rating = 1 if liked else -1  # 1 for like, -1 for dislike
        ratings.append((user_id, video_id, rating))
    # Process viewed
    for user_id, video_id in viewed:
        ratings.append((user_id, video_id, 0))  # 0 for viewed but not liked or disliked
    return ratings

def getDf(conn):
    ratings_data = get_user_video_ratings(conn)
    df = pd.DataFrame(ratings_data, columns=["user_id", "video_id", "rating"])
    return df


def getAllVideoID(conn):
    cur = conn.cursor()
    cur.execute("SELECT id FROM video WHERE status = 'complete'")
    fetched = cur.fetchall() # array of tuple of size 1
    lst = [data[0] for data in fetched]
    cur.close()
    return lst

def trainModel(df):
    reader = Reader(rating_scale=(-1, 1))
    # Load into Surprise
    dataset = Dataset.load_from_df(df[["user_id", "video_id", "rating"]], reader)
    # split into test and training set
    trainset, testset = train_test_split(dataset, test_size=0.2)
    # collaborative filtering algorithm
    algo = SVDpp()
    # Training
    algo.fit(trainset)
    # predict
    predictions = algo.test(testset)
    # print("predictions---- ")
    # for pred in predictions:
    #     print(pred)
    print("RMSE:", accuracy.rmse(predictions))
    return algo


def getRecommendations(userid, algo, all_val_vids, df, conn, topk = 10):
    # Get the video IDs the user has already rated
    watched_videos = set(df[df['user_id'] == userid]['video_id'])

    predictions = []
    for vid_id in all_val_vids:
        if vid_id not in watched_videos:
            # Predict rating for this user-video pair
            prediction = algo.predict(userid, vid_id)
            predictions.append((vid_id, prediction.est))
    
    # Sort by estimated rating in descending order and get top N
    predictions.sort(key=lambda x: x[1], reverse=True)
    # print(predictions)
    recommended_videosIDS = [vid_id for vid_id, est in predictions[:topk]]
    
    #IDs to objects
    """
    return {
        id: rec_vid_id,
        description: desc,
        title: video_data[0].title,
        watched: watch,
        liked: liked,
        likevalues: video_data[0].like,
    };
    """
    cur = conn.cursor()
    json_objects = []
    for id_val in recommended_videosIDS:
        cur.execute("SELECT id, description, title, \"like\" FROM video WHERE id = %s", (id_val,))
        video = cur.fetchone()
        video_id, desc, title, likevalues = video
        # watched
        cur.execute("SELECT * FROM view WHERE video_id = %s AND user_id = %s", (id_val, userid))
        view_data = cur.fetchone()
        viewed = True if view_data else False
        # liked
        cur.execute("SELECT liked FROM vid_like WHERE video_id = %s AND user_id = %s", (id_val, userid))
        liked_data = cur.fetchone()
        liked = liked_data[0] if liked_data else None

        print("id", id_val," description" , desc," title", title,"watched",viewed, "liked", liked,"likevalues", likevalues)

        json_objects.append({
            "id": id_val,
            "description": desc,
            "title": title,
            "watched": viewed,
            "liked": liked,
            "likevalues": likevalues,
        })

    cur.close()
    return json.dumps(json_objects)

# ----------------------- FLASK ---------------------
app = Flask(__name__)

@app.route('/recommendations/<user_id>/<count>', methods=['GET'])
def get_recommendations(user_id, count):
    try:
        print("APP.PY " +user_id+" "+ count)
        conn = psycopg2.connect(host="127.0.0.1",user="thewang",password="cse356",dbname="youtube-clone")
        df = getDf(conn)
        algo = trainModel(df)
        recs = getRecommendations(int(user_id), algo, getAllVideoID(conn), df, conn, int(count))
        conn.close()
        return jsonify(recommendations=recs)
    except Exception as e:
        return jsonify(error=str(e)), 200
    
if __name__ == "__main__":
    app.run(debug=True, host='localhost', port=4999)
