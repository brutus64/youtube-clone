import axios from "axios";
import { useState, useEffect } from "react";
import Thumbnail from "./Thumbnail";

const NUM_VIDEOS = 10;

const VideoList = () => {
    const [videosIds, setVideoIds] = useState<string[]>([]);
    // GET  "/"
    // Display a list of 10 videos with their corresponding thumbnails
    // Clicking on a video should link to that video, at /play/:id , with the ability to infinitely scroll.
    useEffect(() => {
        const fetchVideoIds = async () => {
            console.log("Fetching videos...")
            try{
                const res = await axios.post("http://thewang.cse356.compas.cs.stonybrook.edu/api/videos",{count:NUM_VIDEOS});
                console.log(res.data);
                //for each object we just want id, other info kind of useless unless we need description and video titles I guess.
                const ids = res.data.videos.map(value => value.id);
                setVideoIds(ids);
                // A mapping of 
                // {   id: STRING without the .mp4,
                //     title: STRING (technically file) with .mp4, 
                //     descriptions: STRING describing video 
                // }
            }
            catch(err){
                console.log("Cannot fetch video ids: ", err);
            }
        }
        fetchVideoIds();
    },[]);
    return (
        <div className="grid overflow-auto gap-2 p-3 grid-cols-auto-fit-400">
            {videosIds.map(id =>
                <Thumbnail key={id} vid={id}/>
            )}
        </div>
    )
}

export default VideoList;