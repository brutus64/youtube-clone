//IMPORTS
import 'dotenv/config';
import express, { urlencoded } from 'express';
import { db } from './drizzle/db';
import { user } from './drizzle/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import cors from 'cors';
import publicRoutes from './routes/publicRoutes.js';
import authRoutes from './routes/authRoutes.js';
import session from 'express-session';


//MIDDLEWARE
const app = express();
const port = process.env.PORT || 5000;
app.use(express.json()); //parses 
app.use(urlencoded({ extended: false }));
app.use(cors( {
    origin: '*',
    credentials: true
}))

app.use(session())

//ACTUAL ROUTES
app.use('/api', publicRoutes);
app.use('/api', authRoutes);



//SET UP LISTEN
const databaseUrl = process.env.DATABASE_URL;
console.log("DB URL", databaseUrl, "DB PORT", process.env.PORT);
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}).on('error', (err) => {
    console.error('Failed to start server:', err);
});