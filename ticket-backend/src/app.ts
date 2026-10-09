import express from 'express';
import cors from 'cors';
import bookingRoutes from './routes/bookingRoutes';
import authRoutes from './routes/authRoutes';
import movieRoutes from './routes/movieRoutes';
import reviewRoutes from './routes/reviewRoutes';

const app = express();

// Standard Middlewares
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.send('API Health Check OK');
});

import { getActiveSeatHolds } from './lib/socket';

// Mount Routes
app.use('/api/bookings', bookingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', authRoutes); // Alias: allows both /api/login and /api/auth/login
app.use('/api/movies', movieRoutes);
app.use('/api/reviews', reviewRoutes);
app.get('/api/seats/holds', (req, res) => res.json(getActiveSeatHolds()));

export default app;