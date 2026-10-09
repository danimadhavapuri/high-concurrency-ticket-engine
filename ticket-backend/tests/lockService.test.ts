import { describe, it, expect, beforeEach, vi } from 'vitest';
import RedisMock from 'ioredis-mock';

// 1. Intercept the Redis client with ioredis-mock before loading lockService
vi.mock('../src/lib/redis', () => {
  const redisMock = new RedisMock();
  return {
    redis: redisMock,
    default: redisMock,
  };
});

import { lockSeatsInRedis, releaseSeatLocksInRedis } from '../src/services/lockService';
import { redis } from '../src/lib/redis';

describe('LockService Unit Tests - Redis Atomic Operations', () => {
  const showtimeId = 101;
  const seatIds = [12, 13];
  const userId = 1;

  beforeEach(async () => {
    // Clear Redis mock keys before each unit test
    await redis.flushdb();
  });

  describe('lockSeatsInRedis', () => {
    it('should successfully acquire locks for unreserved seats in Redis', async () => {
      const result = await lockSeatsInRedis({ showtimeId, seatIds, userId });

      // Check return payload or result success
      expect(result).toBeDefined();

      // Inspect Redis directly to verify keys are stored
      for (const seatId of seatIds) {
        const key = `lock:showtime:${showtimeId}:seat:${seatId}`;
        const storedUserId = await redis.get(key);
        expect(storedUserId).toBe(String(userId));
      }
    });

    it('should set key expiration TTL (5-minute window)', async () => {
      await lockSeatsInRedis({ showtimeId, seatIds, userId });

      for (const seatId of seatIds) {
        const key = `lock:showtime:${showtimeId}:seat:${seatId}`;
        const ttl = await redis.ttl(key);
        // TTL should be positive and <= 300 seconds (5 minutes)
        expect(ttl).toBeGreaterThan(0);
        expect(ttl).toBeLessThanOrEqual(300);
      }
    });

    it('should reject locking if at least one seat in the array is already locked by another user', async () => {
      // User 1 locks seat 12
      await lockSeatsInRedis({ showtimeId, seatIds: [12], userId: 1 });

      // User 2 attempts to lock seats [12, 13]
      await expect(
        lockSeatsInRedis({ showtimeId, seatIds: [12, 13], userId: 2 })
      ).rejects.toThrow();

      // Ensure seat 13 was not locked due to partial failure / atomic rollback
      const seat13Key = `lock:showtime:${showtimeId}:seat:13`;
      const seat13Val = await redis.get(seat13Key);
      expect(seat13Val).toBeNull();
    });
  });

  describe('releaseSeatLocksInRedis', () => {
    it('should release seat locks from Redis', async () => {
      // 1. Lock seats first
      await lockSeatsInRedis({ showtimeId, seatIds, userId });

      // 2. Release seat locks
      await releaseSeatLocksInRedis(showtimeId, seatIds);

      // 3. Verify Redis keys are deleted
      for (const seatId of seatIds) {
        const key = `lock:showtime:${showtimeId}:seat:${seatId}`;
        const storedVal = await redis.get(key);
        expect(storedVal).toBeNull();
      }
    });
  });
});