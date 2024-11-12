from flask import Flask, request, jsonify
import pandas as pd
from surprise import Dataset, Reader, SVD
from surprise.model_selection import train_test_split
import numpy as np

app = Flask(__name__)

@app.route('/recommend', methods=['POST'])
def recommend():
    data = request.json
    user_id = data['userId']
    user_like_stats = data['user_video_like']
    all_likes_stats = data['all_video_likes']
    viewed_videos_stats = set(data['viewed_videos'])
    count = data['count']
    
    # Convert to pandas DataFrame
    df = pd.DataFrame(all_likes_stats, columns=['user_id', 'video_id', 'liked'])
    # Convert boolean likes to ratings (-1 for dislike, 1 for like) so a new column is added
    df['rating'] = df['liked'].apply(lambda x: 1 if x else -1)
   
    #dataset values can only be as high as 1 or as low as -1
    reader = Reader(rating_scale=(-1,1))
    data = Dataset.load_from_df(df[['user_id', 'video_id', 'rating']], reader) #reader specifies the rating scale
    
    #train model using SVD
    #trainset: set used to train recommendation algorithm, _ is the test set
    trainset, _ = train_test_split(data, test_size=0.2) #says 20% of data should be test and 80% is training
    algo = SVD() #SVD to lower the complexity of matrices
    algo.fit(trainset) #knows to use rating column for training since load_from_df makes sure dataset is structured for surprise library to udnerstand
    
    # Get unwatched video predictions
    all_videos = set(df['video_id'].unique())
    unwatched_videos = [video for video in all_videos if video not in viewed_videos_stats]
    
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)