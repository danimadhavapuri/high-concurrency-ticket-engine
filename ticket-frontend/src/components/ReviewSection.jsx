import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function ReviewSection({ movieId, user }) {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReviews = () => {
    fetch(`http://localhost:3000/api/reviews/${movieId}`)
      .then((res) => res.json())
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Error fetching reviews:', err));
  };

  useEffect(() => {
    if (movieId) fetchReviews();
  }, [movieId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Please write a review comment');
      return;
    }

    setIsSubmitting(true);
    const userName = typeof user === 'object' ? user?.name : (user || 'Guest User');

    fetch('http://localhost:3000/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        movieId,
        user: userName,
        rating,
        comment
      })
    })
      .then((res) => res.json())
      .then(() => {
        toast.success('Review posted successfully! ⭐');
        setComment('');
        fetchReviews();
      })
      .catch(() => toast.error('Failed to post review'))
      .finally(() => setIsSubmitting(false));
  };

  return (
    <div className="mt-6 border-t border-slate-800 pt-6">
      <h4 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
        ⭐ Ratings & Reviews ({reviews.length})
      </h4>

      {/* Write Review Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-4 rounded-xl mb-6 space-y-3">
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400">Your Rating:</label>
          <div className="flex gap-1 text-amber-400 text-lg cursor-pointer">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={star <= rating ? 'opacity-100 scale-110 transition' : 'opacity-30'}
              >
                ★
              </button>
            ))}
          </div>
          <span className="text-xs font-bold text-amber-400">({rating}/5 Stars)</span>
        </div>

        <textarea
          rows="2"
          placeholder="Write your honest thoughts about the movie..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
        >
          {isSubmitting ? 'Posting...' : 'Submit Review'}
        </button>
      </form>

      {/* Review List */}
      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
        {reviews.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No reviews yet. Be the first to review!</p>
        ) : (
          reviews.map((rev) => (
            <div key={rev.id} className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-lg text-xs">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-200">{rev.user}</span>
                <span className="text-amber-400 font-semibold">{'★'.repeat(rev.rating)}</span>
              </div>
              <p className="text-slate-300">{rev.comment}</p>
              <span className="text-[10px] text-slate-500 mt-1 block">{rev.createdAt}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}