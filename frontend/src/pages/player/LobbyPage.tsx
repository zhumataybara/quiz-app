import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../../hooks/useGameStore';
import { useSocket } from '../../hooks/useSocket';

export function LobbyPage() {
    const navigate = useNavigate();
    const { game, players, playerNickname } = useGameStore();
    const { startHeartbeat } = useSocket();
    const [isInitializing, setIsInitializing] = useState(true);

    // Give time for reconnection to load data
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsInitializing(false);
        }, 3000); // Wait 3 seconds for reconnection (increased from 1s)

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        // Don't redirect while initializing
        if (isInitializing) return;

        // Check localStorage for saved session
        const savedGameId = localStorage.getItem('quiz_game_id');

        // If no game but we have saved data, wait for reconnection
        if (!game && savedGameId) {
            console.log('Waiting for reconnection...');
            return; // Don't redirect yet
        }

        // If truly no game, redirect to join
        if (!game) {
            navigate('/join');
            return;
        }

        // Start heartbeat
        const playerId = localStorage.getItem('quiz_player_id');
        if (playerId) {
            const cleanup = startHeartbeat(playerId);
            return cleanup;
        }
    }, [game, navigate, startHeartbeat, isInitializing]);

    useEffect(() => {
        // When game starts, navigate to game page
        if (game?.status === 'ACTIVE') {
            navigate('/game');
        }
    }, [game?.status, navigate]);

    if (!game) {
        return null;
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative">
            <div className="absolute top-6 left-6 text-xl font-bold text-white/30">
                Quiz Room
            </div>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card-primary max-w-2xl w-full"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-6xl font-bold mb-8 mt-4 tracking-tight shadow-title">{game.title || 'Quiz Room'}</h1>
                    <div className="inline-block bg-primary/20 px-6 py-2 rounded-pill">
                        <span className="text-text-secondary text-sm">Код комнаты:</span>
                        <span className="text-2xl font-bold text-primary ml-2 tracking-widest">
                            {game.roomCode}
                        </span>
                    </div>
                </div>

                {/* Waiting Message */}
                <div className="text-center mb-8">
                    <motion.div
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-body-lg text-text-secondary"
                    >
                        Ожидание начала игры...
                    </motion.div>
                    <p className="text-sm text-text-muted mt-2">
                        Организатор скоро запустит первый раунд
                    </p>
                </div>

                {/* Players List */}
                <div className="bg-background-hover rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-heading-md">Участники</h2>
                        <span className="bg-accent-teal/20 text-accent-teal px-3 py-1 rounded-pill text-sm font-semibold">
                            {players.length} {players.length === 1 ? 'игрок' : 'игроков'}
                        </span>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-custom">
                        {players.map((player, index) => (
                            <motion.div
                                key={player.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`flex items-center gap-3 p-3 rounded-lg ${player.nickname === playerNickname
                                    ? 'bg-primary/20 border border-primary/40'
                                    : 'bg-white/5'
                                    }`}
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center text-lg font-bold">
                                    {player.nickname.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold text-text-primary">
                                        {player.nickname}
                                        {player.nickname === playerNickname && (
                                            <span className="text-xs text-primary ml-2">(вы)</span>
                                        )}
                                    </div>
                                </div>
                                {player.isConnected ? (
                                    <span className="w-2 h-2 rounded-full bg-success"></span>
                                ) : (
                                    <span className="w-2 h-2 rounded-full bg-text-muted"></span>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Tips */}
                <div className="mt-6 p-4 bg-info/10 border border-info/20 rounded-lg">
                    <p className="text-sm text-text-secondary">
                        <strong>Совет:</strong> Приготовьте вашу страницу — скоро начнем! Вам нужно будет угадывать фильмы и сериалы, показанные на большом экране.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
