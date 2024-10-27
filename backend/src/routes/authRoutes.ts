import { Router } from "express";
import { authMiddlware } from "../middleware/auth";

const router = Router();

router.use(authMiddlware);

//AuthRoutes

router.post("/api/logout", (req:any, res:any) => {

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