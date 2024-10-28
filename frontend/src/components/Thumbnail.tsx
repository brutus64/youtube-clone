import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const Thumbnail = ({vid}) => {
    const [ thumbnailImage, setThumbNailImage ] = useState();
    useEffect(() => {
        const fetchThumbnail = async () => {
            axios.get(`http://thewang.cse356.compas.cs.stonybrook.edu/api/thumbnail/${vid}`,{responseType: 'blob'})
            .then((res) => {
                let reader = new window.FileReader();
                reader.readAsDataURL(res.data);
                reader.onload = function () {
                    setThumbNailImage(reader.result);
                };
            });
            
        }
        fetchThumbnail();
    },[]);
    return (
        <>
            <img src="" alt="" />
        </>
    )
}


export default Thumbnail;