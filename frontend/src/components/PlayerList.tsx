import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import VideoPlayer from "./VideoPlayer";
import axios from "axios";

const PlayerList = () => {
    const { id } = useParams<{ id:string }>(); // ID of the first video
    const navigate = useNavigate();
    const videoref = useRef({vidList:[{}],ind:0}); //vidList should now contain video info
    const [ moreVideos, setMoreVideos ] = useState(false);


    const fetchVideoId = async (num:number) => {  // Runs twice for some reason
        const res = await axios.post("http://thewang.cse356.compas.cs.stonybrook.edu/api/videos",{count:num});
        console.log(res)
        // const dummyData = [{
        //     id:1,
        //     description:"hello",
        //     title:"wassup",
        //     watched:false,
        //     liked:null,
        //     likevalues:98
        // },{
        //     id:2,
        //     description:"goodbye",
        //     title:"im sad",
        //     watched:true,
        //     liked:true,
        //     likevalues:63
        // },{
        //     id:3,
        //     description:"i like bread",
        //     title:"bread video",
        //     watched:true,
        //     liked:false,
        //     likevalues:9
        // }]
        // return dummyData;
        return res.data.videos;
    }

    const handleWheel = async (event:any) => {
        if (event.deltaY < 0) {
            //console.log("UP")
            // check if previous page exists
            if (videoref.current.ind != 0) {
                videoref.current.ind -= 1;
                navigate(`/play/${videoref.current.vidList[videoref.current.ind].id}`);
            }
        }
        else {
            //console.log("DOWN")
            // check if next page exists
            
            if (videoref.current.ind !== videoref.current.vidList.length-1) {
                videoref.current.ind += 1;
                navigate(`/play/${videoref.current.vidList[videoref.current.ind].id}`);
            }
            else {// else recommend 10 more videos and then navigate
                const newVideos = await fetchVideoId(10);
                // videoref.current.vidList.push(newVideos)
                videoref.current.vidList.push.apply(videoref.current.vidList,newVideos)
                videoref.current.ind += 1;
                //console.log("next ",nextState)
                navigate(`/play/${videoref.current.vidList[videoref.current.ind].id}`);
            }
        }
    }
    useEffect(() => { //clear state on page reload

        console.log("reload")
        videoref.current.vidList = [{
            id:id,
            description:"start video",
            title:"potato",
            watched:false,
            liked:null,
            likevalues:69
        }];
        fetchVideoId(9).then(res => {
            videoref.current.vidList.push.apply(videoref.current.vidList,res);
            setMoreVideos(true);
        });
        videoref.current.ind = 0;
    }, []);
    console.log("rerender")
    
    useEffect(() => {
        window.addEventListener("wheel", handleWheel);
        return () => {
            window.removeEventListener("wheel", handleWheel);
        };
    }, []);
    // console.log("Rerender happened")
    return (
        <div className="video-list">
            {videoref.current.vidList.map((vidData,i) => 
                <VideoPlayer vidData={vidData} visible={i===videoref.current.ind}/>
            )}
        </div>
    );
};

export default PlayerList;