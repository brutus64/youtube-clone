import { Router } from "express";
import { authMiddlware } from "../middleware/auth";
import fs from "fs";
const router = Router();

router.use(authMiddlware);

// parameter in body count req.body
router.post("/videos", (req: any, res: any) => {
    function shuffle(array:any) {
        let currentIndex = array.length;
      
        // While there remain elements to shuffle...
        while (currentIndex != 0) {
      
          // Pick a remaining element...
          let randomIndex = Math.floor(Math.random() * currentIndex);
          currentIndex--;
      
          // And swap it with the current element.
          [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
        }
      }
    try{
        const { count } = req.body;
        const jsonPath = '/var/html/media/m2.json'
        console.log("jsonPath:", jsonPath);
        fs.readFile(jsonPath, "utf-8", (err, data) => {
            if(err)
                return res.status(200).json({status:"ERROR",error:true,message:"fs.readFile errored inside."});
            const videos = JSON.parse(data);
            //since its just a JSON object with a bunch of json objects inside get a mapping of key to values
            const vid_arr = Object.keys(videos).map(key => ({
                id: key.replace(".mp4",""),
                title: key,
                description: videos[key],
            }));
            shuffle(vid_arr);
            const ret_arr = vid_arr.slice(0,count);
            //do i need to return status OK?
            return res.status(200).json({status:"OK", videos:ret_arr})
        })
    }catch(err){
        return res.status(200).json({status:"ERROR",error:true,message:"internal server error on /api/videos, most likely when reading file"});
    }
});

router.get("/manifest/:id", (req: any, res: any) => {
    try{
        const id = req.params.id;
        const manifestPath = `/var/html/media/v${id}.mpd`;
        console.log("manifest path:", manifestPath);
        console.log("EXISTS?", fs.existsSync(manifestPath));
        if(fs.existsSync(manifestPath)) 
            return res.sendFile(manifestPath);
        return res.status(200).json({status:"ERROR",error:true,message:"manifest not found. for /api/manifest/:id"});
    } catch(err) {
        return res.status(200).json({status:"ERROR",error:true,message:"internal server error from /api/manifest/:id most likely the manifestPath attempt to read does not work"});
    }

});

router.get("/thumbnail/:id", (req: any, res: any) => {
    try {
        const id = req.params.id;
        const thumbnailPath = `/var/html/media/v${id}.jpg`;
        console.log("thumbnail path:", thumbnailPath);
        if(fs.existsSync(thumbnailPath))
            return res.sendFile(thumbnailPath);
        return res.status(200).json({status:"ERROR",error:true,message:"thumbnail not found. for /api/thumbnail/:id"});
    } catch(err) {
        return res.status(200).json({status:"ERROR",error:true,message:"internal server error from api/thumbnail/:id most likely the thumbnailPath attempts to read does not work"});
    }
});

export default router;