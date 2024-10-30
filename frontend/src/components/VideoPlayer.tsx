import { useState,useEffect, useRef } from 'react';
import ReactPlayer from 'react-player'
import { useVisible } from '../viewings/useVisible';
const VideoPlayer = ({ manifest, isCur, handle }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [elementRef] = useVisible(manifest);
    const isScrollingRef = useRef(false);

    const handlePlayPause = () => {
        setIsPlaying((prev) => !prev);
    };

    useEffect(() => {
        if (isCur && !isScrollingRef.current) {
            isScrollingRef.current = true;
            elementRef.current.scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => {
                isScrollingRef.current = false;
            }, 1000); // Adjust the timeout duration as needed
        }
    }, [isCur, elementRef]);


    return (
    <div ref={elementRef} className="video-box">
        <ReactPlayer 
          playing={isPlaying}
          url={"/media/output_"+manifest+".mpd"}
          controls={true}
        />
        <div id="playPauseBtn">
          <button onClick={handlePlayPause}>Play, Pause</button>
        </div>
    </div>
    )
}
export default VideoPlayer;