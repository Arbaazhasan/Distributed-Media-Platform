import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';

import connectDB from './config/db.js';
import { createRedisClient } from './config/redis.js';
import uploadRouter from './routes/upload.js';
import videoRouter from './routes/video.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to Database
connectDB();

// Middleware
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve output processed files statically
const processedDir = path.resolve(__dirname, '../../processed');
app.use('/processed', express.static(processedDir));

// Routes
app.use('/api/upload', uploadRouter);
app.use('/api/videos', videoRouter);

app.get('/health', (req, res) => {
  res.json({ service: 'api-gateway', status: 'healthy', timestamp: new Date() });
});

// Create HTTP server & Mount Socket.IO signaling
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  allowEIO3: true,
});

io.on('connection', (socket) => {
  console.log(`[API-Gateway WS] Client connected: ${socket.id}`);

  socket.on('join:video', (videoId) => {
    socket.join(`video:${videoId}`);
    console.log(`[API-Gateway WS] Socket ${socket.id} joined room video:${videoId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[API-Gateway WS] Client disconnected: ${socket.id}`);
  });
});

const CHANNEL = 'video-progress';
try {
  const subscriber = createRedisClient();
  subscriber.subscribe(CHANNEL, (err) => {
    if (err) {
      console.warn(`[API-Gateway WS] Redis subscriber notice: ${err.message}`);
    } else {
      console.log(`[API-Gateway WS] Subscribed to Redis channel "${CHANNEL}"`);
    }
  });

  subscriber.on('message', (channel, message) => {
    if (channel === CHANNEL) {
      try {
        const data = JSON.parse(message);
        io.emit('video:progress', data);
        if (data.videoId) {
          io.to(`video:${data.videoId}`).emit('video:progress', data);
        }
      } catch (err) {
        console.warn('[API-Gateway WS] Parse error:', err.message);
      }
    }
  });
} catch (redisErr) {
  console.warn('[API-Gateway WS] Redis subscriber init notice:', redisErr.message);
}

server.listen(PORT, () => {
  console.log(`[API-Gateway] Server running on http://localhost:${PORT}`);
});
