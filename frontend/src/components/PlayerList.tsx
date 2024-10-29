import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import VideoPlayer from "./VideoPlayer";
import { debounce } from "../viewings/debounce";
import axios from "axios";

const PlayerList = () => {
    const { id } = useParams<{ id:string }>(); // ID of the first video
    const [loading, setLoading] = useState(true);
    const [manifestUrls, setManifestUrls] = useState<{ [key: string]: string }>({});
    const [vidList, setVidList] = useState<string[]>([]);

    const handleScroll = debounce(() => {
        if (document.body.scrollHeight - 10 < window.scrollY + window.innerHeight) {
            setLoading(true);
        }
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
        if(!vidList.includes(id)) {
            setVidList((prev) => [...prev, id]);
        }
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
            {vidList.map((vidId) => (
                <VideoPlayer key={vidId} manifest = {vidId} />
            ))}
        </div>
    );
};

export default PlayerList;