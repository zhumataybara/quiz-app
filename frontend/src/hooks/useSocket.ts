import { useEffect, useCallback } from 'react';
import { socket } from '../services/socket';
import { useGameStore } from './useGameStore';

export function useSocket() {
    const { setConnected, setGame, setPlayers, setLeaderboard, setProgress } = useGameStore();

    // Connect socket
    useEffect(() => {
        if (!socket.connected) {
            socket.connect();
        }

        // Connection handlers
        const handleConnect = () => {
            console.log('Connected to server');
            setConnected(true);
        };

        const handleDisconnect = () => {
            console.log('Disconnected from server');
            setConnected(false);
        };

        const handleConnectError = (error: Error) => {
            console.error('Connection error:', error);
            setConnected(false);
        };

        // Game state updates
        const handleGameState = (data: any) => {
            console.log('Received game state:', data);
            setGame(data.game);
            setPlayers(data.players);
            setLeaderboard(data.leaderboard);
            if (data.progress) {
                setProgress(data.progress);
            }
        };

        const handlePlayerJoined = ({ player }: { player: any }) => {
            console.log(`Player joined: ${player.nickname}`);
            // Save playerId for reconnection
            if (player && player.id) {
                const { setPlayerId } = useGameStore.getState();
                setPlayerId(player.id);
            }
        };

        const handleRoundStarted = ({ roundId }: { roundId: string }) => {
            console.log(`Round started: ${roundId}`);
            // Request updated game state when round starts
            const gameId = localStorage.getItem('quiz_game_id');
            if (gameId) {
                socket.emit('admin:join_room', { gameId });
            }
        };

        const handleRoundLocked = ({ roundId }: { roundId: string }) => {
            console.log(`Round locked: ${roundId}`);

            // Update local state immediately
            const currentState = useGameStore.getState();
            if (currentState.game && currentState.game.currentRound && currentState.game.currentRound.id === roundId) {
                const updatedGame = {
                    ...currentState.game,
                    currentRound: {
                        ...currentState.game.currentRound,
                        state: 'LOCKED' as const
                    }
                };
                setGame(updatedGame);
            }
        };

        const handleAnswersRevealed = ({ roundId, leaderboard }: any) => {
            console.log(`Answers revealed for round ${roundId}`);
            setLeaderboard(leaderboard);

            // Update local state immediately
            const currentState = useGameStore.getState();
            if (currentState.game && currentState.game.currentRound && currentState.game.currentRound.id === roundId) {
                const updatedGame = {
                    ...currentState.game,
                    currentRound: {
                        ...currentState.game.currentRound,
                        state: 'REVEALED' as const
                    }
                };
                setGame(updatedGame);
            }
        };

        const handleError = ({ message, code }: { message: string; code: string }) => {
            console.error(`Server error [${code}]: ${message}`);

            // Handle invalid reconnect gracefully - just clear state
            if (code === 'INVALID_RECONNECT' || code === 'PLAYER_NOT_FOUND' || code === 'GAME_FINISHED') {
                const { reset } = useGameStore.getState();
                reset();
                return;
            }

            alert(message);
        };

        // Register all event listeners
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('connect_error', handleConnectError);
        socket.on('game_state', handleGameState);
        socket.on('player_joined', handlePlayerJoined);
        socket.on('round_started', handleRoundStarted);
        socket.on('round_locked', handleRoundLocked);
        socket.on('answers_revealed', handleAnswersRevealed);
        // Handle full game reset - kick everyone out
        const handleGameReset = () => {
            console.log('Game reset - clearing state');
            const { reset } = useGameStore.getState();
            reset();
            window.location.href = '/join'; // Force redirect
        };

        // Register all event listeners
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('connect_error', handleConnectError);
        socket.on('game_state', handleGameState);
        socket.on('player_joined', handlePlayerJoined);
        socket.on('round_started', handleRoundStarted);
        socket.on('round_locked', handleRoundLocked);
        socket.on('answers_revealed', handleAnswersRevealed);
        socket.on('game_reset', handleGameReset);
        socket.on('error', handleError);

        // Cleanup function - remove ALL listeners
        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('connect_error', handleConnectError);
            socket.off('game_state', handleGameState);
            socket.off('player_joined', handlePlayerJoined);
            socket.off('round_started', handleRoundStarted);
            socket.off('round_locked', handleRoundLocked);
            socket.off('answers_revealed', handleAnswersRevealed);
            socket.off('game_reset', handleGameReset);
            socket.off('error', handleError);
        };
    }, [setConnected, setGame, setPlayers, setLeaderboard, setProgress]);

    // Emit functions
    const joinGame = useCallback((roomCode: string, nickname: string) => {
        console.log(`Joining game: ${roomCode} as ${nickname}`);
        socket.emit('join_game', { roomCode, nickname });
    }, []);

    const reconnectPlayer = useCallback((playerId: string, gameId: string) => {
        console.log(`Reconnecting player: ${playerId}`);
        socket.emit('reconnect_player', { playerId, gameId });
    }, []);

    const submitAnswer = useCallback((playerId: string, questionId: string, tmdbId: number, text: string) => {
        console.log(`Submitting answer: ${text} (${tmdbId})`);
        socket.emit('submit_answer', { playerId, questionId, tmdbId, text });
    }, []);

    const startHeartbeat = useCallback((playerId: string) => {
        const interval = setInterval(() => {
            socket.emit('heartbeat', { playerId });
        }, 30000); // Every 30 seconds

        return () => clearInterval(interval);
    }, []);

    return {
        joinGame,
        reconnectPlayer,
        submitAnswer,
        startHeartbeat,
    };
}
