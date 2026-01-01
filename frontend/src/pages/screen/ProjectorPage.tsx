import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from '../../services/socket';
import { gameAPI } from '../../services/api';


export function ProjectorPage() {
    const { roomCode } = useParams();
    const [game, setGame] = useState<any>(null);
    const [currentRound, setCurrentRound] = useState<any>(null);
    const [players, setPlayers] = useState<any[]>([]);
    const [progress, setProgress] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!roomCode) return;

        loadGame();

        const handleRoundStarted = ({ roundId }: any) => {
            console.log('Round started:', roundId);
            loadGame();
        };

        const handleRoundLocked = () => {
            loadGame();
        };

        const handleAnswersRevealed = () => {
            loadGame();
        };

        const handlePlayerJoined = ({ player }: any) => {
            setPlayers(prev => [...prev, player]);
        };

        socket.on('round_started', handleRoundStarted);
        socket.on('round_locked', handleRoundLocked);
        socket.on('answers_revealed', handleAnswersRevealed);
        socket.on('player_joined', handlePlayerJoined);

        return () => {
            socket.off('round_started', handleRoundStarted);
            socket.off('round_locked', handleRoundLocked);
            socket.off('answers_revealed', handleAnswersRevealed);
            socket.off('player_joined', handlePlayerJoined);
        };
    }, [roomCode]);

    const loadGame = async () => {
        try {
            const foundGame = await gameAPI.getGameByCode(roomCode!);

            if (foundGame) {
                setGame(foundGame);
                if (foundGame.players) {
                    setPlayers(foundGame.players);
                }
                if (foundGame.currentRoundId) {
                    const round = foundGame.rounds?.find((r: any) => r.id === foundGame.currentRoundId);
                    setCurrentRound(round);
                }

                socket.emit('admin:join_room', { gameId: foundGame.id });
                setLoading(false);
            }
        } catch (error) {
            console.error('Error loading game:', error);
            setGame(null); // Ensure 'null' triggers offline message
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleGameState = (data: any) => {
            console.log('Projector received game_state:', data);
            if (data.game) {
                setGame(data.game);
            }
            if (data.players) {
                setPlayers(data.players);
            }
            if (data.progress) {
                setProgress(data.progress);
            }
        };

        socket.on('game_state', handleGameState);

        return () => {
            socket.off('game_state', handleGameState);
        };
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="text-6xl mb-4">⏳</div>
                    <p className="text-text-secondary text-xl">Загрузка...</p>
                </div>
            </div>
        );
    }

    if (!game) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="text-6xl mb-4 font-bold text-error">ОФФЛАЙН</div>
                    <h1 className="text-heading-lg text-text-primary mb-2">Игра не найдена</h1>
                    <p className="text-text-muted">Проверьте код комнаты: {roomCode}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-8 pb-32">
            {/* Collapsible Header */}


            {/* Main Content */}
            <div className="max-w-7xl mx-auto">
                {game.status === 'LOBBY' && (
                    <LobbyScreen roomCode={game.roomCode} players={players} />
                )}

                {game.status === 'ACTIVE' && currentRound && (
                    <GameScreen round={currentRound} players={players} progress={progress} />
                )}

                {game.status === 'FINISHED' && (
                    <FinalLeaderboard players={players} />
                )}
            </div>
        </div>
    );
}

import QRCode from 'react-qr-code';

function LobbyScreen({ roomCode, players }: { roomCode?: string; players: any[] }) {
    const joinUrl = `${window.location.origin}/join?code=${roomCode}`;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full"
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-8">
                {/* Left Column: Join Info */}
                <div className="lg:col-span-4 flex flex-col items-center bg-background-elevated/50 p-8 rounded-3xl border border-white/5 shadow-xl backdrop-blur-sm sticky top-8">
                    <div className="bg-white p-4 rounded-xl shadow-lg mb-8 transform hover:scale-105 transition-transform duration-300">
                        <QRCode
                            value={joinUrl}
                            size={300}
                            level="H"
                            fgColor="#000000"
                            bgColor="#ffffff"
                        />
                    </div>

                    <h2 className="text-4xl font-bold text-text-primary mb-4 text-center">Присоединяйтесь!</h2>
                    <p className="text-xl text-text-secondary mb-6 text-center">Сканируйте QR-код или переходите:</p>

                    <div className="w-full bg-background-elevated p-4 rounded-xl border border-primary/20 text-center mb-8">
                        <div className="text-primary font-mono text-2xl truncate">
                            {window.location.hostname}:5173/join
                        </div>
                    </div>

                    <div className="flex flex-col items-center w-full pt-6 border-t border-white/10">
                        <p className="text-xl text-text-secondary mb-3 uppercase tracking-widest font-medium">Код комнаты</p>
                        <span className="font-bold text-accent-orange text-5xl xl:text-6xl tracking-widest leading-none text-center shadow-text-glow">
                            {roomCode}
                        </span>
                    </div>
                </div>

                {/* Right Column: Players Grid */}
                <div className="lg:col-span-8 bg-background-elevated/30 p-8 rounded-3xl border border-white/5 min-h-[600px]">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
                        <h3 className="text-3xl font-bold text-text-primary flex items-center gap-3">
                            Участники
                        </h3>
                        <span className="bg-primary/20 text-primary px-5 py-2 rounded-full font-bold text-2xl">
                            {players.length}
                        </span>
                    </div>

                    {players.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-96 text-text-muted/30">
                            <div className="text-4xl font-light">Ждем первого игрока...</div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4 auto-rows-min">
                            <AnimatePresence mode="popLayout">
                                {players.map((player) => (
                                    <motion.div
                                        key={player.id}
                                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0 }}
                                        layout
                                        className="bg-background-elevated hover:bg-white/10 p-4 rounded-xl border border-white/5 shadow-lg flex items-center gap-4 transition-colors"
                                    >
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center text-2xl font-bold text-white shadow-inner flex-shrink-0 ring-2 ring-white/10">
                                            {player.nickname.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="text-xl font-bold text-text-primary truncate min-w-0">
                                            {player.nickname}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

function GameScreen({ round, players, progress }: { round: any; players: any[]; progress?: any }) {


    return (
        <div className="space-y-8">
            {/* Round Header */}
            <div className="text-center relative py-6">
                <motion.h2
                    initial={{ opacity: 0, scale: 0.9, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="text-7xl font-black text-white mb-6 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] tracking-tight leading-tight"
                >
                    {round.title}
                </motion.h2>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-6 bg-white/5 backdrop-blur-md px-8 py-3 rounded-full border border-white/10 shadow-lg"
                >
                    {progress && (
                        <div className="flex items-center gap-3 border-r border-white/10 pr-6 mr-1">
                            <span className="text-text-secondary font-bold uppercase tracking-widest text-sm">Раунд</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-white leading-none pb-1">{progress.currentRound}</span>
                                <span className="text-lg text-text-muted font-bold">/</span>
                                <span className="text-lg text-text-muted font-bold">{progress.totalRounds}</span>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <span className="text-text-secondary font-bold uppercase tracking-widest text-sm">Вопросов</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                        <span className="text-3xl font-black text-primary leading-none pb-1">{round.questions?.length || 0}</span>
                    </div>
                </motion.div>
            </div>

            {/* Full Leaderboard - Projector Style */}
            <div className="mt-12">
                <h3 className="text-display-md text-text-primary mb-8 flex items-center gap-4 border-b border-white/5 pb-4">
                    <span className="text-4xl">🏆</span>
                    Таблица лидеров
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {[...players]
                            .sort((a, b) => b.totalScore - a.totalScore)
                            .map((player, index) => (
                                <motion.div
                                    key={player.id}
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`relative rounded-2xl p-6 flex items-center gap-5 overflow-hidden group ${index === 0 ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 border border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.1)]' :
                                        index === 1 ? 'bg-gradient-to-br from-gray-300/20 to-gray-400/5 border border-gray-400/30' :
                                            index === 2 ? 'bg-gradient-to-br from-orange-400/20 to-orange-500/5 border border-orange-500/30' :
                                                'bg-background-elevated border border-white/5'
                                        }`}
                                >
                                    {/* Rank Badge */}
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-3xl shrink-0 shadow-lg ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black shadow-yellow-500/20' :
                                        index === 1 ? 'bg-gradient-to-br from-gray-200 to-gray-400 text-black shadow-gray-400/20' :
                                            index === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-500 text-black shadow-orange-500/20' :
                                                'bg-background border border-white/10 text-text-muted'
                                        }`}>
                                        {index + 1}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 z-10">
                                        <div className={`text-2xl font-bold truncate mb-1 ${index < 3 ? 'text-white' : 'text-text-primary'
                                            }`}>
                                            {player.nickname}
                                        </div>
                                        {player.isConnected === false && (
                                            <div className="text-sm font-bold text-error uppercase tracking-wider bg-error/10 inline-block px-2 py-0.5 rounded">
                                                Не в сети
                                            </div>
                                        )}
                                    </div>

                                    {/* Score */}
                                    <div className="text-right z-10">
                                        <div className={`text-4xl font-black leading-none ${index === 0 ? 'text-yellow-400 drop-shadow-lg' :
                                            index === 1 ? 'text-gray-300' :
                                                index === 2 ? 'text-orange-400' :
                                                    'text-primary'
                                            }`}>
                                            {player.totalScore}
                                        </div>
                                        <div className="text-xs font-bold text-text-muted uppercase tracking-widest opacity-60 mt-1">баллов</div>
                                    </div>

                                    {/* Crown for Leader */}
                                    {index === 0 && (
                                        <div className="absolute -top-6 -right-6 text-9xl opacity-10 rotate-12 select-none pointer-events-none">
                                            👑
                                        </div>
                                    )}

                                    {/* Subtle Glow for top 3 */}
                                    {index < 3 && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    )}
                                </motion.div>
                            ))}
                    </AnimatePresence>
                </div>
            </div>

        </div>
    );
}

function FinalLeaderboard({ players }: { players: any[] }) {
    const sortedPlayers = [...players].sort((a, b) => b.totalScore - a.totalScore);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
        >
            <h2 className="text-display-md text-text-primary mb-12">Итоговая таблица</h2>

            <div className="max-w-3xl mx-auto space-y-4">
                {sortedPlayers.map((player, index) => (
                    <motion.div
                        key={player.id}
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-background-elevated rounded-lg p-6 flex items-center gap-6"
                    >
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl ${index === 0 ? 'bg-accent-orange text-black' :
                            index === 1 ? 'bg-text-secondary text-black' :
                                index === 2 ? 'bg-accent-teal text-black' :
                                    'bg-white/10 text-white'
                            }`}>
                            {index + 1}
                        </div>
                        <div className="flex-1 text-left">
                            <div className="text-2xl font-bold text-text-primary">{player.nickname}</div>
                        </div>
                        <div className="text-3xl font-bold text-primary">
                            {player.totalScore}
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
