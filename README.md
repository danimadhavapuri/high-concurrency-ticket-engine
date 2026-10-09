# 🎬 High-Concurrency Movie Ticket Reservation Engine

A production-grade, distributed movie ticket booking system built with **React, TypeScript, Node.js, Redis, PostgreSQL, and Socket.io**. 

Designed to prevent race conditions and double-booking under high concurrent traffic through **in-memory distributed locking (Redis)**, **atomic database transactions (PostgreSQL + Prisma)**, and **real-time WebSocket broadcasting**.

---

## ⚡ Key Engineering Highlights

- 🔒 **Distributed Concurrency Control:** Implemented temporary 3-minute seat reservation locks using Redis with automatic TTL expiration.
- 🛡️ **Zero Double-Booking Guarantee:** Enforced database-level composite unique constraints (`@@unique([showtime_id, seat_id])`) wrapped in PostgreSQL `$transaction` rollbacks.
- ⚡ **Real-Time Seat Synchronization:** Full-duplex WebSockets (Socket.io) broadcast live seat state updates (Selected / Held / Booked) across concurrent user sessions without polling.
- 🔑 **Secure Authentication:** Stateless JWT authentication with salted Bcrypt password hashing and Zod schema validation.
- 🧪 **Automated Concurrency Test Suite:** Vitest integration tests simulating 10 simultaneous race-condition requests to verify that exactly 1 acquires the lock.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Zustand, Socket.io-client
- **Backend:** Node.js, Express, TypeScript, Zod, Bcrypt, JWT
- **Data & Caching:** PostgreSQL, Prisma ORM, Redis (ioredis)
- **Testing:** Vitest, Supertest, ioredis-mock

---

## 🧪 Concurrency Test Proof

To run the automated race condition test suite:

\`\`\`bash
cd ticket-backend
npm test
\`\`\`

---

## 🚀 Getting Started

### 1. Start Backend:
\`\`\`bash
cd ticket-backend
npm install
npm run dev
\`\`\`

### 2. Start Frontend:
\`\`\`bash
cd ticket-frontend
npm install
npm run dev
\`\`\`
