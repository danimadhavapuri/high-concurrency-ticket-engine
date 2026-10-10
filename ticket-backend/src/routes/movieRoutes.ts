import { Router, Request, Response } from 'express';

const router = Router();

// High-Impact Blockbuster Movie Catalog
const movies = [
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

// GET /api/movies
router.get('/', (req: Request, res: Response) => {
  res.json(movies);
});

export default router;