export interface Seat {
  id: number;
  seat_no: string;
}

export interface Showtime {
  id: number;
  film_id: number;
  start_time: string;
}

export interface SeatUpdateEvent {
  event: 'SEAT_LOCKED' | 'SEAT_UNLOCKED' | 'SEAT_BOOKED';
  showtimeId: number;
  seatIds: number[];
  userId?: number;
  timestamp: string;
}