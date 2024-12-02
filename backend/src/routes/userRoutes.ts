import { Router } from 'express';
import { authMiddlware } from '../middleware/auth.js';
import { userCollection } from '../mongoClient/db.js';
import crypto from 'crypto';
import { sendEmail } from '../email.js';

const router = Router();

//ROUTES
router.post('/adduser', async (req: any, res: any) => {
    try{
        const { username, password, email } = req.body;

        //check if we already have a user with that email or not
        const user_query = await userCollection.findOne({ email: email });
        //if there is a user already, return error
        if(user_query)
            return res.status(200).json({status: "ERROR",error:true,message:"email already exists"});

        //otherwise create a verification key for it and insert into db
        const key = crypto.randomBytes(16).toString("hex");
        const newId = crypto.randomBytes(24).toString("hex");
        await userCollection.insertOne({
          _id:newId as any,
          username:username,
          password:password,
          email:email,
          verification_key:key,
          disabled:true
        })

        // need to send the email here
        sendEmail(email,key);
        return res.status(200).json({status:"OK"})
    } catch(err) {
        return res.status(200).json({status:"ERROR",error:true,message:"/api/adduser internal issue"});
    }
});

router.get("/verify", async (req: any, res: any) => {
    try{
        const {email, key} = req.query;
        // console.log("email", email);
        // console.log("key", key);

        //decode the URI components
        const decoded_key = decodeURIComponent(key);
        const decoded_email = decodeURIComponent(email);
        // console.log("decoded_key:",decoded_key);
        // console.log("decoded_email:",decoded_email);
    
        //check if user has same email and verification key
        const user_query = await userCollection.findOne(
          {email:decoded_email,verification_key:decoded_key},
          {projection: {_id:1}}
        );
        
        //if it does, we update to be enabled account
        if(user_query){
          await userCollection.updateOne(
            {email:email},
            {$set:{disabled:false}}
          )
          // console.log(email, "updated to have disable: false");
        //   return res.redirect("http://thewang.cse356.compas.cs.stonybrook.edu/");
          return res.send({status:"OK"});
        }
        //otherwise return error
        return res.status(200).json({status:"ERROR",error:true,message:"email or verification is wrong or email was never created to have a verification key"})
      } catch(err) {
        return res.status(200).json({status:"ERROR",error:true,message:"internal error to /verify"});
      }
});

//login does not require a session to already exist, only when logging out it does.
router.post("/login", async (req: any, res: any) => {
    try{
        const { username, password } = req.body;

        //check if account matches and is not disabled
        const user_query = await userCollection.findOne(
          {username:username,password:password,disabled:false},
          {projection:{_id:1,username:1}}
        );
        
        if(!user_query)
            return res.status(200).json({status:"ERROR",error:true,message:"Username/Password incorrect"})
        //Set user session to store the user.id and username
        req.session.user = { id: user_query._id, username: user_query.username};
        return res.status(200).json({status:"OK"});
    } catch(err) {
        return res.status(200).json({status:"ERROR",error:true,message:"internal error to /login"});
    }
});

router.post("/check-auth", (req:any, res:any) => {
    try{
        // console.log("req from /api/check-auth:", req.session.user);
        if(req.session && req.session.user) {
          // console.log("userId returned:", req.session.user.id);
          return res.status(200).json({status:"OK", isLoggedIn:true , userId: req.session.user.id});
        }
        return res.status(200).json({status:"OK", isLoggedIn:false , userId: null});
    } catch(err) {
        return res.status(200).json({status:"ERROR",error:true,message:"check-auth internal server error"})
    }
});

//----------------------------------------AUTH ROUTES--------------------------------------------
router.use(authMiddlware);

//AuthRoutes

router.post("/logout", (req: any, res: any) => {
  try {
    //must already be logged in and remove the session
    if (req.session) {
      req.session.destroy((err: any) => {
        if (err)
          return res.status(200).json({status: "ERROR",error: true,message: "cannoy destroy session",});
        return res.status(200).json({ status: "OK" });
      });
    }
  } catch (err) {
    return res.status(200).json({status: "ERROR",error: true,message: "internal error to /logout",});
  }
});

export default router;