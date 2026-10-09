import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory sliding window cache per IP address
const ipRequestMap = new Map<string, RateLimitRecord>();

interface RateLimiterOptions {
  windowMs: number; // Time window in milliseconds (e.g. 10,000ms = 10s)
  maxRequests: number; // Max allowed requests within the window
  message?: string;
}

/**
 * High-Performance Sliding Window Rate Limiter:
 * Protects critical endpoints (seat locks, auth, checkout) against automated ticket scalper bots,
 * rapid brute-force attacks, and distributed denial-of-service (DDoS).
 */
export function createRateLimiter(options: RateLimiterOptions) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests. Anti-scalper protection triggered. Please wait.',
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Determine client identifier (IP or forwarded IP)
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown_client';

    const now = Date.now();
    const clientRecord = ipRequestMap.get(clientIp);

    if (!clientRecord || now > clientRecord.resetTime) {
      // First request or window expired: start new window
      ipRequestMap.set(clientIp, {
        count: 1,
        resetTime: now + windowMs,
      });

      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - 1);
      return next();
    }

    if (clientRecord.count >= maxRequests) {
      // Limit exceeded: reject with HTTP 429 Too Many Requests
      const retryAfterSeconds = Math.ceil((clientRecord.resetTime - now) / 1000);

      res.setHeader('Retry-After', retryAfterSeconds);
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);

      return res.status(429).json({
        status: 'error',
        statusCode: 429,
        message,
        retryAfterSeconds,
      });
    }

    // Increment request count within active window
    clientRecord.count += 1;
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - clientRecord.count);

    return next();
  };
}

// Pre-configured rate limiters
export const seatLockRateLimiter = createRateLimiter({
  windowMs: 10 * 1000, // 10 seconds
  maxRequests: 20, // Max 20 clicks per 10s per user
  message: 'Seat reservation rate limit exceeded. Please wait 10 seconds before retrying.',
});

export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // Max 10 login/signup attempts per minute
  message: 'Too many authentication attempts. Please wait 60 seconds.',
});
