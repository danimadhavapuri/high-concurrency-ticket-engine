import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalRevenue: 0, totalTicketsSold: 0, totalMovies: 0, totalBookings: 0 });
  const [movies, setMovies] = useState([]);
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Action');
  const [price, setPrice] = useState(200);
  const [poster, setPoster] = useState('');
  const [trailerUrl, setTrailerUrl] = useState('');

  const fetchStats = () => {
    fetch(`${API_BASE_URL}/api/admin/stats`)
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error('Error stats:', err));
  };

  const fetchMovies = () => {
    fetch(`${API_BASE_URL}/api/movies`)
      .then((res) => res.json())
      .then((data) => setMovies(data))
      .catch((err) => console.error('Error movies:', err));
  };

  useEffect(() => {
    fetchStats();
    fetchMovies();
  }, []);

  const handleAddMovie = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Movie title is required');
      return;
    }

    fetch(`${API_BASE_URL}/api/movies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, genre, price, poster, trailerUrl })
    })
      .then((res) => res.json())
      .then(() => {
        toast.success('New Movie Added Successfully! 🎬');
        setTitle('');
        setPoster('');
        setTrailerUrl('');
        fetchMovies();
        fetchStats();
      })
      .catch(() => toast.error('Failed to add movie'));
  };

  const handleDeleteMovie = (id) => {
    fetch(`${API_BASE_URL}/api/movies/${id}`, { method: 'DELETE' })
      .then(() => {
        toast.success('Movie deleted 🗑️');
        fetchMovies();
        fetchStats();
      })
      .catch(() => toast.error('Failed to delete movie'));
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
        ⚙️ Admin Control Panel
      </h2>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400">Total Revenue</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">₹{stats.totalRevenue}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400">Tickets Sold</p>
          <p className="text-2xl font-black text-blue-400 mt-1">{stats.totalTicketsSold}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400">Active Movies</p>
          <p className="text-2xl font-black text-purple-400 mt-1">{stats.totalMovies}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400">Total Bookings</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{stats.totalBookings}</p>
        </div>
      </div>

      {/* Add Movie Form */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h3 className="text-lg font-bold text-white mb-4">➕ Add New Movie to Catalog</h3>
        <form onSubmit={handleAddMovie} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Movie Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Genre (e.g. Action, Sci-Fi)"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
          <input
            type="number"
            placeholder="Price per Ticket (₹)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Poster Image URL"
            value={poster}
            onChange={(e) => setPoster(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="YouTube Embed Trailer URL (e.g. https://www.youtube.com/embed/...)"
            value={trailerUrl}
            onChange={(e) => setTrailerUrl(e.target.value)}
            className="md:col-span-2 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />

          <button
            type="submit"
            className="md:col-span-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition"
          >
            Add Movie Now 🍿
          </button>
        </form>
      </div>

      {/* Manage Movies Table */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h3 className="text-lg font-bold text-white mb-4">📜 Manage Existing Catalog</h3>
        <div className="space-y-3">
          {movies.map((m) => (
            <div key={m.id || m._id} className="bg-slate-800/80 p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold text-white text-sm">{m.title}</p>
                <p className="text-xs text-slate-400">{m.genre} • ₹{m.price}</p>
              </div>
              <button
                onClick={() => handleDeleteMovie(m.id || m._id)}
                className="bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1 rounded-lg text-xs font-semibold transition"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}