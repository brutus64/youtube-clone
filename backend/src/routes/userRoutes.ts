import { Router } from 'express';
import { db } from '../drizzle/db';
import { user } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import { sendEmail } from '../email';
import { authMiddlware } from '../middleware/auth';
const router = Router();

//ROUTES
router.post('/adduser', async (req: any, res: any) => {
    try{
        const { username, password, email } = req.body;

        //check if we already have a user with that email or not
        const user_query = await db.select().from(user).where(eq(email,user.email));

        //if there is a user already, return error
        if(user_query.length > 0)
            return res.status(200).json({status: "ERROR",error:true,message:"email already exists"});

        //otherwise create a verification key for it and insert into db
        const key = crypto.randomBytes(16).toString("hex");
        await db.insert(user).values({
            username: username,
            password: password,
            email: email,
            verification_key: key
        });

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
        console.log("email", email);
        console.log("key", key);

        //decode the URI components
        const decoded_key = decodeURIComponent(key);
        const decoded_email = decodeURIComponent(email);
        console.log("decoded_key:",decoded_key);
        console.log("decoded_email:",decoded_email);
    
        //check if user has same email and verification key
        const user_query = await db.select().from(user).where(
          and(
            eq(user.email,decoded_email),
            eq(user.verification_key, decoded_key)
          ));
        
        console.log("user_query from verify:", user_query);
        //if it does, we update to be enabled account
        if(user_query.length > 0){
          await db.update(user).set({disabled:false}).where(eq(user.email, email)); //find the email and set the disabled to false
          console.log(email, "updated to have disable: false");
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
        const user_query = await db.select().from(user).where(
            and(
                eq(user.username, username),
                eq(user.password,password),
                eq(user.disabled,false)
            )
        )
        
        if(user_query.length == 0)
            return res.status(200).json({status:"ERROR",error:true,message:"log in request failed, either wrong info or disabled account or non-existent"})
        console.log(user_query[0]);
        req.session.user = { id: user_query[0].id, username: user_query[0].username };
        return res.status(200).json({status:"OK"});
    } catch(err) {
        return res.status(200).json({status:"ERROR",error:true,message:"internal error to /login"});
    }
});

router.post("/check-auth", (req:any, res:any) => {
    try{
        console.log("req from /api/check-auth:", req.session);
        if(req.session && req.session.user) 
            return res.status(200).json({status:"OK", isLoggedIn:true , userId: req.session.user});
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