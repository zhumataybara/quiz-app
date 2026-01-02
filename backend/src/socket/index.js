import prisma from '../utils/prisma.js';
// Trigger restart
import { handleDuplicateNickname, calculateLeaderboard, checkAnswer } from '../utils/helpers.js';

/**
 * Setup all Socket.io event handlers
 */
export function setupSocketHandlers(io) {
    io.on('connection', (socket) => {
        console.log(`✅ Client connected: ${socket.id}`);

        // Join game
        socket.on('join_game', async ({ roomCode, nickname }) => {
            try {
                // Find game
                const game = await prisma.game.findUnique({
                    where: { roomCode },
                    include: { players: true }
                });

                if (!game) {
                    socket.emit('error', { message: 'Игра не найдена', code: 'GAME_NOT_FOUND' });
                    return;
                }

                if (game.status === 'FINISHED') {
                    socket.emit('error', { message: 'Игра уже завершена', code: 'GAME_FINISHED' });
                    return;
                }

                // Check for duplicate nickname and handle it
                const existingNicknames = game.players.map(p => p.nickname);
                const finalNickname = handleDuplicateNickname(nickname, existingNicknames);

                // Create or update player
                const player = await prisma.player.create({
                    data: {
                        gameId: game.id,
                        socketId: socket.id,
                        nickname: finalNickname,
                        isConnected: true
                    }
                });

                // Join socket room
                socket.join(game.id);

                // Send player their info
                socket.emit('player_joined', { player });

                // Notify others
                socket.to(game.id).emit('player_joined', { player });

                // Send game state
                const gameState = await getPublicGameState(game.id);
                socket.emit('game_state', gameState);

                console.log(`👤 Player "${finalNickname}" joined game ${roomCode}`);
            } catch (error) {
                console.error('join_game error:', error.message);
                socket.emit('error', { message: 'Ошибка подключения к игре', code: 'JOIN_ERROR' });
            }
        });

        // Reconnect player
        socket.on('reconnect_player', async ({ playerId, gameId }) => {
            try {
                const player = await prisma.player.findUnique({
                    where: { id: playerId },
                    include: { game: true }
                });

                if (!player || player.gameId !== gameId) {
                    socket.emit('error', { message: 'Неверные данные переподключения', code: 'INVALID_RECONNECT' });
                    return;
                }

                // Update socket ID and connection status
                await prisma.player.update({
                    where: { id: playerId },
                    data: {
                        socketId: socket.id,
                        isConnected: true,
                        lastSeenAt: new Date()
                    }
                });

                // Join socket room
                socket.join(gameId);

                // Send current game state
                const gameState = await getPublicGameState(gameId);
                socket.emit('game_state', gameState);

                console.log(`🔄 Player "${player.nickname}" reconnected`);
            } catch (error) {
                console.error('reconnect_player error:', error.message);
                socket.emit('error', { message: 'Ошибка переподключения', code: 'RECONNECT_ERROR' });
            }
        });

        // Submit answer
        socket.on('submit_answer', async ({ playerId, questionId, tmdbId, text }) => {
            try {
                const player = await prisma.player.findUnique({
                    where: { id: playerId },
                    include: { game: true }
                });

                if (!player) {
                    socket.emit('error', { message: 'Игрок не найден', code: 'PLAYER_NOT_FOUND' });
                    return;
                }

                const question = await prisma.question.findUnique({
                    where: { id: questionId },
                    include: { correctAnswers: true }
                });

                if (!question) {
                    socket.emit('error', { message: 'Вопрос не найден', code: 'QUESTION_NOT_FOUND' });
                    return;
                }

                const round = await prisma.round.findUnique({
                    where: { id: question.roundId }
                });

                // Only allow answers when round is ACTIVE (not LOCKED or REVEALED)
                if (round.state !== 'ACTIVE') {
                    socket.emit('error', { message: 'Раунд не активен или уже заблокирован', code: 'ROUND_NOT_ACTIVE' });
                    return;
                }

                // Use upsert to allow updating answer before lock
                const answer = await prisma.answer.upsert({
                    where: {
                        playerId_questionId: {
                            playerId,
                            questionId
                        }
                    },
                    update: {
                        tmdbId,
                        submittedText: text,
                        submittedAt: new Date()
                    },
                    create: {
                        playerId,
                        questionId,
                        tmdbId,
                        submittedText: text,
                        isCorrect: false,
                        pointsEarned: 0
                    }
                });

                // Notify admin that player submitted/updated answer
                io.to(player.gameId).emit('answer_submitted', {
                    playerId,
                    questionId,
                    nickname: player.nickname,
                    isUpdate: !!answer.id  // true if updated existing answer
                });

                console.log(`📝 ${player.nickname} ${answer.id ? 'updated' : 'submitted'} answer for question ${questionId}`);
            } catch (error) {
                console.error('submit_answer error:', error.message);
                socket.emit('error', { message: 'Ошибка отправки ответа', code: 'SUBMIT_ERROR' });
            }
        });

        // Admin: Start round
        socket.on('admin:start_round', async ({ roundId }) => {
            try {
                const round = await prisma.round.findUnique({
                    where: { id: roundId },
                    include: {
                        game: {
                            include: {
                                rounds: { orderBy: { orderIndex: 'asc' } },
                                players: { orderBy: { totalScore: 'desc' } }
                            }
                        }
                    }
                });

                if (!round) {
                    socket.emit('error', { message: 'Раунд не найден', code: 'ROUND_NOT_FOUND' });
                    return;
                }

                // Update round state
                await prisma.round.update({
                    where: { id: roundId },
                    data: { state: 'ACTIVE' }
                });

                // Update game current round
                await prisma.game.update({
                    where: { id: round.gameId },
                    data: { currentRoundId: roundId, status: 'ACTIVE' }
                });

                // Calculate round number
                const roundNumber = round.game.rounds.findIndex(r => r.id === roundId) + 1;
                const totalRounds = round.game.rounds.length;

                // Send personalized transition data to each player
                round.game.players.forEach((player, index) => {
                    io.to(player.socketId).emit('round_started', {
                        roundId,
                        roundNumber,
                        totalRounds,
                        roundTitle: round.title,
                        playerScore: player.totalScore,
                        playerRank: index + 1,
                        totalPlayers: round.game.players.length
                    });
                });

                // Send updated game state to all players
                await broadcastGameState(io, round.gameId);

                console.log(`🎬 Round ${roundId} started (Round ${roundNumber}/${totalRounds})`);
            } catch (error) {
                console.error('admin:start_round error:', error.message);
                socket.emit('error', { message: 'Ошибка запуска раунда', code: 'START_ROUND_ERROR' });
            }
        });

        // Admin: Lock round (stop input)
        socket.on('admin:lock_round', async ({ roundId }) => {
            try {
                const round = await prisma.round.update({
                    where: { id: roundId },
                    data: { state: 'LOCKED' }
                });

                io.to(round.gameId).emit('round_locked', { roundId });

                console.log(`🔒 Round ${roundId} locked`);
            } catch (error) {
                console.error('admin:lock_round error:', error.message);
                socket.emit('error', { message: 'Ошибка блокировки раунда', code: 'LOCK_ROUND_ERROR' });
            }
        });

        // Admin: Reveal answers
        socket.on('admin:reveal_answers', async ({ roundId }) => {
            try {
                const round = await prisma.round.findUnique({
                    where: { id: roundId },
                    include: {
                        questions: {
                            include: {
                                correctAnswers: true,
                                answers: {
                                    include: { player: true }
                                }
                            }
                        },
                        game: {
                            include: { players: true }
                        }
                    }
                });

                if (!round) {
                    socket.emit('error', { message: 'Раунд не найден', code: 'ROUND_NOT_FOUND' });
                    return;
                }

                // Prepare batch updates for answers and players using transaction
                const answerUpdates = [];
                const playerScoreUpdates = {};

                // Evaluate all answers
                for (const question of round.questions) {
                    for (const answer of question.answers) {
                        const isCorrect = checkAnswer(answer.tmdbId, question.correctAnswers);
                        const pointsEarned = isCorrect ? question.points : 0;

                        // Collect answer updates
                        answerUpdates.push(
                            prisma.answer.update({
                                where: { id: answer.id },
                                data: { isCorrect, pointsEarned }
                            })
                        );

                        // Aggregate player score updates
                        if (isCorrect) {
                            if (!playerScoreUpdates[answer.playerId]) {
                                playerScoreUpdates[answer.playerId] = 0;
                            }
                            playerScoreUpdates[answer.playerId] += pointsEarned;
                        }
                    }
                }

                // Prepare player score updates
                const playerUpdates = Object.entries(playerScoreUpdates).map(([playerId, increment]) =>
                    prisma.player.update({
                        where: { id: playerId },
                        data: {
                            totalScore: {
                                increment
                            }
                        }
                    })
                );

                // Execute all updates in a single transaction
                await prisma.$transaction([
                    ...answerUpdates,
                    ...playerUpdates,
                    prisma.round.update({
                        where: { id: roundId },
                        data: { state: 'REVEALED' }
                    })
                ]);


                // Get updated players for leaderboard
                const updatedPlayers = await prisma.player.findMany({
                    where: { gameId: round.gameId },
                    orderBy: { totalScore: 'desc' }
                });

                const leaderboard = calculateLeaderboard(updatedPlayers);

                // Calculate round number
                const allRounds = await prisma.round.findMany({
                    where: { gameId: round.gameId },
                    orderBy: { orderIndex: 'asc' }
                });
                const roundNumber = allRounds.findIndex(r => r.id === roundId) + 1;

                // Send personalized results to each player
                for (const player of updatedPlayers) {
                    // Get player's answers for this round
                    const playerAnswers = await prisma.answer.findMany({
                        where: {
                            playerId: player.id,
                            question: { roundId }
                        },
                        include: {
                            question: {
                                include: { correctAnswers: true }
                            }
                        }
                    });

                    // Format questions with player's answers
                    const questionResults = round.questions.map(q => {
                        const playerAnswer = playerAnswers.find(a => a.questionId === q.id);
                        const correctAnswer = q.correctAnswers[0]; // Assume first is correct

                        return {
                            questionTitle: q.title || correctAnswer?.title || 'Без названия',
                            yourAnswer: playerAnswer?.submittedText || null,
                            correctAnswer: correctAnswer?.title || 'Неизвестно',
                            isCorrect: playerAnswer?.isCorrect || false,
                            points: playerAnswer?.pointsEarned || 0,
                            maxPoints: q.points
                        };
                    });

                    // Calculate total earned points for this round
                    const totalEarned = questionResults.reduce((sum, q) => sum + q.points, 0);
                    const totalPossible = round.questions.reduce((sum, q) => sum + q.points, 0);

                    // Find current rank
                    const currentRank = updatedPlayers.findIndex(p => p.id === player.id) + 1;

                    // Send personalized results
                    io.to(player.socketId).emit('answers_revealed', {
                        roundId,
                        roundNumber,
                        totalRounds: allRounds.length,
                        roundTitle: round.title,
                        questions: questionResults,
                        totalEarned,
                        totalPossible,
                        currentRank,
                        rankChange: 0, // TODO: Calculate rank change from previous round
                        totalScore: player.totalScore,
                        totalPlayers: updatedPlayers.length,
                        isLastRound: roundNumber === allRounds.length,
                        leaderboard
                    });
                }

                // If this is the last round, mark game as FINISHED
                const isLastRound = roundNumber === allRounds.length;
                if (isLastRound) {
                    await prisma.game.update({
                        where: { id: round.gameId },
                        data: { status: 'FINISHED' }
                    });
                    console.log(`🏁 Game ${round.gameId} marked as FINISHED`);
                }

                console.log(`🎯 Answers revealed for round ${roundId} (Round ${roundNumber}/${allRounds.length})`);
            } catch (error) {
                console.error('admin:reveal_answers error:', error.message);
                socket.emit('error', { message: 'Ошибка показа ответов', code: 'REVEAL_ERROR' });
            }
        });

        // Admin: Reset Game
        socket.on('admin:reset_game', async ({ gameId }) => {
            try {
                console.log(`🔄 Resetting game: ${gameId}`);

                // Performs all operations in a transaction for data integrity
                await prisma.$transaction(async (tx) => {
                    // 1. Reset Game Game status
                    await tx.game.update({
                        where: { id: gameId },
                        data: {
                            status: 'LOBBY',
                            currentRoundId: null
                        }
                    });

                    // 2. Reset all Rounds to WAITING
                    await tx.round.updateMany({
                        where: { gameId },
                        data: { state: 'WAITING' }
                    });

                    // 3. Delete all Answers first (due to foreign key constraints if any, or just logic)
                    await tx.answer.deleteMany({
                        where: {
                            player: {
                                gameId: gameId
                            }
                        }
                    });

                    // 4. Delete all Players
                    await tx.player.deleteMany({
                        where: { gameId }
                    });
                });

                console.log(`✅ Game ${gameId} reset successfully`);

                // 5. Notify everyone
                io.to(gameId).emit('game_reset');

                // Send fresh game state
                await broadcastGameState(io, gameId);

            } catch (error) {
                console.error('admin:reset_game error:', error.message);
                socket.emit('error', { message: 'Ошибка сброса игры', code: 'RESET_ERROR' });
            }
        });

        // Heartbeat (keep-alive)
        socket.on('heartbeat', async ({ playerId }) => {
            try {
                await prisma.player.update({
                    where: { id: playerId },
                    data: { lastSeenAt: new Date() }
                });
            } catch (error) {
                console.error('heartbeat error:', error.message);
            }
        });

        // Admin: Join room (to receive updates without being a player)
        socket.on('admin:join_room', async ({ gameId }) => {
            try {
                socket.join(gameId);
                socket.join(`admin:${gameId}`);
                console.log(`👨‍💼 Admin joined room: ${gameId}`);

                // Send current game state
                const gameState = await getAdminGameState(gameId);
                socket.emit('admin_game_state', gameState);
            } catch (error) {
                console.error('admin:join_room error:', error.message);
            }
        });

        // Admin: Leave room
        socket.on('admin:leave_room', ({ gameId }) => {
            socket.leave(gameId);
            console.log(`👨‍💼 Admin left room: ${gameId}`);
        });

        // Disconnect
        socket.on('disconnect', async () => {
            try {
                // Find player by socket ID
                const player = await prisma.player.findFirst({
                    where: { socketId: socket.id }
                });

                if (player) {
                    // Mark as disconnected (but don't delete - for reconnection)
                    await prisma.player.update({
                        where: { id: player.id },
                        data: { isConnected: false }
                    });

                    // Notify others
                    socket.to(player.gameId).emit('player_left', { playerId: player.id, nickname: player.nickname });

                    console.log(`❌ Player "${player.nickname}" disconnected`);
                }
            } catch (error) {
                console.error('disconnect error:', error.message);
            }
        });
    });
}

/**
 * Get complete game state for ADMIN (includes correct answers)
 */
async function getAdminGameState(gameId) {
    const game = await prisma.game.findUnique({
        where: { id: gameId },
        include: {
            rounds: {
                include: {
                    questions: {
                        include: { correctAnswers: true }
                    }
                },
                orderBy: { orderIndex: 'asc' }
            },
            players: {
                orderBy: { totalScore: 'desc' }
            },
            currentRound: {
                include: {
                    questions: {
                        include: {
                            correctAnswers: true,
                            answers: true
                        }
                    }
                }
            }
        }
    });

    if (!game) return null;

    const leaderboard = calculateLeaderboard(game.players);

    // Calculate progress
    const totalRounds = game.rounds.length;
    const currentRoundNumber = game.currentRound
        ? game.rounds.findIndex(r => r.id === game.currentRound.id) + 1
        : 0;

    const totalQuestions = game.currentRound?.questions.length || 0;
    const currentQuestionNumber = totalQuestions;

    return {
        game,
        currentRound: game.currentRound,
        players: game.players,
        leaderboard,
        progress: {
            currentRound: currentRoundNumber,
            totalRounds,
            currentQuestion: currentQuestionNumber,
            totalQuestions
        }
    };
}

/**
 * Get sanitized game state for PLAYERS (hides correct answers)
 */
async function getPublicGameState(gameId) {
    const adminState = await getAdminGameState(gameId);
    if (!adminState) return null;

    // Deep clone to avoid mutating original if cached (though here it's fresh)
    const publicState = JSON.parse(JSON.stringify(adminState));

    // Sanitize Rounds List
    publicState.game.rounds.forEach(round => {
        if (round.state !== 'REVEALED') {
            round.questions.forEach(q => {
                delete q.correctAnswers;
            });
        }
    });

    // Sanitize Current Round
    if (publicState.currentRound) {
        if (publicState.currentRound.state !== 'REVEALED') {
            publicState.currentRound.questions.forEach(q => {
                delete q.correctAnswers;
                // We should also probably hide 'answers' (other players' submissions)
                // unless it's necessary for some UI. 
                // Currently GamePage doesn't show other players' answers.
                delete q.answers;
            });
        }
    }

    // Leaderboard and Players are public info, so we keep them.
    // Progress is public.

    return publicState;
}

// Update helper to broadcast states
async function broadcastGameState(io, gameId) {
    const adminState = await getAdminGameState(gameId);
    const publicState = await getPublicGameState(gameId);

    if (adminState) {
        // Send to Admin room
        io.to(`admin:${gameId}`).emit('admin_game_state', adminState);
    }

    if (publicState) {
        // Send to Public room (Players + Screen)
        // Note: Admin socket is also in this room usually, but we want Admin component to listen to admin_game_state
        io.to(gameId).emit('game_state', publicState);
    }
}
