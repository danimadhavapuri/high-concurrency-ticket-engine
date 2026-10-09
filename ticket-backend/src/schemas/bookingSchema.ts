import { z } from 'zod';

export const lockSeatsSchema = z.object({
  body: z.object({
    showtimeId: z.number({ message: 'showtimeId is required' }).int().positive(),
    seatIds: z
      .array(z.number().int().positive())
      .min(1, 'At least one seat ID must be provided'),
    userId: z.number({ message: 'userId is required' }).int().positive(),
  }),
});

export const bookTicketsSchema = z.object({
  body: z.object({
    showtimeId: z.number({ message: 'showtimeId is required' }).int().positive(),
    seatIds: z
      .array(z.number().int().positive())
      .min(1, 'At least one seat ID must be provided'),
    userId: z.number({ message: 'userId is required' }).int().positive(),
  }),
});