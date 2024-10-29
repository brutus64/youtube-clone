import { useState } from 'react';
import ReactPlayer from 'react-player'
const VideoPlayer = ({ manifest }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    console.log("Video player's manifest", manifest);

    const handlePlayPause = () => {
      if(isPlaying) {
        setIsPlaying(false);
      }
      else {
        setIsPlaying(true);
      }
    };

    return (
    <>
        <ReactPlayer 
          playing={isPlaying}
          url={"/media/output_"+manifest+".mpd"}
          controls={true}
        />
        <div id="playPauseBtn">
          <button onClick={handlePlayPause}>Play, Plause</button>
        </div>
    </>
    )
}
export default VideoPlayer;