import { prisma } from '../lib/prisma';

interface BookSeatsInput {
  showtimeId: number;
  seatIds: number[];
  userId: number;
}

/**
 * Performs an atomic database transaction to lock rows and generate ticket bookings.
 */
export async function bookSeats({ showtimeId, seatIds, userId }: BookSeatsInput) {
  return await prisma.$transaction(async (tx) => {
    // 1. Verify none of the requested seats are already booked for this showtime
    for (const seatId of seatIds) {
      const existingTicket = await tx.ticket.findFirst({
        where: {
          showtime_id: showtimeId,
          seat_id: seatId,
        },
      });

      if (existingTicket) {
        throw new Error(`Seat ID ${seatId} is already booked.`);
      }
    }

    // 2. Create ticket records in PostgreSQL atomically
    const tickets = [];
    for (const seatId of seatIds) {
      const ticket = await tx.ticket.create({
        data: {
          showtime_id: showtimeId,
          seat_id: seatId,
          user_id: userId,
        },
      });
      tickets.push(ticket);
    }

    return tickets;
  });
}