import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import VideoPlayer from "./VideoPlayer";
import axios from "axios";

const PlayerList = () => {
    const { id } = useParams<{ id:string }>(); // ID of the first video
    const navigate = useNavigate();
    const videoref = useRef({vidList:[""],ind:0});

    const fetchVideoId = async () => {  // Runs twice for some reason
        const res = await axios.post("http://thewang.cse356.compas.cs.stonybrook.edu/api/videos",{count:1});
        // //console.log(res)
        return res.data.videos[0].id;
    }

    const handleWheel = async (event:any) => {
        if (event.deltaY < 0) {
            //console.log("UP")
            // check if previous page exists
            if (videoref.current.ind != 0) {
                videoref.current.ind -= 1;
                navigate(`/play/${videoref.current.vidList[videoref.current.ind]}`);
            }
        }
        else {
            //console.log("DOWN")
            // check if next page exists
            
            if (videoref.current.ind !== videoref.current.vidList.length-1) {
                videoref.current.ind += 1;
                navigate(`/play/${videoref.current.vidList[videoref.current.ind]}`);
            }
            else {// else load new random video and then navigate
                const newid = await fetchVideoId();
                videoref.current.vidList.push(newid);
                videoref.current.ind += 1;
                //console.log("next ",nextState)
                navigate(`/play/${newid}`);
            }
            
        }
    }

    
    
    useEffect(() => { //clear state on page reload
        console.log("reload")
        videoref.current.vidList = [id];
        videoref.current.ind = 0;
    }, []);
    
    useEffect(() => {
        //console.log("Event listener added")
        window.addEventListener("wheel", handleWheel);
        return () => {
            //console.log("Event listener removed")
            window.removeEventListener("wheel", handleWheel);
        };
    }, []);
    // //console.log("video list: ", vidList);
    // //console.log("manifest Urls, ", manifestUrls);
    //console.log(location);
    return (
        <div className="video-list">
            <VideoPlayer manifest={id} />
        </div>
    );
};

export default PlayerList;