export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface Movie {
  id: string;
  _id?: string;
  title: string;
  genre: string;
  price: number;
  rating: number;
  poster: string;
  trailerUrl: string;
}

export interface Booking {
  id: string;
  _id?: string;
  movieTitle: string;
  seats: string[];
  totalPrice: number;
  user: string;
  email: string;
  date: string;
  transactionId: string;
  paymentMethod: string;
  paymentStatus: 'COMPLETED' | 'CANCELLED' | 'PENDING';
}

export interface SeatHold {
  userId: string;
  expiresAt: number;
}

export type SeatHoldMap = Record<string, Record<string, SeatHold>>;

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
  error?: string;
}

export interface LoginProps {
  setUser: (user: User | null) => void;
  onSwitchToSignup: () => void;
  onClose?: () => void;
}

export interface SignupProps {
  setUser: (user: User | null) => void;
  onSwitchToLogin: () => void;
  onClose?: () => void;
}