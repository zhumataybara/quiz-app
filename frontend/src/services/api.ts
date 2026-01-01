import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
    baseURL: API_BASE_URL
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Auth API
export const authAPI = {
    register: async (userData: { name: string, email: string, password: string }) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },
    login: async (credentials: { email: string, password: string }) => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },
    getMe: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    }
};

// Game API
export const gameAPI = {
    // Получить все игры (только свои)
    getAllGames: async () => {
        const response = await api.get('/games');
        return response.data;
    },

    // Получить игру по Коду Комнаты (Публичный)
    getGameByCode: async (roomCode: string) => {
        const response = await api.get(`/games/code/${roomCode}`);
        return response.data;
    },

    // Получить игру по ID (Защищенный)
    getGameById: async (id: string) => {
        const response = await api.get(`/games/${id}`);
        return response.data;
    },

    // Создать новую игру
    createGame: async (gameData: any) => {
        const response = await api.post('/games', gameData);
        return response.data;
    },

    // Обновить игру
    updateGame: async (gameId: string, gameData: any) => {
        const response = await api.put(`/games/${gameId}`, gameData);
        return response.data;
    },

    // Удалить игру
    deleteGame: async (gameId: string) => {
        const response = await api.delete(`/games/${gameId}`);
        return response.data;
    },

    // Получить детали фильма из TMDB (через backend)
    getTMDBMovie: async (tmdbId: number) => {
        const response = await api.get(`/tmdb/movie/${tmdbId}`);
        return response.data;
    },

    // Получить историю ответов игрока
    getPlayerAnswers: async (playerId: string) => {
        const response = await api.get(`/players/${playerId}/answers`);
        return response.data;
    },
};
