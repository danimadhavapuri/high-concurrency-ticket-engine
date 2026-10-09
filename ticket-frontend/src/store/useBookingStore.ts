import { create } from 'zustand';
import { Movie } from '../types';

export interface BookingState {
  activeTab: string;
  selectedMovie: Movie | null;
  selectedSeats: string[];
  lockedSeats: string[];
  isLocking: boolean;
  error: string | null;
  holdTimer: number | null; // Seat reservation hold duration in seconds
  setActiveTab: (tab: string) => void;
  setSelectedMovie: (movie: Movie | null) => void;
  setSelectedSeats: (seats: string[]) => void;
  toggleSeat: (seatId: string) => void;
  setHoldTimer: (seconds: number | null) => void;
  clearBooking: () => void;
  lockSelectedSeats: (showtimeId: string | number) => Promise<void>;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  activeTab: 'catalog',
  selectedMovie: null,
  selectedSeats: [],
  lockedSeats: [],
  isLocking: false,
  error: null,
  holdTimer: null,

  setActiveTab: (tab) => set({ activeTab: tab }),

  setSelectedMovie: (movie) => set({ selectedMovie: movie }),

  setSelectedSeats: (seats) => set({ selectedSeats: seats }),

  toggleSeat: (seatId) =>
    set((state) => {
      const exists = state.selectedSeats.includes(seatId);
      return {
        selectedSeats: exists
          ? state.selectedSeats.filter((s) => s !== seatId)
          : [...state.selectedSeats, seatId],
      };
    }),

  setHoldTimer: (seconds) => set({ holdTimer: seconds }),

  clearBooking: () =>
    set({
      selectedMovie: null,
      selectedSeats: [],
      lockedSeats: [],
      isLocking: false,
      error: null,
      holdTimer: null,
    }),

  lockSelectedSeats: async (showtimeId: string | number) => {
    const { selectedSeats, isLocking } = get();

    // Prevent duplicate lock requests if already locking or if no seats are selected
    if (isLocking || selectedSeats.length === 0) return;

    set({ isLocking: true, error: null });

    try {
      const response = await fetch('/api/seats/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showtimeId, seatIds: selectedSeats }),
      });

      const data = await response.json();

      if (response.ok) {
        set((state) => ({
          lockedSeats: [...state.lockedSeats, ...state.selectedSeats],
          selectedSeats: [],
          isLocking: false,
          error: null,
        }));
      } else {
        set({
          error: data.message || 'Failed to lock seats',
          isLocking: false,
        });
      }
    } catch (err: any) {
      set({
        error: err.message || 'Network error',
        isLocking: false,
      });
    }
  },
}));