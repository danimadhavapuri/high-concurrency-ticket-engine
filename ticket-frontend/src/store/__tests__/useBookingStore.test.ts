import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useBookingStore } from '../useBookingStore';

// Mock globalThis fetch for backend API calls
globalThis.fetch = vi.fn();

describe('useBookingStore - Client Concurrency & State Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset store state before every test
    act(() => {
      useBookingStore.setState({
        selectedSeats: [],
        lockedSeats: [],
        isLocking: false,
        error: null,
      });
    });
  });

  it('should cleanly handle rapid seat toggling without duplicates', () => {
    const seatId = '12';

    // Simulate rapid user clicking the same seat 3 times
    act(() => {
      useBookingStore.getState().toggleSeat(seatId);
      useBookingStore.getState().toggleSeat(seatId);
      useBookingStore.getState().toggleSeat(seatId);
    });

    const state = useBookingStore.getState();
    expect(state.selectedSeats).toEqual([seatId]);
  });

  it('should prevent simultaneous lock requests when locking is active', async () => {
    // 1. Mock a slow network response (100ms)
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                status: 200,
                json: async () => ({ status: 'success', message: 'Seats locked' }),
              }),
            100
          )
        )
    );

    act(() => {
      useBookingStore.setState({ selectedSeats: ['12', '13'] });
    });

    // 2. Trigger double-click lock attempts simultaneously
    const lockPromise1 = useBookingStore.getState().lockSelectedSeats('101');
    const lockPromise2 = useBookingStore.getState().lockSelectedSeats('101');

    await Promise.all([lockPromise1, lockPromise2]);

    // 3. Ensure API request was sent only ONCE due to lock guard
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('should transition selectedSeats upon successful 200 response', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: 'success', message: 'Seats locked for 5 minutes' }),
    });

    act(() => {
      useBookingStore.setState({ selectedSeats: ['12', '13'] });
    });

    await act(async () => {
      await useBookingStore.getState().lockSelectedSeats('101');
    });

    const state = useBookingStore.getState();
    expect(state.selectedSeats).toEqual([]);
    expect(state.lockedSeats).toEqual(['12', '13']);
    expect(state.isLocking).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should capture error message when backend returns 409 Conflict', async () => {
    // Mock 409 Conflict response from backend
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ message: 'Seat already locked by another user' }),
    });

    act(() => {
      useBookingStore.setState({ selectedSeats: ['12'] });
    });

    await act(async () => {
      await useBookingStore.getState().lockSelectedSeats('101');
    });

    const state = useBookingStore.getState();
    expect(state.isLocking).toBe(false);
    expect(state.error).toBe('Seat already locked by another user');
  });
});