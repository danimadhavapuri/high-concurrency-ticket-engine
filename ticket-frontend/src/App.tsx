import React from 'react';
import Navbar from './components/Navbar';
import MovieCatalog from './components/MovieCatalog';
import Login from './components/Login';
import Signup from './components/Signup';
import SparkBackground from './components/SparkBackground';
import MovieBookingPage from './pages/MovieBookingPage';
import { Toaster } from 'react-hot-toast';
import { Movie } from './types';
import { useAuthStore } from './store/useAuthStore';
import { useBookingStore } from './store/useBookingStore';

export default function App() {
  // Global Auth State from Zustand
  const { user, isLoginView, setUser, setIsLoginView } = useAuthStore();

  // Global Booking State from Zustand
  const { activeTab, setActiveTab, selectedMovie, setSelectedMovie } = useBookingStore();

  // Sync dispatcher wrapper to support functional user updates from legacy props
  const handleSetUser = (userData: any): void => {
    if (typeof userData === 'function') {
      const updated = userData(user);
      setUser(updated);
    } else {
      setUser(userData);
    }
  };

  // 🔒 Auth Gate
  if (!user) {
    return (
      <div className="relative min-h-screen bg-[#060913] flex items-center justify-center p-4 overflow-hidden">
        <SparkBackground />
        <Toaster position="top-right" />
        
        <div className="relative z-10 w-full flex justify-center">
          {isLoginView ? (
            <Login 
              setUser={handleSetUser} 
              onSwitchToSignup={() => setIsLoginView(false)} 
            />
          ) : (
            <Signup 
              setUser={handleSetUser}
              onSwitchToLogin={() => setIsLoginView(true)} 
            />
          )}
        </div>
      </div>
    );
  }

  // 🎬 Main View
  return (
    <div className="relative min-h-screen bg-[#060913] text-white overflow-x-hidden">
      <SparkBackground />
      <Toaster position="top-right" />

      <div className="relative z-10">
        <Navbar 
          user={user} 
          setUser={handleSetUser} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onOpenLogin={() => setIsLoginView(true)}
        />

        {selectedMovie ? (
          <MovieBookingPage 
            movie={selectedMovie} 
            user={user}
            onBack={() => setSelectedMovie(null)} 
          />
        ) : (
          <MovieCatalog 
            user={user} 
            activeTab={activeTab} 
            {...({ onBookMovie: (movieData: Movie) => setSelectedMovie(movieData) } as any)}
          />
        )}
      </div>
    </div>
  );
}