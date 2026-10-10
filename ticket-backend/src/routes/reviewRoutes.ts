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
  { id: 'r1', movieId: '1', user: 'Dani', rating: 5, comment: 'Mind-blowing Pandora visuals and underwater 3D CGI! James Cameron did it again.', createdAt: '2026-09-15' },
  { id: 'r2', movieId: '1', user: 'Alex', rating: 5, comment: 'Epic cinematic scale. Worth watching on IMAX.', createdAt: '2026-09-18' },
  { id: 'r0', movieId: '2', user: 'Dani', rating: 5, comment: 'One of my all-time favorite songs! Pure romance and beautiful memories.', createdAt: '2026-10-09' },
  { id: 'r3', movieId: '3', user: 'Miles_M', rating: 5, comment: 'Incredible action, mature tone, and Tom Holland at his peak!', createdAt: '2026-10-03' },
  { id: 'r4', movieId: '4', user: 'Owen', rating: 5, comment: 'Thrilling dinosaur action and nostalgia. The Indominus Rex was terrifying!', createdAt: '2026-10-04' },
  { id: 'r5', movieId: '5', user: 'Sarah', rating: 5, comment: 'Emotional and funny! Woody and Forky are pure magic.', createdAt: '2026-09-20' },
  { id: 'r6', movieId: '6', user: 'Chris', rating: 5, comment: 'The ultimate superhero culmination! Portals scene gave me goosebumps.', createdAt: '2026-09-25' },
  { id: 'r7', movieId: '6', user: 'Dani', rating: 5, comment: 'Best Marvel movie of all time. I love you 3000.', createdAt: '2026-09-27' },
  { id: 'r8', movieId: '7', user: 'Cooper', rating: 5, comment: 'Hans Zimmer score + wormhole visuals make this timeless cinema.', createdAt: '2026-10-05' },
  { id: 'r9', movieId: '8', user: 'Rose', rating: 5, comment: 'Timeless masterpiece. Leonardo DiCaprio and Kate Winslet have unmatched chemistry.', createdAt: '2026-10-07' }
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
