import prisma from '../utils/prisma.js';
import * as tmdb from '../services/tmdb.js';

// GET /api/games - Получить все игры (только свои)
export async function getAllGames(req, res) {
    try {
        const games = await prisma.game.findMany({
            where: {
                creatorId: req.user.id
            },
            include: {
                rounds: {
                    include: {
                        questions: {
                            include: {
                                correctAnswers: true
                            }
                        }
                    },
                    orderBy: {
                        orderIndex: 'asc'
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(games);
    } catch (error) {
        console.error('Error fetching games:', error);
        res.status(500).json({ error: 'Failed to fetch games' });
    }
}

// GET /api/games/code/:roomCode - Получить игру по коду (Публичный)
export async function getGameByRoomCode(req, res) {
    try {
        const { roomCode } = req.params;

        const game = await prisma.game.findUnique({
            where: { roomCode },
            include: {
                rounds: {
                    include: {
                        questions: true
                    },
                    orderBy: {
                        orderIndex: 'asc'
                    }
                }
            }
        });

        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        // Sanitize for public access?
        // Projector needs questions count etc.
        // It does NOT need correct answers. 
        // But ProjectorPage uses socket for real data.
        // This initial fetch is just to get Game ID and basic structure?
        // Actually Projector connects to socket `admin:join_room` using ID.
        // So it needs ID from RoomCode.

        res.json(game);
    } catch (error) {
        console.error('Error fetching game by code:', error);
        res.status(500).json({ error: 'Failed to fetch game' });
    }
}

// GET /api/games/:id - Получить игру по ID (только свою)
export async function getGameById(req, res) {
    try {
        const { id } = req.params;

        const game = await prisma.game.findUnique({
            where: { id },
            include: {
                rounds: {
                    include: {
                        questions: {
                            include: {
                                correctAnswers: true
                            }
                        }
                    },
                    orderBy: {
                        orderIndex: 'asc'
                    }
                }
            }
        });

        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        // Check ownership
        if (game.creatorId !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        res.json(game);
    } catch (error) {
        console.error('Error fetching game:', error);
        res.status(500).json({ error: 'Failed to fetch game' });
    }
}

// POST /api/games - Создать новую игру
export async function createGame(req, res) {
    try {
        const { title, rounds } = req.body;

        if (!title || !rounds || rounds.length === 0) {
            return res.status(400).json({ error: 'Title and at least one round are required' });
        }

        // Создаем игру с раундами и вопросами
        const game = await prisma.game.create({
            data: {
                title,
                roomCode: generateRoomCode(),
                status: 'LOBBY',
                creatorId: req.user.id,
                rounds: {
                    create: rounds.map((round, index) => ({
                        title: round.title,
                        videoUrl: round.videoUrl || null,
                        orderIndex: index,
                        state: 'WAITING',
                        questions: {
                            create: round.questions.map((question, qIndex) => ({
                                points: question.points || 1,
                                orderIndex: qIndex,
                                correctAnswers: {
                                    create: (question.correctAnswers || [question]).map(answer => ({
                                        tmdbId: answer.tmdbId,
                                        title: answer.title,
                                        originalTitle: answer.originalTitle || null,
                                        year: answer.year || null,
                                        posterPath: answer.posterPath || null,
                                        tmdbType: answer.mediaType || 'movie'
                                    }))
                                }
                            }))
                        }
                    }))
                }
            },
            include: {
                rounds: {
                    include: {
                        questions: {
                            include: {
                                correctAnswers: true
                            }
                        }
                    }
                }
            }
        });

        res.status(201).json(game);
    } catch (error) {
        console.error('Error creating game:', error);
        res.status(500).json({ error: 'Failed to create game', details: error.message });
    }
}

// PUT /api/games/:id - Обновить игру
export async function updateGame(req, res) {
    try {
        const { id } = req.params;
        const { title, rounds } = req.body;

        const existingGame = await prisma.game.findUnique({
            where: { id }
        });

        if (!existingGame) {
            return res.status(404).json({ error: 'Game not found' });
        }

        if (existingGame.creatorId !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Allow editing in any status, but it will reset the game
        const needsReset = existingGame.status !== 'LOBBY';

        // Also reset player scores if resetting game
        if (needsReset) {
            await prisma.player.updateMany({
                where: { gameId: id },
                data: { totalScore: 0 }
            });
        }

        const updatedGame = await prisma.game.update({
            where: { id },
            data: {
                title: title || existingGame.title,
                // Reset game state if it was active
                status: 'LOBBY',
                currentRoundId: null,
                rounds: rounds ? {
                    deleteMany: {},
                    create: rounds.map((round, index) => ({
                        title: round.title,
                        videoUrl: round.videoUrl || null,
                        orderIndex: index,
                        state: 'WAITING',
                        questions: {
                            create: round.questions.map((question, qIndex) => ({
                                points: question.points || 1,
                                orderIndex: qIndex,
                                correctAnswers: {
                                    create: (question.correctAnswers || [question]).map(answer => ({
                                        tmdbId: answer.tmdbId,
                                        title: answer.title,
                                        originalTitle: answer.originalTitle || null,
                                        year: answer.year || null,
                                        posterPath: answer.posterPath || null,
                                        tmdbType: answer.mediaType || 'movie'
                                    }))
                                }
                            }))
                        }
                    }))
                } : undefined
            },
            include: {
                rounds: {
                    include: {
                        questions: {
                            include: {
                                correctAnswers: true
                            }
                        }
                    }
                }
            }
        });

        res.json(updatedGame);
    } catch (error) {
        console.error('Error updating game:', error);
        res.status(500).json({ error: 'Failed to update game' });
    }
}

// DELETE /api/games/:id - Удалить игру
export async function deleteGame(req, res) {
    try {
        const { id } = req.params;

        const existingGame = await prisma.game.findUnique({
            where: { id }
        });

        if (!existingGame) {
            return res.status(404).json({ error: 'Game not found' });
        }

        if (existingGame.creatorId !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await prisma.game.delete({
            where: { id }
        });

        res.json({ message: 'Game deleted successfully' });
    } catch (error) {
        console.error('Error deleting game:', error);
        res.status(500).json({ error: 'Failed to delete game' });
    }
}

// GET /api/tmdb/search?query=... - Поиск фильмов и сериалов в TMDB
export async function searchTMDB(req, res) {
    try {
        const { query } = req.query;

        if (!query || query.length < 2) {
            return res.json([]);
        }

        const results = await tmdb.searchMovies(query);
        res.json(results);
    } catch (error) {
        console.error('Error searching TMDB:', error);
        res.status(500).json({ error: 'Failed to search TMDB' });
    }
}

// GET /api/tmdb/movie/:id - Получить детали фильма из TMDB
export async function getTMDBMovieDetails(req, res) {
    try {
        const { id } = req.params;
        const details = await tmdb.getMovieDetails(id);

        if (!details) {
            return res.status(404).json({ error: 'Movie not found in TMDB' });
        }

        res.json(details);
    } catch (error) {
        console.error('Error fetching TMDB details:', error);
        res.status(500).json({ error: 'Failed to fetch movie details' });
    }
}

// GET /api/players/:id/answers
export async function getPlayerAnswers(req, res) {
    try {
        const { id } = req.params;

        const answers = await prisma.answer.findMany({
            where: { playerId: id },
            include: {
                question: {
                    include: {
                        round: true
                    }
                }
            },
            orderBy: [
                { question: { round: { orderIndex: 'asc' } } },
                { question: { orderIndex: 'asc' } }
            ]
        });

        // Hide results for rounds that are not revealed yet
        const sanitizedAnswers = answers.map(answer => {
            const roundState = answer.question.round.state;
            if (roundState !== 'REVEALED') {
                return {
                    ...answer,
                    isCorrect: null,
                    pointsEarned: null
                };
            }
            return answer;
        });

        res.json(sanitizedAnswers);
    } catch (error) {
        console.error('Error fetching player answers:', error);
        res.status(500).json({ error: 'Failed to fetch answers' });
    }
}

// Генерация уникального кода комнаты
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
