import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import VideoPlayer from "./VideoPlayer";
import { debounce } from "../viewings/debounce";
import axios from "axios";

const PlayerList = () => {
    const { id } = useParams(); // ID of the first video
    const [loading, setLoading] = useState(false);
    const [manifestUrls, setManifestUrls] = useState({});
    const [vidList, setVidList] = useState([id]);

    const handleScroll = debounce(() => {
        if (document.body.scrollHeight - 10 < window.scrollY + window.innerHeight) {
            setLoading(true);
        }
    }, 500);

    // Fetch the manifest for the video and add to vidList if unique
    useEffect(() => {
        const fetchVideoManifest = async () => {
            if (!loading) return;
            try {
                const res = await axios.post(`http://thewang.cse356.compas.cs.stonybrook.edu/api/manifest/${id}`, { responseType: 'blob' });
                const manifestUrl = URL.createObjectURL(res.data);
                if(!vidList.includes(manifestUrl)) {
                    setVidList((prev) => [...prev, id]);
                    if(typeof id == "string")
                        setManifestUrls((prev) => ({ ...prev, [id]: manifestUrl }));
                }
                setLoading(false);
            } catch (error) {
                console.error("Error fetching manifest:", error);
                setLoading(false);
            } 
        };
        fetchVideoManifest();
    }, [loading, id, vidList]);

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
        <div className="video-list">
            {vidList.map((vidId) => (
                <VideoPlayer key={vidId} manifest = { typeof vidId == "string" ? manifestUrls[vidId]: null} />
            ))}
        </div>
    );
};

export default PlayerList;