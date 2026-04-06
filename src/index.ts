import express from 'express';
import cors from 'cors';
import subjectsRouter from "./routes/subjects";

const app = express();
const port = 8000;

const frontendUrl = process.env.FRONTEND_URL;
if (!frontendUrl) {
    throw new Error('FRONTEND_URL is not defined');
  }

const allowedOrigins = [frontendUrl, frontendUrl.endsWith('/') ? frontendUrl.slice(0, -1) : `${frontendUrl}/`];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

app.use('/api/subjects', subjectsRouter);

app.get('/', (req, res) => {
  res.json({ message: 'Hello from Classroom Backend!' });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
