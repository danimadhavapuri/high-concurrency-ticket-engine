import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import io from 'socket.io-client';
import { API_BASE_URL, SOCKET_URL } from '../config/api';

// Core components
import MovieCard from './MovieCard';
import SeatModal from './SeatModal';
import PaymentModal from './PaymentModal';
import TrailerModal from './TrailerModal';
import TicketPassModal from './TicketPassModal';
import ReviewSection from './ReviewSection';
import AdminDashboard from './AdminDashboard';

// Newly added real-time locking & store modules
import { SeatGrid } from './SeatGrid';
import { CheckoutTimer } from './CheckoutTimer';
import { useBookingStore } from '../store/useBookingStore';

import epicImg from '../assets/Epic.avif';
import fidaaImg from '../assets/Fidaa.jpg';
import perfectImg from '../assets/Perfect.jpg';

const imageMap = {
  "Epic": epicImg,
  "Fidaa": fidaaImg,
  "Perfect": perfectImg
};

const DEFAULT_MOVIES = [
  {
    id: '1',
    _id: '1',
    title: 'Avatar: The Way of Water',
    genre: 'Sci-Fi',
    price: 350,
    rating: 4.9,
    poster: 'https://image.tmdb.org/t/p/w780/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
    trailerUrl: 'https://www.youtube.com/embed/d9MyW72ELq0'
  },
  {
    id: '2',
    _id: '2',
    title: 'Toy Story 4',
    genre: 'Animation',
    price: 240,
    rating: 4.8,
    poster: 'https://image.tmdb.org/t/p/w780/w9kR8qbmQ01HwnvK4alvnQ2v0Zw.jpg',
    trailerUrl: 'https://www.youtube.com/embed/wmiIUN-7qhE'
  },
  {
    id: '3',
    _id: '3',
    title: 'Avengers: Endgame',
    genre: 'Action',
    price: 320,
    rating: 4.9,
    poster: 'https://image.tmdb.org/t/p/w780/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
    trailerUrl: 'https://www.youtube.com/embed/TcMBFSGVi1c'
  },
  {
    id: '4',
    _id: '4',
    title: 'Oppenheimer',
    genre: 'Drama',
    price: 300,
    rating: 4.9,
    poster: 'https://image.tmdb.org/t/p/w780/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    trailerUrl: 'https://www.youtube.com/embed/uYPbbksJxIg'
  },
  {
    id: '5',
    _id: '5',
    title: 'Spider-Man: Across the Spider-Verse',
    genre: 'Animation',
    price: 260,
    rating: 4.9,
    poster: 'https://image.tmdb.org/t/p/w780/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
    trailerUrl: 'https://www.youtube.com/embed/cqGjhVJWtEg'
  },
  {
    id: '6',
    _id: '6',
    title: 'Interstellar',
    genre: 'Sci-Fi',
    price: 280,
    rating: 4.9,
    poster: 'https://image.tmdb.org/t/p/w780/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    trailerUrl: 'https://www.youtube.com/embed/zSWdZVtXT7E'
  }
];

const socket = io(SOCKET_URL, { autoConnect: true });

export default function MovieCatalog({ user, activeTab }) {
  const [movies, setMovies] = useState(DEFAULT_MOVIES);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [heldSeatsMap, setHeldSeatsMap] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [myBookings, setMyBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [trailerMovie, setTrailerMovie] = useState(null);
  const [viewPassTicket, setViewPassTicket] = useState(null);
  const [reviewMovieId, setReviewMovieId] = useState(null);

  const currentUserId = typeof user === 'object' ? user?.id || user?.name : (user || 'guest_session');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  const fetchBookings = () => {
    fetch(`${API_BASE_URL}/api/bookings`, { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => setMyBookings(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Error fetching bookings:', err));
  };

  const fetchHeldSeats = () => {
    fetch(`${API_BASE_URL}/api/seats/holds`)
      .then((res) => res.json())
      .then((data) => setHeldSeatsMap(data || {}))
      .catch((err) => console.error('Error fetching seat holds:', err));
  };

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetch(`${API_BASE_URL}/api/movies`).then((res) => res.json()).catch(() => []),
      fetch(`${API_BASE_URL}/api/bookings`, { headers: getAuthHeaders() }).then((res) => res.json()).catch(() => []),
      fetch(`${API_BASE_URL}/api/seats/holds`).then((res) => res.json()).catch(() => ({}))
    ])
      .then(([moviesData, bookingsData, holdsData]) => {
        const listToUse = Array.isArray(moviesData) && moviesData.length > 0 ? moviesData : DEFAULT_MOVIES;
        const updatedMovies = listToUse.map((movie) => ({
          ...movie,
          poster: imageMap[movie.title] || movie.poster || epicImg
        }));
        setMovies(updatedMovies);
        setMyBookings(Array.isArray(bookingsData) ? bookingsData : []);
        setHeldSeatsMap(holdsData || {});
      })
      .catch(() => toast.error('Failed to load server data'))
      .finally(() => setIsLoading(false));

    // Real-time seat hold sync across User A & User B (Turns seats YELLOW)
    socket.on('seat_holds_updated', (updatedHolds) => {
      setHeldSeatsMap(updatedHolds || {});
    });

    // ⚡ Real-time booking sync across all users (Turns seats RED instantly without refresh!)
    socket.on('booking_confirmed', (newBooking) => {
      setMyBookings((prev) => {
        const exists = prev.some((b) => (b.id || b._id) === (newBooking.id || newBooking._id));
        return exists ? prev : [...prev, newBooking];
      });
    });

    // ⚡ Real-time cancellation sync (Reverts seats back to gray)
    socket.on('booking_cancelled', ({ bookingId }) => {
      setMyBookings((prev) => prev.filter((b) => (b.id || b._id) !== bookingId));
    });

    socket.on('seat_cancelled', ({ bookingId, seatId }) => {
      setMyBookings((prev) =>
        prev.map((b) => {
          if ((b.id || b._id) === bookingId) {
            return {
              ...b,
              seats: (b.seats || []).filter((s) => s !== seatId),
            };
          }
          return b;
        })
      );
    });

    // Fallback sync polling every 3 seconds
    const interval = setInterval(fetchHeldSeats, 3000);

    return () => {
      socket.off('seat_holds_updated');
      socket.off('booking_confirmed');
      socket.off('booking_cancelled');
      socket.off('seat_cancelled');
      clearInterval(interval);
    };
  }, []);

  const handleOpenModal = (movie) => {
    setSelectedMovie(movie);
    setSelectedSeats([]);
  };

  const handleCloseModal = () => {
    // Release active selected seats hold on modal close
    if (selectedMovie && selectedSeats.length > 0) {
      selectedSeats.forEach((seatId) => {
        socket.emit('toggle_seat_hold', {
          movieTitle: selectedMovie.title,
          seatId,
          userId: currentUserId
        });
      });
    }
    setSelectedMovie(null);
    setSelectedSeats([]);
    setShowPaymentModal(false);
  };

  const occupiedSeats = myBookings
    .filter((booking) => booking.movieTitle === selectedMovie?.title)
    .flatMap((booking) => booking.seats || []);

  // Filter seats currently held by OTHER users
  const currentMovieHolds = (selectedMovie && heldSeatsMap[selectedMovie.title]) || {};
  const seatsHeldByOthers = Object.entries(currentMovieHolds)
    .filter(([_, holdInfo]) => holdInfo.userId !== currentUserId && holdInfo.expiresAt > Date.now())
    .map(([seatId]) => seatId);

  const handleSeatClick = (seatId) => {
    if (occupiedSeats.includes(seatId) || seatsHeldByOthers.includes(seatId)) {
      toast.error('This seat is currently held or booked by another user ⏳');
      return;
    }

    // Real-time broadcast lock/unlock event for 3-minute hold
    socket.emit('toggle_seat_hold', {
      movieTitle: selectedMovie.title,
      seatId,
      userId: currentUserId
    });

    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatId));
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const handleProceedToPayment = () => {
    if (!selectedMovie || selectedSeats.length === 0) {
      toast.error('Please select at least one seat! 💺');
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (paymentDetails) => {
    const totalPrice = (selectedMovie.price || 200) * selectedSeats.length;
    const currentUserName = typeof user === 'object' ? user?.name : (user || 'Guest User');

    fetch(`${API_BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        ...(paymentDetails.idempotencyKey ? { 'Idempotency-Key': paymentDetails.idempotencyKey } : {})
      },
      body: JSON.stringify({
        movieTitle: selectedMovie.title,
        seats: selectedSeats,
        totalPrice: totalPrice,
        user: currentUserName,
        email: paymentDetails.email || '',
        date: new Date().toLocaleDateString(),
        transactionId: paymentDetails.transactionId,
        paymentMethod: paymentDetails.method,
        idempotencyKey: paymentDetails.idempotencyKey
      }),
    })
      .then((res) => res.json())
      .then(() => {
        socket.emit('clear_holds', { movieTitle: selectedMovie.title, seats: selectedSeats });
        toast.success(`🎉 Booking Confirmed! Confirmation email sent.`, { duration: 4000 });
        handleCloseModal();
        fetchBookings();
      })
      .catch(() => toast.error('Booking failed. Please try again.'));
  };

  const handleCancelBooking = (ticketId) => {
    fetch(`${API_BASE_URL}/api/bookings/${ticketId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
      .then((res) => res.json())
      .then((data) => {
        const refundMsg = data.refundAmount 
          ? `Refund of ₹${data.refundAmount} initiated! (Ref: ${data.refundTransactionId || 'REF123'}) 💸`
          : 'Ticket canceled successfully 🗑️';

        toast.success(refundMsg, { duration: 5000 });
        fetchBookings();
      })
      .catch(() => toast.error('Failed to cancel ticket'));
  };

  const handleCancelSeat = (bookingId, seatId) => {
    if (!bookingId) return;

    fetch(`${API_BASE_URL}/api/bookings/${bookingId}/seats/${seatId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
      .then((res) => res.json())
      .then((data) => {
        const refundMsg = data.refundAmount
          ? `Seat ${seatId} canceled. Refund of ₹${data.refundAmount} processed! 💸`
          : `Seat ${seatId} canceled ✕`;

        toast.success(refundMsg, { duration: 4000 });
        fetchBookings();
      })
      .catch(() => toast.error('Failed to cancel seat'));
  };

  const genres = ['All', ...new Set(movies.map((m) => m.genre).filter(Boolean))];

  const filteredMovies = movies.filter((movie) => {
    const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === 'All' || movie.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  const userName = typeof user === 'object' ? user?.name : user;
  const displayedBookings = myBookings.filter((b) => {
    if (!userName) return true;
    const bookingUser = typeof b.user === 'object' ? b.user?.name : b.user;
    return !bookingUser || bookingUser.toLowerCase() === userName.toLowerCase();
  });

  const isTicketsTab = activeTab === 'mytickets' || activeTab === 'my-tickets';
  const isAdminTab = activeTab === 'admin';

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      <main className="p-6 max-w-6xl mx-auto">
        {isAdminTab ? (
          <AdminDashboard />
        ) : !isTicketsTab ? (
          <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
                <input
                  type="text"
                  placeholder="Search movies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Genre:</span>
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-sm text-white rounded-lg px-3 py-2"
                >
                  {genres.map((g) => (<option key={g} value={g}>{g}</option>))}
                </select>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-6 text-slate-100">Now Showing 🍿</h2>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-slate-900 border border-slate-800 rounded-xl h-80 animate-pulse p-4"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {filteredMovies.map((movie) => (
                  <div key={movie._id || movie.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between">
                    <div className="relative">
                      <img src={movie.poster} alt={movie.title} className="w-full h-64 object-cover" />
                      <button
                        onClick={() => setTrailerMovie(movie)}
                        className="absolute bottom-3 right-3 bg-black/70 hover:bg-black text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-md transition flex items-center gap-1.5 border border-white/20"
                      >
                        ▶ Trailer
                      </button>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-bold text-white">{movie.title}</h3>
                          <span className="text-amber-400 font-bold text-xs">★ {movie.rating || 4.8}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{movie.genre} • ₹{movie.price || 200}</p>
                      </div>

                      <div className="mt-4 space-y-2">
                        <button
                          onClick={() => handleOpenModal(movie)}
                          className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded-xl text-xs font-bold transition"
                        >
                          Book Seats 💺
                        </button>
                        
                        <button
                          onClick={() => setReviewMovieId(reviewMovieId === movie.id ? null : movie.id)}
                          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-xl text-xs font-semibold transition"
                        >
                          {reviewMovieId === movie.id ? 'Hide Reviews' : 'View / Leave Reviews ⭐'}
                        </button>
                      </div>

                      {reviewMovieId === movie.id && (
                        <ReviewSection movieId={movie.id || movie._id} user={user} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-slate-100 mb-6">My Booked Tickets 🎟</h2>
            
            {displayedBookings.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
                No tickets booked yet.
              </div>
            ) : (
              <div className="space-y-4">
                {displayedBookings.map((ticket, index) => {
                  const bookingId = ticket._id || ticket.id || index;
                  return (
                    <div key={bookingId} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">🎬 {ticket.movieTitle}</h3>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm text-slate-400">Seats:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {ticket.seats?.map((seat) => (
                              <span 
                                key={seat} 
                                className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs px-2.5 py-1 rounded-md font-semibold flex items-center gap-1.5"
                              >
                                {seat}
                                <button
                                  onClick={() => handleCancelSeat(bookingId, seat)}
                                  className="hover:text-red-400 text-slate-400 text-xs font-bold transition ml-0.5"
                                  title={`Cancel seat ${seat}`}
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 mt-2">
                          Booked by: {typeof ticket.user === 'object' ? ticket.user?.name : (ticket.user || 'Guest')} | Total: ₹{ticket.totalPrice || '0'} | Date: {ticket.date || 'Today'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewPassTicket(ticket)}
                          className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 text-xs px-3 py-2 rounded-lg font-bold transition"
                        >
                          QR Ticket Pass 🎟️
                        </button>
                        <button
                          onClick={() => handleCancelBooking(bookingId)}
                          className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 text-xs px-3 py-2 rounded-lg font-semibold transition"
                        >
                          Cancel All 🗑
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {selectedMovie && (
        <SeatModal
          selectedMovie={selectedMovie}
          occupiedSeats={occupiedSeats}
          seatsHeldByOthers={seatsHeldByOthers}
          heldSeats={currentMovieHolds}
          currentUserId={currentUserId}
          selectedSeats={selectedSeats}
          onSeatClick={handleSeatClick}
          onClose={handleCloseModal}
          onConfirm={handleProceedToPayment}
        />
      )}

      {showPaymentModal && selectedMovie && (
        <PaymentModal
          movieTitle={selectedMovie.title}
          selectedSeats={selectedSeats}
          amount={(selectedMovie.price || 200) * selectedSeats.length}
          onPaymentSuccess={handlePaymentSuccess}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {trailerMovie && (
        <TrailerModal movie={trailerMovie} onClose={() => setTrailerMovie(null)} />
      )}

      {viewPassTicket && (
        <TicketPassModal ticket={viewPassTicket} onClose={() => setViewPassTicket(null)} />
      )}
    </div>
  );
}