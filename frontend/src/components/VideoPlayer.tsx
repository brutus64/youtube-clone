import { useState } from 'react';
import ReactPlayer from 'react-player'
import axios from 'axios';

//BONUS: Displaying the like and dislikes prior and post clicking
const VideoPlayer = ({ vidData,visible }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [viewUpdated, setViewUpdated] = useState(false);

    const handleView = async() => {// probably do not have to update UI right away
      try {
        const res = await axios.post("http://thewang.cse356.compas.cs.stonybrook.edu/api/view", {id: vidData.id});
        if (res.data.error)
          console.log(res.data.message)
        else
          console.log("Watched before: ", res.data.viewed);

      } catch(err) {
        console.log("error in api call to /api/view at VideoPlayer.tsx: ", err);
      } 
    }

    const handlePlayPause = () => { 
        setIsPlaying((prev) => !prev);

        //Watched = click play button for the first time
        if (!isPlaying && !vidData.watched && !viewUpdated) {
          setViewUpdated(true);
          handleView(); // probably do not have to wait
        } 
    };
    
    const handleLike = async (value:boolean) => {
      try {
        //I believe the manifest here is actually the id
        //Reasoning: AppRoutes.tsx
        const res = await axios.post("http://thewang.cse356.compas.cs.stonybrook.edu/api/like", {id: vidData.id,value: value});
        if(res.data)
          console.log("res.data should be number of likes now: ", res.data);
      } catch(err) {
        console.log("error in api call to /api/like at VideoPlayer.tsx: ", err);
      }
    }

    return (
    <div className="video-box" style={{display: (visible ? "flex" : "none") }}>
        <h1>{vidData.title}</h1>
        <ReactPlayer 
          playing={isPlaying}
          url={"/media/"+vidData.id+".mpd"}
          controls={true}
        />
        <div className="video-data">
          <div className="like-dislike-box">
            <div className="like-box">
              <button name="like" id="like" onClick={()=>handleLike(true)}></button>
              {vidData.likevalues}
            </div>
            
            <button name="dislike" id="dislike" onClick={()=>handleLike(false)}></button>
          </div>
          <div id={visible ? "playPauseBtn" : "notPlayPauseBtn"} onClick={handlePlayPause}>
            <button>{isPlaying ? "Pause" : "Play"}</button>
          </div>
        </div>
        
        
    </div>
    )
}
export default VideoPlayer;