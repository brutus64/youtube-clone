//IMPORTS
import 'dotenv/config';
import express, { urlencoded } from 'express';
import cors from 'cors';
import PgSession from 'connect-pg-simple';
import userRoutes from './routes/userRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import videoRoutes from './routes/videoRoutes.js';
import session from 'express-session';
import pkg from 'pg';
// import bodyParser from 'body-parser';

//tried clusters it gives a 5 second error for /api/like
const {Pool} = pkg;
import { authMiddlware } from './middleware/auth.js';
import initDB from './drizzle/initDB.js';
//MIDDLEWARE
const app = express();
const port: any = process.env.PORT || 5000;

// app.use(bodyParser.json( {limit: '900mb' }))
// app.use(bodyParser.urlencoded({ limit: '900mb', extended: true}))
app.use(express.json({ limit: '1000mb' }));
app.use(express.urlencoded({ limit: '1000mb', extended: true }));
app.use(express.json()); //parses 
// app.use(urlencoded({ extended: false }));
app.use(cors( {
    origin: '*',
    credentials: true
}))

// const pgPool = new Pool({
//     connectionString: process.env.DATABASE_URL, 
//     max: 10 // Limit pool size for session management
// });

//attempt at using pgbouncer
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  // Add these for better pgbouncer compatibility
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
});

app.use(session({
    store: new (PgSession(session))({
      pool: pgPool,
      tableName: "session",
      createTableIfMissing: true
    }),
    secret: 'hufgirh348931jio1', //some string
    saveUninitialized: true,
    resave: true,
    cookie: { 
      secure: false, //for http
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    }
}));
  

// if (port == 5000) {
//   await initUser();
//   await initVideos();
// }

//ACTUAL ROUTES
app.use('/api', userRoutes);
app.use('/api', fileRoutes);
app.use('/api', videoRoutes);

app.get("/media/:mpeg", authMiddlware, (req: any, res: any) => {
    console.log("MEDIA");
    console.log("RAHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH", req.params.mpeg);
    try{
    //   let mpeg = req.params.mpeg;
    //   const regex = /^chunk_(254000|507000|759000|1013000|1254000|1883000|3134000|4952000)_[1-5].m4s$/;
    //   const regex2 =/^chunk_(254000|507000|759000|1013000|1254000|1883000|3134000|4952000)_init.mp4$/;
    //   if(mpeg === "output.mpd") {
    //     return res.sendFile(join(__dirname, "public/dash/output.mpd"));
    //   } else if(regex.test(mpeg) || regex2.test(mpeg)) {
    //     return res.sendFile(join(__dirname, `public/dash/${mpeg}`));
    //   } else {
    //     console.log("CATCH404");
    //    return res.status(404).json({status: "ERROR1", error:true, message: "File Not Found"});
    //   }
        const mpeg = req.params.mpeg;
        const path = `/var/html/media/${mpeg}`;
        return res.sendFile(path)
    } catch(err) {
    //   console.log("CATCH");
    //   console.log(err);
      return res.status(200).json({status: "ERROR2", error:true, message:"File Not Found2"});
    }
  });

//SET UP LISTEN
const databaseUrl = process.env.DATABASE_URL;
console.log("DB URL", databaseUrl, "DB PORT", process.env.PORT);
async function tryListen(portNum:number) {
  console.log(typeof portNum);
  app.listen(portNum, async () => {
    console.log(`Server listening on port ${portNum}`);
    await initDB();
  })
  .on('error', (err:any) => {
    if (err.code === 'EADDRINUSE' && portNum < 5010) {
      console.log(`Port ${portNum} is in use, trying another...`);
      tryListen(portNum + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

tryListen(+port);