export default function TicketSummary({ ticket }) {
  return (
    <div className="max-w-md mx-auto my-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl">
      <div className="border-b border-slate-800 pb-4 mb-4 text-center">
        <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider">
          Booking Confirmed 🎉
        </span>
        <h2 className="text-2xl font-bold mt-1">{ticket.movieTitle}</h2>
      </div>

      <div className="space-y-3 text-sm text-slate-300 mb-6">
        <p>🎟️ <strong className="text-white">Seats:</strong> {ticket.seats.join(', ')}</p>
        <p>💳 <strong className="text-white">Transaction ID:</strong> {ticket.transactionId}</p>
        <p>💰 <strong className="text-white">Amount Paid:</strong> ₹{ticket.amount}</p>
      </div>

      <button
        onClick={() => window.print()}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold text-sm transition"
      >
        Print Ticket 🖨️
      </button>
    </div>
  );
}