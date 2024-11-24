// import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// import axios from "axios";
//sends you the file right away for the thumbnail, no need to access /var/html/media
//just need to be able to parse it, but does it have the ability to?
//or does it need source from /var/html/media still?


const Thumbnail = ({vid}) => {
    const navigate = useNavigate();

    return (
        <div className="flex items-center justify-center p-1 m-4 w-80 h-48 box-border border-solid border-2 border-black bg-slate-500" onClick={()=>navigate(`/play/${vid}`)}>
            {/* its a Data URL so it decodes base64 string to render the image, image is able to recognize its a Data URL by the serquence of bytes as it says <mediatype>[base64] like data:image/png;base64,(encoded stuff) to be decoded*/}
            <img src={`http://thewang.cse356.compas.cs.stonybrook.edu/api/thumbnail/${vid}`} alt="thumbnail image" />
        </div>
    )
}


export default Thumbnail;