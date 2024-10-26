import 'dotenv/config';
import express from 'express';

const app = express();
const port = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});
const databaseUrl = process.env.DATABASE_URL;
console.log("DB URL", databaseUrl, "DB PORT", process.env.PORT);
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}).on('error', (err) => {
  console.error('Failed to start server:', err);
});