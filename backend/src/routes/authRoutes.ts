import { Router } from "express";
import { authMiddlware } from "../middleware/auth";

const router = Router();

router.use(authMiddlware);

//AuthRoutes

router.post("/api/logout", (req:any, res:any) => {
    try{
        //must already be logged in and remove the session
        if(req.session){
          req.session.destroy((err:any) => {
            if(err)
              return res.status(200).json({status: "ERROR", error:true,message:"cannoy destroy session"});
            return res.status(200).json({status: "OK"});
          });
        }
    } catch(err) {
        return res.status(200).json({status: "ERROR", error:true,message:"internal error to /logout"});
    }
});

//something about Clicking on a video should link to that video, at /play/:id , with the ability to infinitely scroll.
router.get("/", (req:any, res:any) => {
    
});

//parameter in body count req.body
router.post("/api/videos", (req:any, res:any) => {
    
});

router.get("/api/manifest/:id", (req:any, res:any) => {
    
});

router.get("/api/thumbnail/:id", (req:any, res:any) => {
    
});

router.get("/play/:id", (req:any, res:any) => {
    
});

export default router;