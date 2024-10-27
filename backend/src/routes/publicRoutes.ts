import { Router } from 'express';
import { db } from '../drizzle/db';
import { user } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

const router = Router();

//ROUTES
router.post('/api/adduser', async (req: any, res: any) => {
    try{
        const { username, password, email } = req.body;
        const user_query = await db.select().from(user).where(eq(email,user.email));
        if(user_query.length > 0)
            return res.status(200).json({"status": "ERROR","error":true,"message":"email already exists"});
        const key = crypto.randomBytes(16).toString("hex");
        await db.insert(user).values({
            username: username,
            password: password,
            email: email,
            verification_key: key
        });
        // need to send the email here
        return res.status(200).json({"status":"OK"})
    } catch(err) {
        return res.status(200).json({"status":"ERROR","error":true,"message":"/api/adduser internal issue"});
    }
});

router.get("/api/verify", (req: any, res: any) => {

});

router.post("/api/login", (req: any, res: any) => {
    
});

export default router;