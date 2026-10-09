import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server | null = null;

export interface SeatHold {
  userId: string | number;
  expiresAt: number;
}

// Stores active holds per movie: { [movieTitle: string]: { [seatId: string]: SeatHold } }
const seatHoldMap: Record<string, Record<string, SeatHold>> = {};

/**
 * Returns currently active (unexpired) seat holds across all movies.
 */
export function getActiveSeatHolds(): Record<string, Record<string, SeatHold>> {
  const now = Date.now();
  const active: Record<string, Record<string, SeatHold>> = {};

  Object.keys(seatHoldMap).forEach((title) => {
    active[title] = {};
    Object.keys(seatHoldMap[title]).forEach((seatId) => {
      if (seatHoldMap[title][seatId].expiresAt > now) {
        active[title][seatId] = seatHoldMap[title][seatId];
      }
    });
  });

  return active;
}

/**
 * Explicitly releases seat holds for a given movie.
 */
export function clearMovieHolds(movieTitle: string, seats: string[]) {
  if (seatHoldMap[movieTitle]) {
    seats.forEach((seat) => delete seatHoldMap[movieTitle][seat]);
    if (io) {
      io.emit('seat_holds_updated', getActiveSeatHolds());
    }
  }
}

export function initSocket(server: HTTPServer): Server {
  io = new Server(server, {
    cors: {
      origin: '*', // Allows cross-origin connection from Vite frontend
      methods: ['GET', 'POST'],
    },
  });

  // Background ticker: cleans up expired holds every 2 seconds automatically
  setInterval(() => {
    const now = Date.now();
    let changed = false;

    Object.keys(seatHoldMap).forEach((movieTitle) => {
      Object.keys(seatHoldMap[movieTitle]).forEach((seatId) => {
        if (seatHoldMap[movieTitle][seatId].expiresAt <= now) {
          delete seatHoldMap[movieTitle][seatId];
          changed = true;
        }
      });
    });

    if (changed && io) {
      io.emit('seat_holds_updated', getActiveSeatHolds());
    }
  }, 2000);

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected to Socket.io: ${socket.id}`);

    // Send active seat holds immediately upon connection
    socket.emit('seat_holds_updated', getActiveSeatHolds());

    // ⚡ Real-Time Seat Hold Broadcast
    socket.on('toggle_seat_hold', ({ movieTitle, seatId, userId }: { movieTitle: string; seatId: string; userId: string | number }) => {
      if (!seatHoldMap[movieTitle]) seatHoldMap[movieTitle] = {};

      const existingHold = seatHoldMap[movieTitle][seatId];
      const now = Date.now();

      // If already held by the same user, release it (toggle off)
      if (existingHold && String(existingHold.userId) === String(userId)) {
        delete seatHoldMap[movieTitle][seatId];
      } else if (!existingHold || existingHold.expiresAt <= now) {
        // Otherwise, hold it for 3 minutes (180 seconds)
        seatHoldMap[movieTitle][seatId] = {
          userId,
          expiresAt: now + 3 * 60 * 1000,
        };
      }

      // Broadcast to EVERY connected client in real-time!
      io?.emit('seat_holds_updated', getActiveSeatHolds());
    });

    // Clear holds when a user completes their booking
    socket.on('clear_holds', ({ movieTitle, seats }: { movieTitle: string; seats: string[] }) => {
      clearMovieHolds(movieTitle, seats);
    });

    // Room-based subscription for granular showtime channels
    socket.on('join_showtime', (showtimeId: number) => {
      const room = `showtime:${showtimeId}`;
      socket.join(room);
    });

    socket.on('leave_showtime', (showtimeId: number) => {
      const room = `showtime:${showtimeId}`;
      socket.leave(room);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
}

/**
 * Broadcasts real-time seat status updates to all users viewing the same showtime room.
 */
export function broadcastSeatUpdate(
  showtimeId: number,
  event: 'SEAT_LOCKED' | 'SEAT_UNLOCKED' | 'SEAT_BOOKED',
  data: { seatIds: number[]; userId?: number }
) {
  if (io) {
    io.to(`showtime:${showtimeId}`).emit('seat_update', {
      event,
      showtimeId,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
}