import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";



const Thumbnail = ({vid}) => {
    const [ thumbnailImage, setThumbNailImage ] = useState<string>("");
    const navigate = useNavigate();
    useEffect(() => {
        const fetchThumbnail = async () => {
            axios.get(`http://thewang.cse356.compas.cs.stonybrook.edu/api/thumbnail/${vid}`,{responseType: 'blob'})
            .then((res) => {
                const reader = new window.FileReader();
                reader.readAsDataURL(res.data);
                reader.onload = function () {
                    if (reader.result)
                        setThumbNailImage(reader.result.toString());
                    else
                        console.log("Reader error")
                };
            })
            .catch((err) => {
                console.log(`Error fetching video thumbnail ${vid}: ${err}`);
            });
            
        }
        fetchThumbnail();
    },[vid]);

    const handleVideoClick = () => {
        navigate(`/play/${vid}`);
    }

    return (
        <div className="thumbnail-box" onClick={handleVideoClick}>
            <img src={thumbnailImage} alt="thumbnail image" />
        </div>
    )
}


export default Thumbnail;