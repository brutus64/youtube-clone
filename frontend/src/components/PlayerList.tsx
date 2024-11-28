import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import VideoPlayer from "./VideoPlayer";
import axios from "axios";
// import { PulseLoader } from "react-spinners";

const PlayerList = () => {
    const { id } = useParams<{ id:string }>(); // ID of the first video
    const navigate = useNavigate();
    const videoref = useRef({vidList:[{}],ind:0}); //vidList should now contain video info
    const [ moreVideos, setMoreVideos ] = useState(false);

    const fetchFirst = async () => {
        try {
            const res = await axios.get(`https://thewang.cse356.compas.cs.stonybrook.edu/api/video/${id}`);
            if (!res.data.error) {
                console.log("First video retrieved");
                return res.data.vdata;
            }
            else
                console.log("Error: ", res.data.message);
        }
        catch(err) {
            console.log(err);
        }
        return null;
    }

    const fetchVideoId = async (num:number) => {  // Runs twice for some reason
        console.log("Fetching rest of videos...")
        try {
            const res = await axios.post("https://thewang.cse356.compas.cs.stonybrook.edu/api/videos",{videoId:id,count:num});
            if (!res.data.error)
                return res.data.videos;
            else
                console.log("Error: ", res.data.message)
        }
        catch(err) {
            console.log(err);
        }
        return [];
    }

    const handleWheel = async (event:any) => {
        if (event.deltaY < 0) {
            //console.log("UP")
            // check if previous page exists
            if (videoref.current.ind > 0) {
                videoref.current.ind -= 1;
                navigate(`/play/${videoref.current.vidList[videoref.current.ind].id}`);
            }
        }
        else {
            if (videoref.current.vidList.length <= 1) {
                console.log("Please wait for videos to load!");
                return;
            }
            //console.log("DOWN")
            // check if next page exists
            
            if (videoref.current.ind < videoref.current.vidList.length-3) {
                videoref.current.ind += 1;
                navigate(`/play/${videoref.current.vidList[videoref.current.ind].id}`);
            }
            else {// else recommend 10 more videos and then navigate
                const newVideos = await fetchVideoId(10);
                // videoref.current.vidList.push(newVideos)
                videoref.current.vidList.push.apply(videoref.current.vidList,newVideos)
                if (videoref.current.ind+1 < videoref.current.vidList.length)
                    videoref.current.ind += 1;
                if (newVideos.length === 0)
                    return;
                //console.log("next ",nextState)
                navigate(`/play/${videoref.current.vidList[videoref.current.ind].id}`);
            }
        }
    }
    useEffect(() => { //clear state on page reload

        console.log("reload");
        Promise.all([fetchFirst(),fetchVideoId(9)]).then(values => {
            if (!values[0] || values[1].length === 0) { //maybe show error page?
                // setError(true);
                return;
            }
            videoref.current.vidList = [values[0]];
            videoref.current.vidList.push.apply(videoref.current.vidList,values[1]);
            setMoreVideos(true);
        }).catch(err => console.log(err));
        videoref.current.ind = 0;
    }, []);
    
    useEffect(() => {
        window.addEventListener("wheel", handleWheel);
        return () => {
            window.removeEventListener("wheel", handleWheel);
        };
    }, []);
    return (
        <div className="flex items-center flex-col">
            {moreVideos && videoref.current.vidList.map((vidData,i) => 
                <VideoPlayer vidData={vidData} visible={i===videoref.current.ind}/>
            )}
            {/* {!moreVideos && 
            <div className="p-1 m-5 w-[940px] h-[530px] box-border bg-slate-300 flex flex-col justify-center items-center gap-2.5 rounded-2xl">
                <PulseLoader color="gray"/>
            </div>} */}
        </div>
    );
};

export default PlayerList;