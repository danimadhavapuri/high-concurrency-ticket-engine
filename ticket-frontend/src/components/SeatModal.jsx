import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function SeatModal({
  selectedMovie,
  occupiedSeats = [],
  selectedSeats = [],
  heldSeats = {}, // Format: { "A1": { userId: "123", expiresAt: 1726000000 } }
  seatsHeldByOthers = [],
  currentUserId = '',
  onSeatClick,
  onClose,
  onConfirm
}) {
  // Synchronized to 3 minutes (180 seconds) to match server seat lock limit
  const [timeLeft, setTimeLeft] = useState(180);

  useEffect(() => {
    if (!selectedMovie) return;

    // Reset timer to 180 seconds whenever a user picks seats or opens modal
    setTimeLeft(180);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.error('Seat reservation window expired! Please re-select seats.');
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedMovie]);

  if (!selectedMovie) return null;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const rows = ['A', 'B', 'C', 'D'];
  const cols = [1, 2, 3, 4, 5, 6];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg text-white shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold transition"
        >
          ✕
        </button>

        {/* Header Section */}
        <div className="flex justify-between items-center mb-4 pr-6">
          <div>
            <h3 className="text-xl font-bold">Select Seats for {selectedMovie.title}</h3>
            <p className="text-xs text-slate-400">Price: ₹{selectedMovie.price || 200} per seat</p>
          </div>
          
          {/* 3-Minute Seat Hold Countdown */}
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-full text-xs font-bold animate-pulse flex items-center gap-1.5">
            <span>⏱️ Hold:</span>
            <span className="font-mono">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Status Legend */}
        <div className="flex justify-around items-center bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 mb-6 text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-700"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-emerald-500 shadow-sm shadow-emerald-500/50"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-amber-500 shadow-sm shadow-amber-500/50"></div>
            <span>Held (Other User)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-rose-950/60 border border-rose-900/40"></div>
            <span>Booked</span>
          </div>
        </div>

        {/* Screen Visual */}
        <div className="w-full h-3 bg-blue-500/30 rounded-full mb-8 shadow-[0_0_15px_rgba(59,130,246,0.5)] text-center text-[10px] text-blue-300 font-semibold">
          SCREEN THIS WAY
        </div>

        {/* Seat Layout Grid */}
        <div className="grid gap-3 mb-6 justify-center">
          {rows.map((row) => (
            <div key={row} className="flex gap-2 items-center">
              <span className="w-4 text-xs font-bold text-slate-500">{row}</span>
              {cols.map((col) => {
                const seatId = `${row}${col}`;
                const isOccupied = occupiedSeats.includes(seatId);
                const isSelected = selectedSeats.includes(seatId);

                // Real-time lock check (Held by another active user)
                const holdInfo = heldSeats[seatId];
                const isHeldByOther =
                  seatsHeldByOthers.includes(seatId) ||
                  (holdInfo &&
                    holdInfo.userId !== currentUserId &&
                    holdInfo.expiresAt > Date.now());

                const isDisabled = isOccupied || isHeldByOther;

                return (
                  <button
                    key={seatId}
                    disabled={isDisabled}
                    onClick={() => onSeatClick(seatId)}
                    title={
                      isOccupied
                        ? 'Seat already booked'
                        : isHeldByOther
                        ? 'Seat currently being held by another user ⏳'
                        : `Seat ${seatId}`
                    }
                    className={`w-9 h-9 text-xs rounded-lg font-bold transition flex items-center justify-center ${
                      isOccupied
                        ? 'bg-rose-950/40 text-rose-800/60 cursor-not-allowed border border-rose-900/30'
                        : isHeldByOther
                        ? 'bg-amber-500 text-slate-950 border border-amber-400 font-extrabold shadow-md shadow-amber-500/30 cursor-not-allowed animate-pulse'
                        : isSelected
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 border border-emerald-400'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {seatId}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Selected Summary & Action Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-800">
          <div>
            <p className="text-xs text-slate-400">
              Seats: <span className="text-white font-bold">{selectedSeats.join(', ') || 'None'}</span>
            </p>
            <p className="text-sm font-extrabold text-emerald-400">
              Total: ₹{selectedSeats.length * (selectedMovie.price || 200)}
            </p>
          </div>

          <button
            onClick={onConfirm}
            disabled={selectedSeats.length === 0}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-lg ${
              selectedSeats.length === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
            }`}
          >
            Proceed to Payment 💳
          </button>
        </div>
      </div>
    </div>
  );
}