import { QRCodeSVG } from 'qrcode.react';

export default function TicketPassModal({ ticket, onClose }) {
  if (!ticket) return null;

  const qrPayload = JSON.stringify({
    ticketId: ticket._id || ticket.id,
    movie: ticket.movieTitle,
    seats: ticket.seats,
    user: ticket.user,
    txn: ticket.transactionId
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md text-white shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold"
        >
          ✕
        </button>

        <div className="text-center mb-4">
          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs px-3 py-1 rounded-full font-semibold">
            Official Ticket Pass 🎟️
          </span>
          <h3 className="text-2xl font-black mt-2 text-white">{ticket.movieTitle}</h3>
          <p className="text-xs text-slate-400">Scan at entrance gate</p>
        </div>

        {/* Ticket Body Card */}
        <div id="ticket-pass-content" className="bg-gradient-to-b from-slate-800 to-slate-850 border border-slate-700/80 rounded-2xl p-5 shadow-inner">
          <div className="flex justify-center my-3 bg-white p-4 rounded-xl w-fit mx-auto shadow-md">
            <QRCodeSVG value={qrPayload} size={150} level="H" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs border-t border-dashed border-slate-700 pt-4 mt-2">
            <div>
              <p className="text-slate-400">Passenger / User</p>
              <p className="font-bold text-slate-200">{typeof ticket.user === 'object' ? ticket.user?.name : ticket.user}</p>
            </div>
            <div>
              <p className="text-slate-400">Seats</p>
              <p className="font-bold text-emerald-400">{ticket.seats?.join(', ')}</p>
            </div>
            <div>
              <p className="text-slate-400">Date</p>
              <p className="font-semibold text-slate-300">{ticket.date || 'Today'}</p>
            </div>
            <div>
              <p className="text-slate-400">Total Price</p>
              <p className="font-bold text-blue-400">₹{ticket.totalPrice}</p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-700/60 text-[10px] text-slate-400 text-center font-mono">
            TXN ID: {ticket.transactionId || 'TXN_987654'}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={handlePrint}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2"
          >
            🖨️ Print / Download Ticket
          </button>
        </div>
      </div>
    </div>
  );
}