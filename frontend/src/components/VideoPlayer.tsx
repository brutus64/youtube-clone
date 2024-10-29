import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useVisible } from "../viewings/useVisible";


const VideoPlayer = ({vid}) => {
    const [ elementRef ] = useVisible(vid);

    //fetch actual video somewhere here

    return (
        <div className="video-box" ref={elementRef}>
            {vid}
        </div>
    )
}


export default VideoPlayer;