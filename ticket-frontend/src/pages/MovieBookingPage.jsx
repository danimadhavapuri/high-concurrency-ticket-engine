import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import SeatModal from '../components/SeatModal';
import { SOCKET_URL } from '../config/api';

const socket = io(SOCKET_URL);

export default function MovieBookingPage({ movie, user, onBack }) {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [allHolds, setAllHolds] = useState({});
  const [occupiedSeats, setOccupiedSeats] = useState([]);

  const movieKey = movie?.title?.toLowerCase();

  useEffect(() => {
    // 1. Listen for real-time hold updates 📢
    socket.on('seat_holds_updated', (holdsMap) => {
      setAllHolds(holdsMap);
    });

    return () => {
      socket.off('seat_holds_updated');
    };
  }, []);

  // Handle seat clicks and emit to socket server 📤
  const handleSeatClick = (seatId) => {
    // Toggle seat locally
    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((s) => s !== seatId) : [...prev, seatId]
    );

    // Emit event to server so other users see yellow 🟡
    socket.emit('toggle_seat_hold', {
      movieTitle: movie.title,
      seatId,
      userId: user?.id || user?.email
    });
  };

  const movieHolds = allHolds[movieKey] || {};

  return (
    <div className="p-6">
      <button onClick={onBack} className="mb-4 text-sm text-slate-400 hover:text-white">← Back</button>
      
      <SeatModal
        selectedMovie={movie}
        occupiedSeats={occupiedSeats}
        selectedSeats={selectedSeats}
        heldSeats={movieHolds}
        currentUserId={user?.id || user?.email}
        onSeatClick={handleSeatClick}
        onClose={onBack}
        onConfirm={() => alert('Booking Confirmed!')}
      />
    </div>
  );
}