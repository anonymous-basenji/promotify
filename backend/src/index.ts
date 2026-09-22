import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import teamRoutes from './routes/team.routes.js';
import groupRoutes from './routes/group.routes.js';
import postRoutes from './routes/post.routes.js';

dotenv.config();
if (typeof import.meta.dirname === 'string') {
  dotenv.config({ path: path.resolve(import.meta.dirname, '../../.env') });
}

const app = express();
const PORT = process.env.BACKEND_PORT || 3000;

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://promotify-one.vercel.app',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '16kb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many requests, slow down.' },
  skip: () => process.env.NODE_ENV !== 'production',
});
app.use(limiter);

app.get(['/api/health', '/health'], (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use(['/api/teams', '/teams'], teamRoutes);
app.use(['/api/groups', '/groups'], groupRoutes);
app.use(['/api/posts', '/posts'], postRoutes);

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Promotify One Backend running on http://localhost:${PORT}`);
  });
}

export default app;
