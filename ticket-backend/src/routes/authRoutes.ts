import { Router } from 'express';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../schemas/authSchema';
import { handleSignup, handleLogin } from '../controllers/authController';

import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Registration routes protected with rate limiter
router.post('/signup', authRateLimiter, validate(registerSchema), handleSignup);
router.post('/register', authRateLimiter, validate(registerSchema), handleSignup); // Alias for compatibility

// Login route protected with rate limiter
router.post('/login', authRateLimiter, validate(loginSchema), handleLogin);

export default router;