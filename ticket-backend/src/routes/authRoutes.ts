import { Router } from 'express';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../schemas/authSchema';
import { handleSignup, handleLogin } from '../controllers/authController';

const router = Router();

// Registration routes
router.post('/signup', validate(registerSchema), handleSignup);
router.post('/register', validate(registerSchema), handleSignup); // Alias for compatibility

// Login route
router.post('/login', validate(loginSchema), handleLogin);

export default router;