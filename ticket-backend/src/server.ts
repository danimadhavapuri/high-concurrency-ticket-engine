import http from 'http';
import dotenv from 'dotenv';
import app from './app';
import { initSocket } from './lib/socket';

dotenv.config();

const server = http.createServer(app);

// High-Concurrency Connection Tuning:
// Optimized keep-alive and headers timeout to prevent connection drops during 10k+ burst traffic
server.keepAliveTimeout = 65000; // 65 seconds
server.headersTimeout = 66000;   // 66 seconds

// Attach Socket.io to the HTTP server for real-time seat lock broadcasts
initSocket(server);

const PORT = process.env.PORT || 5000;
const PID = process.pid;

server.listen(PORT, () => {
  console.log(`🚀 [Worker PID: ${PID}] Engine active on http://localhost:${PORT}`);
});