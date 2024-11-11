// import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// import axios from "axios";
//sends you the file right away for the thumbnail, no need to access /var/html/media
//just need to be able to parse it, but does it have the ability to?
//or does it need source from /var/html/media still?


const Thumbnail = ({vid}) => {
    // const [ thumbnailImage, setThumbNailImage ] = useState<string>("");
    const navigate = useNavigate();
//     useEffect(() => {
//         const fetchThumbnail = async () => {
// console.log("thumbnail id:", vid);
//             //expects id without .jpg which is exactly what it does.
//             axios.get(`http://thewang.cse356.compas.cs.stonybrook.edu/api/thumbnail/${vid}`,{responseType: 'blob'})
//             .then((res) => {
//                 //blob = Binary Large Object (files are represented in binary or raw data)
//                 const reader = new window.FileReader(); //can read File/Blob objects, create a FileReader
//                 reader.readAsDataURL(res.data); //reads Blob and turns into Data URL (DataURL = base64 encoded string which is the binary data of Blob)
//                 reader.onload = function () {
//                     if (reader.result)
//                         //stores thumbnail as a URL
//                         setThumbNailImage(reader.result.toString());
//                     else
//                         console.log("Reader error")
//                 };
//             })
//             .catch((err) => {
//                 console.log(`Error fetching video thumbnail ${vid}: ${err}`);
//             });
            
//         }
//         fetchThumbnail();
//     },[vid]);

    return (
        <div className="thumbnail-box" onClick={()=>navigate(`/play/${vid}`)}>
            {/* its a Data URL so it decodes base64 string to render the image, image is able to recognize its a Data URL by the serquence of bytes as it says <mediatype>[base64] like data:image/png;base64,(encoded stuff) to be decoded*/}
            <img src={`http://thewang.cse356.compas.cs.stonybrook.edu/api/thumbnail/${vid}`} alt="thumbnail image" />
        </div>
    )
}


export default Thumbnail;