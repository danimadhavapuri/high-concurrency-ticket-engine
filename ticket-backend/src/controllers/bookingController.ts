import { Request, Response } from 'express';
import { lockSeatsInRedis, releaseSeatLocksInRedis } from '../services/lockService';
import { broadcastSeatUpdate } from '../lib/socket';
import { bookSeats } from '../services/bookingService';

/**
 * Endpoint to temporarily reserve seats in Redis (5-min TTL) and notify connected clients.
 */
export async function handleLockSeats(req: Request, res: Response) {
  try {
    const { showtimeId, seatIds, userId } = req.body;

    const result = await lockSeatsInRedis({ showtimeId, seatIds, userId });

    broadcastSeatUpdate(showtimeId, 'SEAT_LOCKED', { seatIds, userId });

    return res.status(200).json({
      status: 'success',
      message: 'Seats locked for 5 minutes',
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to lock seats',
    });
  }
}

/**
 * Endpoint to perform atomic PostgreSQL transaction booking and release Redis locks.
 */
export async function handleBookTickets(req: Request, res: Response) {
  try {
    const { showtimeId, seatIds, userId } = req.body;

    const bookingResult = await bookSeats({ showtimeId, seatIds, userId });

    await releaseSeatLocksInRedis(showtimeId, seatIds);

    broadcastSeatUpdate(showtimeId, 'SEAT_BOOKED', { seatIds, userId });

    return res.status(201).json({
      status: 'success',
      message: 'Tickets booked successfully',
      data: bookingResult,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Booking failed',
    });
  }
}