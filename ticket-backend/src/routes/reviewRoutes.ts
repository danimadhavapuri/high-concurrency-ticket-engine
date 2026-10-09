import { Router, Request, Response } from 'express';

const router = Router();

export interface Review {
  id: string;
  movieId: string;
  user: string;
  rating: number;
  comment: string;
  createdAt: string;
}

// Global reviews storage
let reviews: Review[] = [
  { id: 'r1', movieId: '1', user: 'Dani', rating: 5, comment: 'Mind-blowing visuals and great sound design!', createdAt: '2026-09-15' },
  { id: 'r2', movieId: '1', user: 'Alex', rating: 4, comment: 'Really good storyline and acting.', createdAt: '2026-09-18' }
];

// GET /api/reviews/:movieId
router.get('/:movieId', (req: Request, res: Response) => {
  const movieReviews = reviews.filter((r) => String(r.movieId) === String(req.params.movieId));
  res.json(movieReviews);
});

// POST /api/reviews
router.post('/', (req: Request, res: Response) => {
  const { movieId, user, rating, comment } = req.body;
  if (!movieId || !rating) {
    return res.status(400).json({ error: 'Movie ID and rating are required' });
  }

  const newReview: Review = {
    id: String(Date.now()),
    movieId: String(movieId),
    user: user || 'Anonymous',
    rating: Number(rating),
    comment: comment || '',
    createdAt: new Date().toISOString().split('T')[0]
  };

  reviews.unshift(newReview);
  res.status(201).json(newReview);
});

export default router;
