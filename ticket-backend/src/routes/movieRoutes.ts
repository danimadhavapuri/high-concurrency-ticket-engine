import { Router, Request, Response } from 'express';

const router = Router();

// Our movie catalog data
const movies = [
  {
    id: '1',
    _id: '1',
    title: 'Epic',
    genre: 'Action',
    price: 250,
    rating: 4.8,
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: '2',
    _id: '2',
    title: 'Fidaa',
    genre: 'Romance',
    price: 200,
    rating: 4.5,
    poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: '3',
    _id: '3',
    title: 'Perfect',
    genre: 'Drama',
    price: 220,
    rating: 4.7,
    poster: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  }
];

// GET /api/movies
router.get('/', (req: Request, res: Response) => {
  res.json(movies);
});

export default router;