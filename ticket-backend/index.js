// Load Environment Variables First!
require('dotenv').config();

// 1. Import tools
const jwt = require('jsonwebtoken');
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

// 2. Initialize tools
const app = express();
const prisma = new PrismaClient();

// 3. Middleware
app.use(express.json());

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token." });
    }
    req.user = user;
    next();
  });
};

// 4. API Routes

// Home Route (Health Check)
app.get('/', (req, res) => {
  res.send("Welcome to the Movie Ticket Booking API!");
});

// GET: Protected route - View user profile
app.get('/profile', authenticateToken, async (req, res) => {
  res.json({ message: "Welcome to your profile!", user: req.user });
});

// GET: Fetch all movies from PostgreSQL
app.get('/films', async (req, res) => {
  const allFilms = await prisma.film.findMany();
  res.json(allFilms);
});

// GET: Fetch a film and include all its scheduled showtimes
app.get('/films/:id/showtimes', async (req, res) => {
  const filmId = parseInt(req.params.id);
  const filmWithShowtimes = await prisma.film.findUnique({
    where: { id: filmId },
    include: {
      showtimes: true // Prisma automatically performs a SQL JOIN!
    }
  });
  res.json(filmWithShowtimes);
});

// POST: Add a new movie to PostgreSQL
app.post('/films', async (req, res) => {
  const newFilm = await prisma.film.create({
    data: {
      title: req.body.title,
      genre: req.body.genre,
      duration: req.body.duration
    }
  });
  res.status(201).json(newFilm);
});

// POST: Register a new user
app.post('/users', async (req, res) => {
  try {
    const { first_name, last_name, email, phone_no, password_hash } = req.body;

    if (!password_hash || !email) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password_hash, saltRounds);

    const newUser = await prisma.user.create({
      data: {
        first_name,
        last_name,
        email,
        phone_no,
        password_hash: hashedPassword
      }
    });

    const { password_hash: _, ...userResponse } = newUser;
    res.status(201).json(userResponse);
  } catch (error) {
    res.status(400).json({ error: "Could not create user. Email may already exist." });
  }
});

// POST: Login user
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email }
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user.id, userEmail: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: "Login successful!",
      token: token
    });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong on the server" });
  }
});

// POST: Schedule a showtime
app.post('/showtimes', async (req, res) => {
  try {
    const { filmId, startTime, price } = req.body;

    const newShowtime = await prisma.showtime.create({
      data: {
        film_id: parseInt(filmId),
        start_time: new Date(startTime),
        ticket_price: parseFloat(price)
      }
    });

    res.status(201).json(newShowtime);
  } catch (error) {
    console.log(error); 
    res.status(400).json({ error: "Could not create showtime. Check your data." });
  }
});

// POST: Add a new seat
app.post('/seats', async (req, res) => {
  try {
    const { seatNo } = req.body;

    const newSeat = await prisma.seat.create({
      data: {
        seat_no: seatNo
      }
    });

    res.status(201).json(newSeat);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: "Could not create seat." });
  }
});

// POST: Book a ticket (Protected Route!)
app.post('/tickets', authenticateToken, async (req, res) => {
  try {
    const { showtimeId, seatId } = req.body;
    const { userId } = req.user;

    const newTicket = await prisma.ticket.create({
      data: {
        showtime_id: parseInt(showtimeId),
        seat_id: parseInt(seatId),
        user_id: parseInt(userId)
      }
    });


    // 1. Check if the seat is already booked for this showtime 🔍
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        showtime_id: parseInt(showtimeId),
        seat_id: parseInt(seatId)
      }
    });

    res.status(201).json(newTicket);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: "Could not book ticket. Check your data." });
  }
});


// GET: Fetch all booked tickets for the logged-in user 🔑
app.get('/tickets', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;

    // 1. Find all tickets where user_id matches the logged-in user
    const userTickets = await prisma.ticket.findMany({
      where: {
        user_id: parseInt(userId)
      },
      include: {
        seat: true, // 💺 Include seat info
        showtime: {
          include: {
            film: true // 🍿 Nested include: fetches movie details for this showtime!
          }
        }
      }
    });

    // 2. Return the array of detailed tickets
    res.json(userTickets);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retrieve tickets." });
  }
});


// 5. Turn server on
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});