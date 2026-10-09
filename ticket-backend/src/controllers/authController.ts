import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_fallback_key';
const SALT_ROUNDS = 10;

/**
 * Handles new user registration:
 * 1. Checks if the user already exists in PostgreSQL
 * 2. Hashes the password with Bcrypt
 * 3. Persists the user in PostgreSQL via Prisma
 * 4. Issues a signed JWT token
 */
export async function handleSignup(req: Request, res: Response) {
  try {
    const { name, email, phone, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        error: 'An account with this email already exists',
      });
    }

    // 2. Hash the raw password securely
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Split name into first and last name for our Prisma User model
    const [firstName = '', ...rest] = name.trim().split(' ');
    const lastName = rest.join(' ') || firstName;

    // 3. Save new user into PostgreSQL
    const newUser = await prisma.user.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        email: normalizedEmail,
        phone_no: phone || '',
        password_hash: passwordHash,
      },
    });

    // 4. Generate a signed JWT token (valid for 24 hours)
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      token,
      user: {
        id: String(newUser.id),
        name: `${newUser.first_name} ${newUser.last_name}`,
        email: newUser.email,
        phone: newUser.phone_no,
      },
    });
  } catch (error: any) {
    console.error('Signup Error:', error);
    return res.status(500).json({
      status: 'error',
      error: 'Failed to register user. Please try again.',
    });
  }
}

/**
 * Handles user login:
 * 1. Finds user by email in PostgreSQL
 * 2. Compares incoming password with stored hash via Bcrypt
 * 3. Returns signed JWT token on success
 */
export async function handleLogin(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Find user in the database
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        error: 'Invalid email or password',
      });
    }

    // 2. Verify password against the stored bcrypt hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        error: 'Invalid email or password',
      });
    }

    // 3. Issue JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      status: 'success',
      message: 'Login successful',
      token,
      user: {
        id: String(user.id),
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        phone: user.phone_no,
      },
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    return res.status(500).json({
      status: 'error',
      error: 'Failed to log in. Please try again.',
    });
  }
}