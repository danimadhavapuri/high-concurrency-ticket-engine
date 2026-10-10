import { Router, Request, Response } from 'express';

const router = Router();

// High-Impact Blockbuster Movie Catalog - Exact User Allocation
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
    title: 'Perfect',
    genre: 'Romance',
    price: 220,
    rating: 4.9,
    poster: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800',
    trailerUrl: 'https://www.youtube.com/embed/2Vv-BfVoq4g'
  },
  {
    id: '3',
    _id: '3',
    title: 'Spider-Man: Brand New Day',
    genre: 'Action',
    price: 320,
    rating: 4.9,
    poster: 'https://upload.wikimedia.org/wikipedia/en/9/9a/Spider-Man_Brand_New_Day_poster.jpg',
    trailerUrl: 'https://www.youtube.com/embed/daXaTug8rL4'
  },
  {
    id: '4',
    _id: '4',
    title: 'Jurassic World',
    genre: 'Adventure',
    price: 280,
    rating: 4.8,
    poster: 'https://upload.wikimedia.org/wikipedia/en/6/6e/Jurassic_World_poster.jpg',
    trailerUrl: 'https://www.youtube.com/embed/RFinNxS5KN4'
  },
  {
    id: '5',
    _id: '5',
    title: 'Toy Story 4',
    genre: 'Animation',
    price: 240,
    rating: 4.8,
    poster: 'https://m.media-amazon.com/images/M/MV5BMTYzMDM4NzkxOV5BMl5BanBnXkFtZTgwNzM1Mzg2NzM@._V1_FMjpg_UX1000_.jpg',
    trailerUrl: 'https://www.youtube.com/embed/wmiIUN-7qhE'
  },
  {
    id: '6',
    _id: '6',
    title: 'Avengers: Endgame',
    genre: 'Action',
    price: 320,
    rating: 4.9,
    poster: 'https://image.tmdb.org/t/p/w780/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
    trailerUrl: 'https://www.youtube.com/embed/TcMBFSGVi1c'
  },
  {
    id: '7',
    _id: '7',
    title: 'Interstellar',
    genre: 'Sci-Fi',
    price: 280,
    rating: 4.9,
    poster: 'https://image.tmdb.org/t/p/w780/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    trailerUrl: 'https://www.youtube.com/embed/zSWdZVtXT7E'
  },
  {
    id: '8',
    _id: '8',
    title: 'Titanic',
    genre: 'Romance',
    price: 300,
    rating: 4.9,
    poster: 'https://upload.wikimedia.org/wikipedia/en/1/18/Titanic_%281997_film%29_poster.png',
    trailerUrl: 'https://www.youtube.com/embed/YDIgGdKRDqY'
  }
];

// GET /api/movies
router.get('/', (req: Request, res: Response) => {
  res.json(movies);
});

export default router;