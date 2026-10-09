import { redis } from '../lib/redis';

const LOCK_TTL_SECONDS = 300; // 5-minute seat reservation TTL

interface LockSeatsRedisInput {
  showtimeId: number;
  seatIds: number[];
  userId: number;
}

/**
 * Attempts to hold temporary seat locks in Redis for 5 minutes.
 */
export async function lockSeatsInRedis({ showtimeId, seatIds, userId }: LockSeatsRedisInput) {
  // 1. Check if any requested seats are locked by another user
  for (const seatId of seatIds) {
    const lockKey = `lock:showtime:${showtimeId}:seat:${seatId}`;
    const existingLock = await redis.get(lockKey);

    if (existingLock && Number(existingLock) !== userId) {
      throw new Error(`Seat ID ${seatId} is temporarily held by another customer.`);
    }
  }

  // 2. Set 5-minute expiration lock keys in an atomic Redis pipeline
  const pipeline = redis.pipeline();
  for (const seatId of seatIds) {
    const lockKey = `lock:showtime:${showtimeId}:seat:${seatId}`;
    pipeline.set(lockKey, userId.toString(), 'EX', LOCK_TTL_SECONDS);
  }

  await pipeline.exec();

  return {
    success: true,
    lockedSeatIds: seatIds,
    expiresInSeconds: LOCK_TTL_SECONDS,
  };
}

/**
 * Explicitly releases Redis seat locks after successful ticket creation.
 */
export async function releaseSeatLocksInRedis(showtimeId: number, seatIds: number[]) {
  const keys = seatIds.map((seatId) => `lock:showtime:${showtimeId}:seat:${seatId}`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}