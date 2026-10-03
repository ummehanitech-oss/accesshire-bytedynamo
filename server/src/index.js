import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import healthRouter from './routes/health.js';
import analyzeRouter from './routes/analyze.js';
import profileRouter from './routes/profile.js';
import applicationsRouter from './routes/applications.js';
import resumeRouter from './routes/resume.js';
import { errorHandler } from './utils/errorHandler.js';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Security: CORS configured for localhost only
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps or curl) or if origin is in whitelist
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Cross-Origin Request Blocked by AccessHire CORS Policy.'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Safety: limit JSON body to 1 MB
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Lightweight request logging: method, path (without query string), status code, duration
// Does NOT log headers, request bodies, credentials, or sensitive data
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const pathOnly = (req.originalUrl || req.url || '').split('?')[0];
    console.log(`${req.method} ${pathOnly} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Route registrations
app.use('/api/health', healthRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/profile', profileRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/resume', resumeRouter);

// Central error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`AccessHire server is running on http://localhost:${PORT}`);
});

export default app;
