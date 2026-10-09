export default function MovieCard({ movie, onBookSeats }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:scale-[1.02] hover:border-slate-700 transition-all duration-300 flex flex-col">
      {/* Poster & Rating Badge */}
      <div className="relative h-64 overflow-hidden bg-slate-800">
        <img 
          src={movie.poster} 
          alt={movie.title} 
          className="w-full h-full object-cover" 
        />
        <span className="absolute top-3 right-3 bg-slate-900/90 text-amber-400 font-bold text-xs px-2.5 py-1 rounded-full border border-slate-700 flex items-center gap-1">
          ⭐ {movie.rating}
        </span>
      </div>

      {/* Movie Details */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {movie.genre}
            </span>
            <span className="text-green-400 font-bold">${movie.price}/seat</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{movie.title}</h3>
        </div>

        {/* Booking Trigger Button */}
        <button
          onClick={() => onBookSeats(movie)}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg transition-colors"
        >
          Book Seats 💺
        </button>
      </div>
    </div>
  );
}