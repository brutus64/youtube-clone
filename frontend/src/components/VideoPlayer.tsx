import { useState } from 'react';
import ReactPlayer from 'react-player'
import axios from 'axios';

//BONUS: Displaying the like and dislikes prior and post clicking
const VideoPlayer = ({ manifest }) => {
    const [isPlaying, setIsPlaying] = useState(true); //autoplay

    const handlePlayPause = () => {
        setIsPlaying((prev) => !prev);
    };
    
    const handleLike = async (value:boolean) => {
      try {
        //I believe the manifest here is actually the id
        //Reasoning: AppRoutes.tsx
        const res = await axios.post("http://thewang.cse356.compas.cs.stonybrook.edu/api/like", {id: manifest,value: value});
        if(res.data)
          console.log("res.data should be number of likes now: ", res.data);
      } catch(err) {
        console.log("error in api call to /api/like at VideoPlayer.tsx: ", err);
      }
    }

    return (
    <div className="video-box">
        <h1>{manifest}</h1>
        <ReactPlayer 
          playing={isPlaying}
          url={"/media/"+manifest+".mpd"}
          controls={true}
        />
        <div>
          <button name="like" id="like" onClick={()=>handleLike(true)}>Like</button>
          <button name="dislike" id="dislike" onClick={()=>handleLike(false)}>Dislike</button>
        </div>
        <div id="playPauseBtn">
          <button onClick={handlePlayPause}>{isPlaying ? "Pause" : "Play"}</button>
        </div>
    </div>
    )
}
export default VideoPlayer;