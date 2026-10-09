import http from 'http';
import dotenv from 'dotenv';
import app from './app';
import { initSocket } from './lib/socket';

dotenv.config();

const server = http.createServer(app);

// Attach Socket.io to the HTTP server for real-time seat lock broadcasts
initSocket(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 High-Concurrency Ticket Engine running on http://localhost:${PORT}`);
});