import { Router, Request, Response } from 'express';
import { validate } from '../middleware/validate';
import { lockSeatsSchema, bookTicketsSchema } from '../schemas/bookingSchema';
import { handleLockSeats, handleBookTickets } from '../controllers/bookingController';
import { clearMovieHolds, getIO } from '../lib/socket';

const router = Router();

// In-memory persistent bookings cache synced with catalog
let bookings: any[] = [];

// GET /api/bookings - Returns all confirmed bookings
router.get('/', (req: Request, res: Response) => {
  res.json(bookings);
});

// POST /api/bookings - Creates confirmed booking, releases holds, and broadcasts LIVE to all clients
router.post('/', (req: Request, res: Response) => {
  const { movieTitle, seats, totalPrice, user, email, date, transactionId, paymentMethod } = req.body;

  const newBooking = {
    id: String(Date.now()),
    _id: String(Date.now()),
    movieTitle,
    seats: Array.isArray(seats) ? seats : [],
    totalPrice,
    user: user || 'Guest User',
    email: email || '',
    date: date || new Date().toLocaleDateString(),
    transactionId: transactionId || 'TXN_' + Math.random().toString(36).substring(2, 9).toUpperCase(),
    paymentMethod: paymentMethod || 'UPI',
    paymentStatus: 'COMPLETED',
  };

  bookings.push(newBooking);

  // 1. Release temporary holds now that tickets are confirmed
  if (movieTitle && Array.isArray(seats)) {
    clearMovieHolds(movieTitle, seats);
  }

  // 2. ⚡ Broadcast the confirmed booking LIVE to all connected browsers so seats turn RED instantly!
  try {
    getIO().emit('booking_confirmed', newBooking);
  } catch (err) {
    console.error('Socket emit error on booking confirmation:', err);
  }

  return res.status(201).json(newBooking);
});

// DELETE /api/bookings/:id - Cancels an entire booking and broadcasts update
router.delete('/:id', (req: Request, res: Response) => {
  const bookingId = req.params.id;
  const booking = bookings.find((b) => b.id === bookingId || b._id === bookingId);

  if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }

  const refundAmount = booking.totalPrice;
  const refundTxnId = 'REF_' + Math.random().toString(36).substring(2, 10).toUpperCase();

  bookings = bookings.filter((b) => b.id !== bookingId && b._id !== bookingId);

  // ⚡ Broadcast cancellation LIVE so seats turn back to gray for everyone
  try {
    getIO().emit('booking_cancelled', { bookingId });
  } catch (err) {
    console.error('Socket emit error on cancellation:', err);
  }

  return res.status(200).json({
    message: 'Booking cancelled successfully',
    refundAmount,
    refundTransactionId: refundTxnId,
  });
});

// DELETE /api/bookings/:bookingId/seats/:seatId - Cancels an individual seat and broadcasts update
router.delete('/:bookingId/seats/:seatId', (req: Request, res: Response) => {
  const { bookingId, seatId } = req.params;
  const booking = bookings.find((b) => b.id === bookingId || b._id === bookingId);

  if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }

  const perSeatPrice = booking.seats.length > 0 ? booking.totalPrice / booking.seats.length : 0;
  booking.seats = booking.seats.filter((s: string) => s !== seatId);
  booking.totalPrice -= perSeatPrice;

  if (booking.seats.length === 0) {
    bookings = bookings.filter((b) => b.id !== bookingId && b._id !== bookingId);
  }

  const refundTxnId = 'REF_SEAT_' + Math.random().toString(36).substring(2, 8).toUpperCase();

  // ⚡ Broadcast single seat cancellation LIVE
  try {
    getIO().emit('seat_cancelled', { bookingId, seatId });
  } catch (err) {
    console.error('Socket emit error on seat cancellation:', err);
  }

  return res.status(200).json({
    message: `Seat ${seatId} cancelled`,
    refundAmount: perSeatPrice,
    refundTransactionId: refundTxnId,
  });
});

// Concurrency Engine Endpoints
router.post('/lock', validate(lockSeatsSchema), handleLockSeats);
router.post('/book', validate(bookTicketsSchema), handleBookTickets);

export default router;