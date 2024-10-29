export const authMiddlware = (req: any, res: any, next: any) => {
    if(req.session && req.session.user){
        // console.log("req from authMiddleware:", req);
        return next();
    }
    return res.status(200).json({"status":"ERROR","error":true,"message":"not authenicated, cannot access route"});
}