import axios from "axios";
import { useState, useEffect } from "react";
import Thumbnail from "./Thumbnail";

const NUM_VIDEOS = 10;

const Videolist = () => {
    const [videosIds, setVideoIds] = useState([]);
    useEffect(() => {
        const fetchVideoIds = async () => {
            try{
                const res = await axios.post("http://thewang.cse356.compas.cs.stonybrook.edu/api/adduser",{count:NUM_VIDEOS});
                console.log(res);
                setVideoIds(res);
            }
            catch(err){
                console.error("Cannot fetch video ids");
            }
        }
        fetchVideoIds();
    },[]);
    return (
        <>
            {videosIds.map(id =>
                <Thumbnail key={id} vid={id}/>
            )}
        </>
    )
}

export default Videolist;