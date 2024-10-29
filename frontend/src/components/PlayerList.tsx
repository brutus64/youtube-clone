import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import VideoPlayer from "./VideoPlayer";
import { debounce } from "../viewings/debounce";
import axios from "axios";

// 7. GET /play/:id
// Return a frontend video player that can play video with id :id

const PlayerList = () => {
    const { id } = useParams(); //id of the first video
    const [ loading, setLoading] = useState(false);
    const [ vidList, setVidList ] = useState([id]);
    const fetchVideoId = async () => {  // Runs twice for some reason

        const res = await axios.post("http://thewang.cse356.compas.cs.stonybrook.edu/api/videos",{count:1});


        setVidList([...vidList, /* ADD NEW VIDEO HERE*/ ]);
        setLoading(false);
    }
    
    const handleScroll = () => {
        if (document.body.scrollHeight - 10 < window.scrollY + window.innerHeight) {
            setLoading(true);
        }
    };
    window.addEventListener("scroll", debounce(handleScroll, 500));

    useEffect(() => {
        fetchVideoId();
    }, [loading]);

    return ( //Handle the case where video ids may not be unique (return same video twice)
        <div className="video-list">
            {vidList.map(id =>
                <VideoPlayer key={id} vid={id}/>
            )}
        </div>
    )
};

export default PlayerList;