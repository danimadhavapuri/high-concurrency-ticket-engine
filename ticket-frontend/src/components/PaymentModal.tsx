
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import CheckoutTimer from './CheckoutTimer';

export interface PaymentSuccessDetails {
  transactionId: string;
  method: string;
  paidAmount: number;
}

export interface PaymentModalProps {
  movieTitle: string;
  selectedSeats: string[];
  amount: number;
  onPaymentSuccess: (details: PaymentSuccessDetails) => void;
  onClose: () => void;
}

export default function PaymentModal({
  movieTitle,
  selectedSeats,
  amount,
  onPaymentSuccess,
  onClose,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card'>('upi');
  const [upiId, setUpiId] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Handle seat lock expiration during checkout
  const handleTimerExpire = () => {
    toast.error('Seat reservation expired! Please select your seats again.');
    onClose();
  };

  const [idempotencyKey] = useState<string>(
    () => 'IDEMP_' + Math.random().toString(36).substring(2, 10).toUpperCase() + '_' + Date.now()
  );

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === 'upi' && !upiId.trim()) {
      toast.error('Please enter your UPI ID');
      return;
    }

    if (paymentMethod === 'card' && cardNumber.length < 16) {
      toast.error('Please enter a valid 16-digit card number');
      return;
    }

    setIsProcessing(true);

    // Simulate Payment Gateway delay
    setTimeout(() => {
      setIsProcessing(false);
      const transactionId = 'TXN_' + Math.random().toString(36).substring(2, 10).toUpperCase();

      onPaymentSuccess({
        transactionId,
        method: paymentMethod.toUpperCase(),
        paidAmount: amount,
        idempotencyKey,
      });
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md text-white shadow-2xl relative">
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold"
        >
          ✕
        </button>

        <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
          Payment Method 💳
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Complete payment to confirm seats for <strong className="text-blue-400">{movieTitle}</strong>
        </p>

        {/* Live Seat Lock Countdown Timer */}
        <CheckoutTimer onExpire={handleTimerExpire} />

        {/* Order Summary */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 mb-5 flex justify-between items-center text-sm">
          <div>
            <p className="text-xs text-slate-400">Selected Seats ({selectedSeats.length}):</p>
            <p className="font-semibold text-slate-200">{selectedSeats.join(', ')}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Total Payable</p>
            <p className="text-lg font-extrabold text-emerald-400">₹{amount}</p>
          </div>
        </div>

        <form onSubmit={handlePay} className="space-y-4">
          {/* Options */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('upi')}
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                paymentMethod === 'upi'
                  ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              📱 UPI / GPay
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                paymentMethod === 'card'
                  ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              💳 Card
            </button>
          </div>

          {/* Dynamic Inputs */}
          {paymentMethod === 'upi' ? (
            <div>
              <label className="text-xs text-slate-400 block mb-1">Enter UPI ID</label>
              <input
                type="text"
                placeholder="example@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          ) : (
            <div>
              <label className="text-xs text-slate-400 block mb-1">Card Number</label>
              <input
                type="text"
                maxLength={16}
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold text-xs transition text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center justify-center cursor-pointer"
            >
              {isProcessing ? 'Processing... ⏳' : `Pay ₹${amount}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}