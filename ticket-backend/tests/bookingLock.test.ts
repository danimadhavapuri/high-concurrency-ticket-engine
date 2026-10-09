import { describe, it, expect, beforeEach, vi } from 'vitest';
import RedisMock from 'ioredis-mock';

// Intercept Redis module with in-memory mock before app load
vi.mock('../src/lib/redis', () => {
  const redisMock = new RedisMock();
  return {
    redis: redisMock,
    default: redisMock,
  };
});

import request from 'supertest';
import app  from '../src/app';
import { redis } from '../src/lib/redis';

describe('POST /api/bookings/lock - Concurrency & Race Condition Tests', () => {
  const showtimeId = 101;
  const seatIds = [12];

  beforeEach(async () => {
    await redis.flushdb();
  });

  it('should allow exactly 1 request to acquire the seat lock when 10 requests hit concurrently', async () => {
    const TOTAL_CONCURRENT_REQUESTS = 10;

    const lockRequests = Array.from({ length: TOTAL_CONCURRENT_REQUESTS }, (_, index) =>
      request(app)
        .post('/api/bookings/lock')
        .send({
          showtimeId,
          seatIds,
          userId: index + 1,
        })
    );

    const responses = await Promise.all(lockRequests);

    const successfulRequests = responses.filter((res) => res.status === 200);
    const conflictingRequests = responses.filter((res) => res.status === 400 || res.status === 409);

    expect(successfulRequests).toHaveLength(1);
    expect(conflictingRequests).toHaveLength(TOTAL_CONCURRENT_REQUESTS - 1);
  });

  it('should prevent a different user from acquiring a lock on an already locked seat', async () => {
    // 1. User 1 acquires lock on seat 12
    const firstAttempt = await request(app)
      .post('/api/bookings/lock')
      .send({ showtimeId, seatIds, userId: 1 });

    expect(firstAttempt.status).toBe(200);

    // 2. User 2 attempts to lock the same seat (should fail)
    const secondAttempt = await request(app)
      .post('/api/bookings/lock')
      .send({ showtimeId, seatIds, userId: 2 });

    expect([400, 409]).toContain(secondAttempt.status);
  });
});