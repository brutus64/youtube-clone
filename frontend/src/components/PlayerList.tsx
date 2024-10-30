import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import VideoPlayer from "./VideoPlayer";
import { debounce } from "../viewings/debounce";
import axios from "axios";

const PlayerList = () => {
    const { id } = useParams<{ id:string }>(); // ID of the first video
    const [loading, setLoading] = useState(true);
    const [manifestUrls, setManifestUrls] = useState<{ [key: string]: string }>({});
    const [ currentIndex, setCurrentIndex ] = useState(0);
    const [ yPageOffset , setYPageOffset] = useState(0);
    const [vidList, setVidList] = useState<string[]>([id]);
    const isScrollingRef = useRef(false);

    const fetchVideoId = async () => {  // Runs twice for some reason
        const res = await axios.post("http://thewang.cse356.compas.cs.stonybrook.edu/api/videos",{count:1});
        console.log(res)
        setVidList([...vidList, res.data.videos[0].id]);
        setLoading(false);
    }

    useEffect(() => {
        if (loading)
            fetchVideoId();
    }, [loading]);

    const handleScroll = debounce(() => {
        if (isScrollingRef.current) return;
        console.log(document.body.scrollHeight - 10, window.scrollY + window.innerHeight)
        if (document.body.scrollHeight - 10 < window.scrollY + window.innerHeight) {
            setLoading(true);
        }
        const cur = window.scrollY;
        const difference = cur - yPageOffset;
        console.log("Current scroll",difference);
        if (difference > 0 && currentIndex < vidList.length-1)
            setCurrentIndex(prev => prev+1);
        else if (difference < 0 && currentIndex > 0)
            setCurrentIndex(prev => prev-1);
        setYPageOffset(cur);
    }, 500);

    // Fetch the manifest for the video and add to vidList if unique
    // useEffect(() => {
    //     const fetchVideoManifest = async () => {
    //         if (!loading || !id) return;
    //         try {
    //             const res = await axios.get(`http://thewang.cse356.compas.cs.stonybrook.edu/api/manifest/${id}`, {responseType: "text"});
    //             console.log("res.data from manifest/id" ,res.data);
    //             const manifestUrl = URL.createObjectURL(res.data);
    //             console.log("manifest URL:", manifestUrl)
    //             if(!vidList.includes(id)) {
    //                 setVidList((prev) => [...prev, id]);
    //                 setManifestUrls((prev) => ({ ...prev, [id]: manifestUrl }));
    //             }
    //             setLoading(false);
    //         } catch (error) {
    //             console.error("Error fetching manifest:", error);
    //             setLoading(false);
    //         } 
    //     };
    //     fetchVideoManifest();
    // }, [loading, id, vidList]);
    useEffect(()=> {
        fetchVideoId();
    }, []);

    // Add scroll event listener
    useEffect(() => {
        window.addEventListener("scroll", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [handleScroll]);
    console.log("video list: ", vidList);
    console.log("manifest Urls, ", manifestUrls);
    return (
        // <div className="video-list">
        //     {vidList.map((vidId) => (
        //         <VideoPlayer key={vidId} manifest = {manifestUrls[vidId]} />
        //     ))}
        // </div>
        <div className="video-list">
            {vidList.map((vidId,i) => (
                <VideoPlayer key={`${vidId}${i}`} handle={handleScroll} isCur={i==currentIndex} manifest = {vidId} />
            ))}
        </div>
    );
};

export default PlayerList;