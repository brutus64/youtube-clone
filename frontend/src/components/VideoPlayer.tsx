import { useState } from 'react';
import ReactPlayer from 'react-player'
// import { useVisible } from '../viewings/useVisible';
const VideoPlayer = ({ manifest}) => {
    const [isPlaying, setIsPlaying] = useState(false);

    const handlePlayPause = () => {
        setIsPlaying((prev) => !prev);
    };

    return (
    <div className="video-box">
        <h1>{manifest}</h1>
        <ReactPlayer 
          playing={isPlaying}
          url={"/media/output_"+manifest+".mpd"}
          controls={true}
        />
        <div id="playPauseBtn">
          <button onClick={handlePlayPause}>{isPlaying ? "Pause" : "Play"}</button>
        </div>
    </div>
    )
}
export default VideoPlayer;