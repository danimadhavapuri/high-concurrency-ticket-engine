import React, { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useBookingStore } from '../store/useBookingStore';
import { Seat, SeatUpdateEvent } from '../types/booking';

interface SeatGridProps {
  showtimeId: number;
  seats: Seat[];
  backendUrl?: string;
}

export const SeatGrid: React.FC<SeatGridProps> = ({
  showtimeId,
  seats,
  backendUrl = 'http://localhost:5000',
}) => {
  const {
    selectedSeatIds,
    lockedSeatIds,
    bookedSeatIds,
    toggleSeatSelection,
    applySocketSeatUpdate,
  } = useBookingStore();

  useEffect(() => {
    const socket: Socket = io(backendUrl);

    // Join showtime room
    socket.emit('join_showtime', showtimeId);

    // Listen for live broadcasts
    socket.on('seat_update', (data: SeatUpdateEvent) => {
      if (data.showtimeId === showtimeId) {
        applySocketSeatUpdate(data.event, data.seatIds);
      }
    });

    return () => {
      socket.emit('leave_showtime', showtimeId);
      socket.disconnect();
    };
  }, [showtimeId, backendUrl, applySocketSeatUpdate]);

  const getSeatStatus = (seatId: number) => {
    if (bookedSeatIds.includes(seatId)) return 'BOOKED';
    if (lockedSeatIds.includes(seatId)) return 'LOCKED';
    if (selectedSeatIds.includes(seatId)) return 'SELECTED';
    return 'AVAILABLE';
  };

  return (
    <div className="grid grid-cols-8 gap-2 p-4 bg-gray-900 rounded-xl">
      {seats.map((seat) => {
        const status = getSeatStatus(seat.id);
        let bgClass = 'bg-gray-700 text-white hover:bg-gray-600 cursor-pointer';

        if (status === 'BOOKED') bgClass = 'bg-red-600 text-gray-300 cursor-not-allowed opacity-50';
        if (status === 'LOCKED') bgClass = 'bg-amber-500 text-black cursor-not-allowed opacity-75';
        if (status === 'SELECTED') bgClass = 'bg-emerald-500 text-white font-bold ring-2 ring-emerald-300';

        return (
          <button
            key={seat.id}
            disabled={status === 'BOOKED' || status === 'LOCKED'}
            onClick={() => toggleSeatSelection(seat.id)}
            className={`h-10 w-full rounded font-medium text-xs transition-colors flex items-center justify-center ${bgClass}`}
          >
            {seat.seat_no}
          </button>
        );
      })}
    </div>
  );
};