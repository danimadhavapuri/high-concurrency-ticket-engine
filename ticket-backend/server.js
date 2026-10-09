const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();

app.use(cors());
app.use(express.json());

// 🔍 Logger Middleware: Log incoming requests in terminal
app.use((req, res, next) => {
  console.log(`📩 ${req.method} ${req.url}`);
  next();
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// ------------------------------------------------------------------
// In-Memory Data Storage
// ------------------------------------------------------------------
let users = [
  {
    id: 'u1',
    name: 'Dani',
    email: 'dani@gmail.com',
    password: 'password123'
  }
];

let movies = [
  {
    id: '1',
    _id: '1',
    title: 'Epic',
    genre: 'Action',
    price: 250,
    rating: 4.8,
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: '2',
    _id: '2',
    title: 'Fidaa',
    genre: 'Romance',
    price: 200,
    rating: 4.5,
    poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: '3',
    _id: '3',
    title: 'Perfect',
    genre: 'Drama',
    price: 220,
    rating: 4.7,
    poster: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  }
];

let bookings = [];
let reviews = [
  { id: 'r1', movieId: '1', user: 'Dani', rating: 5, comment: 'Mind-blowing visuals and great sound design!', createdAt: '2026-09-15' },
  { id: 'r2', movieId: '1', user: 'Alex', rating: 4, comment: 'Really good storyline and acting.', createdAt: '2026-09-18' }
];

// Stores active holds per movie: { [movieTitle]: { [seatId]: { userId, expiresAt } } }
let seatHoldMap = {};

// Filter out expired seat holds automatically
const getActiveSeatHolds = () => {
  const now = Date.now();
  const active = {};

  Object.keys(seatHoldMap).forEach((title) => {
    active[title] = {};
    Object.keys(seatHoldMap[title]).forEach((seatId) => {
      if (seatHoldMap[title][seatId].expiresAt > now) {
        active[title][seatId] = seatHoldMap[title][seatId];
      }
    });
  });

  return active;
};

// Automatic cleanup ticker: check every 2 seconds
setInterval(() => {
  const now = Date.now();
  let changed = false;

  Object.keys(seatHoldMap).forEach((movieTitle) => {
    Object.keys(seatHoldMap[movieTitle]).forEach((seatId) => {
      if (seatHoldMap[movieTitle][seatId].expiresAt <= now) {
        delete seatHoldMap[movieTitle][seatId];
        changed = true;
      }
    });
  });

  if (changed) {
    io.emit('seat_holds_updated', getActiveSeatHolds());
  }
}, 2000);

// ------------------------------------------------------------------
// Socket.io Real-Time Seat Holding & Sync Engine
// ------------------------------------------------------------------
io.on('connection', (socket) => {
  console.log('⚡ Client connected:', socket.id);

  socket.emit('seat_holds_updated', getActiveSeatHolds());

  socket.on('toggle_seat_hold', ({ movieTitle, seatId, userId }) => {
    if (!seatHoldMap[movieTitle]) seatHoldMap[movieTitle] = {};

    const existingHold = seatHoldMap[movieTitle][seatId];
    const now = Date.now();

    if (existingHold && existingHold.userId === userId) {
      delete seatHoldMap[movieTitle][seatId];
    } else if (!existingHold || existingHold.expiresAt <= now) {
      seatHoldMap[movieTitle][seatId] = {
        userId,
        expiresAt: now + 3 * 60 * 1000
      };
    }

    io.emit('seat_holds_updated', getActiveSeatHolds());
  });

  socket.on('clear_holds', ({ movieTitle, seats }) => {
    if (seatHoldMap[movieTitle]) {
      seats.forEach((seat) => delete seatHoldMap[movieTitle][seat]);
      io.emit('seat_holds_updated', getActiveSeatHolds());
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ------------------------------------------------------------------
// Email Transporter
// ------------------------------------------------------------------
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

const sendBookingEmail = async (bookingDetails) => {
  if (!bookingDetails.email) return;

  const mailOptions = {
    from: '"TicketHub Movies" <no-reply@tickethub.com>',
    to: bookingDetails.email,
    subject: `🎟️ Ticket Confirmation: ${bookingDetails.movieTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0f172a; color: #ffffff; border-radius: 12px;">
        <h2 style="color: #38bdf8;">Booking Confirmed! 🎉</h2>
        <p>Hi <strong>${bookingDetails.user}</strong>,</p>
        <p>Thank you for booking with TicketHub. Here are your ticket details:</p>
        <table style="width: 100%; color: #ffffff; margin-top: 15px; border-collapse: collapse;">
          <tr><td><strong>Movie:</strong></td><td>${bookingDetails.movieTitle}</td></tr>
          <tr><td><strong>Seats:</strong></td><td>${bookingDetails.seats.join(', ')}</td></tr>
          <tr><td><strong>Total Paid:</strong></td><td>₹${bookingDetails.totalPrice}</td></tr>
          <tr><td><strong>Transaction ID:</strong></td><td>${bookingDetails.transactionId}</td></tr>
          <tr><td><strong>Date:</strong></td><td>${bookingDetails.date}</td></tr>
        </table>
        <p style="margin-top: 20px; color: #94a3b8; font-size: 12px;">Show this email or your QR code ticket pass at the cinema entrance.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent to ${bookingDetails.email}`);
  } catch (err) {
    console.error('Email sending failed:', err.message);
  }
};

// ------------------------------------------------------------------
// Authentication Routes (Signup & Login)
// ------------------------------------------------------------------
const handleSignup = (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const existingUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: 'User with this email already exists' });
  }

  const newUser = {
    id: String(Date.now()),
    name: name || email.split('@')[0],
    email: email.toLowerCase(),
    phone: phone || '',
    password
  };

  users.push(newUser);
  console.log('✅ New User Registered:', newUser.email);

  res.status(201).json({
    message: 'User registered successfully',
    token: 'mock-jwt-token-' + newUser.id,
    user: { id: newUser.id, name: newUser.name, email: newUser.email }
  });
};

const handleLogin = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  console.log('✅ User Logged In:', user.email);

  res.json({
    message: 'Login successful',
    token: 'mock-jwt-token-' + user.id,
    user: { id: user.id, name: user.name, email: user.email }
  });
};

// Aliases to handle any auth endpoint pattern
app.post('/api/auth/signup', handleSignup);
app.post('/api/auth/register', handleSignup);
app.post('/api/signup', handleSignup);
app.post('/api/register', handleSignup);

app.post('/api/auth/login', handleLogin);
app.post('/api/login', handleLogin);

// ------------------------------------------------------------------
// Movie Routes
// ------------------------------------------------------------------
app.get('/api/movies', (req, res) => {
  res.json(movies);
});

app.post('/api/movies', (req, res) => {
  const { title, genre, price, poster, trailerUrl } = req.body;
  const newMovie = {
    id: String(Date.now()),
    _id: String(Date.now()),
    title: title || 'Untitled Movie',
    genre: genre || 'Action',
    price: Number(price) || 200,
    rating: 5.0,
    poster: poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500',
    trailerUrl: trailerUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  };
  movies.push(newMovie);
  res.status(201).json(newMovie);
});

app.delete('/api/movies/:id', (req, res) => {
  movies = movies.filter((m) => m.id !== req.params.id && m._id !== req.params.id);
  res.json({ message: 'Movie deleted successfully' });
});

// ------------------------------------------------------------------
// Seat Locking Routes
// ------------------------------------------------------------------
app.get('/api/seats/holds', (req, res) => {
  res.json(getActiveSeatHolds());
});

app.post('/api/seats/lock', (req, res) => {
  const { movieTitle, seats, userId } = req.body;
  const now = Date.now();
  const lockDuration = 3 * 60 * 1000;

  if (!seatHoldMap[movieTitle]) seatHoldMap[movieTitle] = {};

  const activeHolds = getActiveSeatHolds()[movieTitle] || {};
  const lockedConflict = seats.find((seat) => {
    const hold = activeHolds[seat];
    return hold && hold.userId !== userId && hold.expiresAt > now;
  });

  if (lockedConflict) {
    return res.status(409).json({ error: `Seat ${lockedConflict} is currently held by another user ⏳` });
  }

  seats.forEach((seat) => {
    seatHoldMap[movieTitle][seat] = {
      userId: userId || 'anonymous',
      expiresAt: now + lockDuration
    };
  });

  io.emit('seat_holds_updated', getActiveSeatHolds());

  res.json({ message: 'Seats locked successfully', expiresAt: now + lockDuration });
});

// ------------------------------------------------------------------
// Booking Routes
// ------------------------------------------------------------------
app.get('/api/bookings', (req, res) => {
  res.json(bookings);
});

app.post('/api/bookings', async (req, res) => {
  const { movieTitle, seats, totalPrice, user, email, date, transactionId, paymentMethod } = req.body;

  const newBooking = {
    id: String(Date.now()),
    _id: String(Date.now()),
    movieTitle,
    seats,
    totalPrice,
    user: user || 'Guest User',
    email: email || '',
    date: date || new Date().toLocaleDateString(),
    transactionId: transactionId || 'TXN_' + Math.random().toString(36).substring(2, 9).toUpperCase(),
    paymentMethod: paymentMethod || 'UPI',
    paymentStatus: 'COMPLETED'
  };

  bookings.push(newBooking);

  if (seatHoldMap[movieTitle]) {
    seats.forEach((seat) => delete seatHoldMap[movieTitle][seat]);
    io.emit('seat_holds_updated', getActiveSeatHolds());
  }

  if (email) {
    sendBookingEmail(newBooking);
  }

  res.status(201).json(newBooking);
});

app.delete('/api/bookings/:id', (req, res) => {
  const bookingId = req.params.id;
  const booking = bookings.find((b) => b.id === bookingId || b._id === bookingId);

  if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }

  const refundAmount = booking.totalPrice;
  const refundTxnId = 'REF_' + Math.random().toString(36).substring(2, 10).toUpperCase();

  bookings = bookings.filter((b) => b.id !== bookingId && b._id !== bookingId);

  res.status(200).json({
    message: 'Booking cancelled successfully',
    refundAmount,
    refundTransactionId: refundTxnId
  });
});

app.delete('/api/bookings/:bookingId/seats/:seatId', (req, res) => {
  const { bookingId, seatId } = req.params;
  const booking = bookings.find((b) => b.id === bookingId || b._id === bookingId);

  if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }

  const perSeatPrice = booking.seats.length > 0 ? booking.totalPrice / booking.seats.length : 0;
  booking.seats = booking.seats.filter((s) => s !== seatId);
  booking.totalPrice -= perSeatPrice;

  if (booking.seats.length === 0) {
    bookings = bookings.filter((b) => b.id !== bookingId && b._id !== bookingId);
  }

  const refundTxnId = 'REF_SEAT_' + Math.random().toString(36).substring(2, 8).toUpperCase();

  res.status(200).json({
    message: `Seat ${seatId} cancelled`,
    refundAmount: perSeatPrice,
    refundTransactionId: refundTxnId
  });
});

// ------------------------------------------------------------------
// Reviews & Ratings Routes
// ------------------------------------------------------------------
app.get('/api/reviews/:movieId', (req, res) => {
  const movieReviews = reviews.filter((r) => r.movieId === req.params.movieId);
  res.json(movieReviews);
});

app.post('/api/reviews', (req, res) => {
  const { movieId, user, rating, comment } = req.body;
  if (!movieId || !rating) {
    return res.status(400).json({ error: 'Movie ID and rating are required' });
  }

  const newReview = {
    id: String(Date.now()),
    movieId,
    user: user || 'Anonymous',
    rating: Number(rating),
    comment: comment || '',
    createdAt: new Date().toISOString().split('T')[0]
  };

  reviews.push(newReview);

  const movieRevs = reviews.filter((r) => r.movieId === movieId);
  const avgRating = (movieRevs.reduce((acc, curr) => acc + curr.rating, 0) / movieRevs.length).toFixed(1);

  const movie = movies.find((m) => m.id === movieId || m._id === movieId);
  if (movie) movie.rating = Number(avgRating);

  res.status(201).json(newReview);
});

// ------------------------------------------------------------------
// Admin Analytics Route
// ------------------------------------------------------------------
app.get('/api/admin/stats', (req, res) => {
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const totalTicketsSold = bookings.reduce((sum, b) => sum + (b.seats ? b.seats.length : 0), 0);

  res.json({
    totalRevenue,
    totalTicketsSold,
    totalMovies: movies.length,
    totalBookings: bookings.length
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 TicketHub Server running on http://localhost:${PORT}`);
});

// ------------------------------------------------------------------
// Exports for Supertest & Application Access
// ------------------------------------------------------------------
module.exports = { app, server };