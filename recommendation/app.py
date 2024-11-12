from flask import Flask, request, jsonify
import pandas as pd
from surprise import Dataset, Reader, SVD
from surprise.model_selection import train_test_split

app = Flask(__name__)

@app.route('/recommend', methods=['POST'])
def recommend():
    data = request.json
    user_id = data['userId']
    user_likes = data['userLikes']
    all_likes = data['allLikes']
    viewed_videos = set(data['viewedVideos'])
    count = data['count']
    
    # Convert to pandas DataFrame
    df = pd.DataFrame(all_likes, columns=['userId', 'videoId', 'liked'])
    
    # Convert boolean likes to ratings (-1 for dislike, 1 for like)
    df['rating'] = df['liked'].apply(lambda x: 1 if x else -1)

    # Create Surprise reader and dataset
    reader = Reader(rating_scale=(-1, 1))
    data = Dataset.load_from_df(df[['userId', 'videoId', 'rating']], reader)
    
    # Train model using SVD
    trainset, _ = train_test_split(data, test_size=0.2)
    algo = SVD()
    algo.fit(trainset)
    
    # Get unwatched video predictions
    all_videos = set(df['videoId'].unique())
    unwatched_videos = [video for video in all_videos if video not in viewed_videos]

    predictions = [algo.predict(user_id, video) for video in unwatched_videos]
    predictions.sort(key=lambda x: x.est, reverse=True)
    
    # Get top recommendations
    recommended_videos = [pred.iid for pred in predictions[:count]]

    # If not enough recommendations, add random unwatched videos
    if len(recommended_videos) < count:
        remaining_unwatched = list(set(unwatched_videos) - set(recommended_videos))
        np.random.shuffle(remaining_unwatched)
        recommended_videos.extend(remaining_unwatched[:count - len(recommended_videos)])
    
    # If still not enough, add random watched videos
    if len(recommended_videos) < count:
        watched_videos = list(viewed_videos)
        np.random.shuffle(watched_videos)
        recommended_videos.extend(watched_videos[:count - len(recommended_videos)])
    
    return jsonify({'videos': recommended_videos[:count]})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)