import React, { useState, FormEvent, ChangeEvent } from 'react';
import { API_BASE_URL } from '../config/api';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface SignupProps {
  setUser?: (user: User | null) => void;
  onSwitchToLogin: () => void;
  onClose?: () => void;
}

interface SignupFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface AuthResponse {
  token?: string;
  user?: User;
  error?: string;
  message?: string;
}

export default function Signup({ setUser, onSwitchToLogin, onClose }: SignupProps) {
  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data: AuthResponse = await response.json();

      if (response.ok) {
        setSuccess('Account created successfully! 🎉 Redirecting...');
        
        if (data.token && data.user && setUser) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          setUser(data.user);
        } else {
          setTimeout(() => {
            if (onSwitchToLogin) onSwitchToLogin();
          }, 1500);
        }
      } else {
        setError(data.error || data.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('Cannot connect to server. If Render backend is waking up, please wait 30 seconds and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getInputStyle = (value: string): string => `
    w-full bg-slate-800/80 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 
    transition-all duration-300 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40
    ${value 
      ? 'border border-emerald-500/70 shadow-[0_0_12px_rgba(16,185,129,0.2)] bg-slate-800/90' 
      : 'border border-slate-700/80 focus:border-blue-500'
    }
  `;

  return (
    <div className="min-h-screen w-full bg-[#060913] relative overflow-hidden flex items-center justify-center p-4 md:p-8">
      {/* Ambient Background Spotlights */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-blue-600/20 rounded-full blur-[130px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/3 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[130px] pointer-events-none" />

      {/* Main Split-Screen Card */}
      <div className="relative z-10 w-full max-w-4xl bg-slate-900/80 border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-2xl flex flex-col md:flex-row min-h-[520px]">
        {/* Left Side: Cinema Banner */}
        <div 
          className="relative hidden md:flex md:w-1/2 bg-cover bg-center p-8 flex-col justify-between overflow-hidden"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1000&auto=format&fit=crop')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#060913] via-[#060913]/60 to-transparent"></div>
          
          <div className="relative z-10 flex items-center gap-2">
            <span className="text-2xl">🎬</span>
            <span className="text-xl font-bold tracking-wide text-white">TicketHub</span>
          </div>

          <div className="relative z-10 space-y-2 mb-4">
            <h3 className="text-2xl font-extrabold text-white leading-tight">
              Join the Ultimate Cinema Experience 🍿
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Create an account to unlock instant ticket reservations, real-time seat holding, and exclusive show updates.
            </p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-center">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Create Account 📝
            </h2>
            <p className="text-xs text-slate-400 mt-1">Sign up to get started with TicketHub</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/40 text-red-400 text-xs p-3 rounded-xl mb-3 text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/40 text-green-400 text-xs p-3 rounded-xl mb-3 text-center">
              {success}
            </div>
          )}

          <form onSubmit={handleSignup} className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className={getInputStyle(formData.name)}
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Email</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={getInputStyle(formData.email)}
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Phone Number</label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className={getInputStyle(formData.phone)}
                placeholder="+91 00000 00000"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Password</label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className={getInputStyle(formData.password)}
                placeholder="Enter password (min. 6 chars)"
              />
            </div>

            <div className="flex gap-3 mt-2">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl font-semibold text-sm transition"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-blue-600/30 transition transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  'Sign Up'
                )}
              </button>
            </div>

            <div className="mt-3 text-center text-xs text-slate-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-blue-400 hover:text-blue-300 hover:underline font-semibold transition"
              >
                Log In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}