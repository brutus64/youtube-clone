import { useState } from "react";
import axios from "axios";
const Upload = () => {
    const [title, setTitle] = useState<string>("");
    const [author, setAuthor] = useState<string>("");
    const [description, setDescription] = useState<string>(""); // optional
    const [mp4File, setMp4File] = useState<File | null>(null);
    const [errMsg, setErrMsg] = useState<string | null>(null);
    const [resMsg, setResMsg] = useState<string | null>(null);
    const handleFileChange = (e: any) => {
        setMp4File(e.target.files[0]);
    }
    const handleUpload = async (e: any) => {
        e.preventDefault();
        if(!title || !author || !mp4File){
            setErrMsg("did not put in all of the necessary requirements");
            return;
        }
        //requires formData for proper formatting of data, and to set content-type to multipart/form-data due to formData type.
        const formData = new FormData();
        formData.append('title',title);
        formData.append('author',author);
        formData.append('description',description);
        formData.append('mp4File',mp4File);
        const config = {
            headers: {
                'content-type': 'multipart/form-data',
            },
        };
        const res = await axios.post("http://thewang.cse356.compas.cs.stonybrook.edu/api/upload",formData,config);
        if(res.data && res.data.id){
            setResMsg(`File uploaded, video id: ${res.data.id}`);
            return;
        }
        setResMsg(`Upload failed.`);
    }
    return(
        <>
            <form onSubmit={handleUpload} className='flex flex-col gap-3 items-center mt-12'>
                <div>
                    <label htmlFor="title">Title</label>
                    <input 
                        type="text" 
                        id="upload-title"
                        name="title"
                        onChange={(e)=>setTitle(e.target.value)}
                        value={title}
                        required
                    />
                    <label htmlFor="author">Author</label>
                    <input 
                        type="text"
                        id="upload-author"
                        name="author"
                        onChange={(e)=>setAuthor(e.target.value)}
                        value={author}
                    />
                    <label htmlFor="description">Description</label>
                    <input 
                        type="text"
                        id="upload-description"
                        name="description"
                        onChange={(e)=>setDescription(e.target.value)}
                        value={description}
                    />
                    <label htmlFor="mp4File">Mp4 File</label>
                    <input 
                        type="file" 
                        id="mp4File"
                        name="mp4File"
                        accept="video/mp4"
                        onChange={handleFileChange}
                    />
                </div>
                <button type="submit">Upload</button>
            </form>
            {errMsg && <div>{errMsg}</div>}
            {resMsg && <div>{resMsg}</div>}
        </>
    )
}

export default Upload;