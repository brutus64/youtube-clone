//IMPORTS
import 'dotenv/config';
import express, { urlencoded } from 'express';
import cors from 'cors';
import PgSession from 'connect-pg-simple';
import publicRoutes from './routes/publicRoutes.js';
import authRoutes from './routes/authRoutes.js';
import session from 'express-session';
import pkg from 'pg';
const {Pool} = pkg;

//MIDDLEWARE
const app = express();
const port = process.env.PORT || 5000;
app.use(express.json()); //parses 
app.use(urlencoded({ extended: false }));
app.use(cors( {
    origin: '*',
    credentials: true
}))

const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL, 
    max: 10 // Limit pool size for session management
});

app.use(session({
    store: new (PgSession(session))({
      pool: pgPool,
      tableName: "session",
      createTableIfMissing: true
    }),
    secret: 'hufgirh348931jio1', //some string
    saveUninitialized: false,
    resave: false,
    cookie: { 
      secure: false, //for http
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    }
}));
  
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