import express from 'express';
import {
    getAllGames,
    getGameById,
    getGameByRoomCode,
    createGame,
    updateGame,
    deleteGame,
    searchTMDB,
    getTMDBMovieDetails,
    getPlayerAnswers
} from '../controllers/gameController.js';
import { register, login, getMe, requestPasswordReset, resetPassword } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Auth routes
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', protect, getMe);
router.post('/auth/forgot-password', requestPasswordReset);
router.post('/auth/reset-password', resetPassword);

// Game routes
router.get('/games', protect, getAllGames);             // My Games (Protected)
router.get('/games/code/:roomCode', getGameByRoomCode); // Public for Players/Projector
router.get('/games/:id', protect, getGameById);         // Single Game (Protected, Owner only)
router.post('/games', protect, createGame);
router.put('/games/:id', protect, updateGame);
router.delete('/games/:id', protect, deleteGame);

// TMDB routes (Public for easier testing - can add protect later if needed)
router.get('/tmdb/search', searchTMDB);
router.get('/tmdb/movie/:id', getTMDBMovieDetails);

// Player routes (Public - players are not authenticated)
router.get('/players/:id/answers', getPlayerAnswers);

export default router;
