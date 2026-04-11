import AgentAPI from "apminsight";

AgentAPI.config()


import express from 'express';
import cors from 'cors';
import subjectsRouter from "./routes/subjects.js";
import securityMiddleware from "./middleware/security";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";

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

app.use(securityMiddleware)

app.all('/api/auth/*splat', toNodeHandler(auth));

app.use('/api/subjects', subjectsRouter);

app.get('/', (req, res) => {
    res.json({ message: 'Hello from Classroom Backend!' });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
