import { Router } from "express";
import { authMiddlware } from "../middleware/auth";
import fs from "fs";
import { recommend } from "../rec";
const router = Router();

router.use(authMiddlware);

// parameter in body count req.body
router.post("/videos", async (req: any, res: any) => {
    try{
        const { count } = req.body;
        const ret_arr = await recommend(req.user_id,count);
        console.log(ret_arr);
        return res.status(200).json({status:"OK", videos:ret_arr})
    }catch(err){
        return res.status(200).json({status:"ERROR",error:true,message:"internal server error on /api/videos, most likely when reading file"});
    }
});

router.get("/manifest/:id", (req: any, res: any) => {
    try{
        const id = req.params.id;
        const manifestPath = `/var/html/media/${id}.mpd`;
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
        const thumbnailPath = `/var/html/media/${id}.jpg`;
        console.log("thumbnail path:", thumbnailPath);
        if(fs.existsSync(thumbnailPath))
            return res.sendFile(thumbnailPath);
        return res.status(200).json({status:"ERROR",error:true,message:"thumbnail not found. for /api/thumbnail/:id"});
    } catch(err) {
        return res.status(200).json({status:"ERROR",error:true,message:"internal server error from api/thumbnail/:id most likely the thumbnailPath attempts to read does not work"});
    }
});

export default router;