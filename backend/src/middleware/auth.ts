export const authMiddlware = (req: any, res: any, next: any) => {
    if(req.session && req.session.user){ //should contain obj with id, username
        // console.log("req from authMiddleware:", req);
        try{
            const user_id = req.session.user.id; //does this even work?
            const username = req.session.user.username
            console.log("--------------------middleware---------------\n","user id:", user_id, " username: ", username);
            req.user_id = user_id;
            req.username = username;
            return next();
        } catch(err) {
            console.log("could not grab user.id from authMiddleware:", err);
            return res.status(200).json({status:"ERROR",error:true,message:"cannot access user.id from authMiddleware"});
        }
    }
    return res.status(200).json({status:"ERROR",error:true,message:"not authenicated, cannot access route"});
}