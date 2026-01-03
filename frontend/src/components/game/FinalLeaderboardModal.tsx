import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface Player {
    nickname: string;
    totalScore: number;
}

interface FinalLeaderboardModalProps {
    show: boolean;
    players: Player[];
    yourRank: number;
    yourScore: number;
    onClose: () => void;
}

const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
};

export function FinalLeaderboardModal({
    show,
    players,
    yourRank,
    yourScore,
    onClose
}: FinalLeaderboardModalProps) {
    const navigate = useNavigate();
    const isTopThree = yourRank <= 3;

    const handleClose = () => {
        onClose();
        navigate('/lobby');
    };

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-y-auto"
                >
                    <motion.div
                        initial={{ scale: 0.8, y: 50, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.8, y: 50, opacity: 0 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="bg-gradient-to-br from-background-elevated to-background-hover border-2 border-primary/30 rounded-3xl p-8 max-w-2xl w-full shadow-2xl my-8"
                    >
                        {/* Confetti effect for top 3 */}
                        {isTopThree && (
                            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                                {[...Array(20)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ y: -20, x: Math.random() * 100 + '%', opacity: 1 }}
                                        animate={{
                                            y: window.innerHeight,
                                            rotate: Math.random() * 360,
                                            opacity: 0
                                        }}
                                        transition={{
                                            duration: 2 + Math.random() * 2,
                                            delay: Math.random() * 0.5,
                                            ease: 'linear'
                                        }}
                                        className="absolute w-3 h-3 rounded-full"
                                        style={{
                                            backgroundColor: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF'][Math.floor(Math.random() * 4)]
                                        }}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center mb-8"
                        >
                            <svg className="w-20 h-20 mx-auto mb-4 text-warning" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                            </svg>
                            <h1 className="text-4xl font-bold text-text-primary mb-2">
                                Игра завершена!
                            </h1>
                            <p className="text-text-muted">Итоговые результаты</p>
                        </motion.div>

                        {/* Leaderboard */}
                        <div className="bg-background-elevated/50 rounded-2xl p-6 mb-6 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                            <div className="space-y-3">
                                {players.map((player, index) => {
                                    const rank = index + 1;
                                    const isYou = rank === yourRank;
                                    const medal = getMedalEmoji(rank);

                                    return (
                                        <motion.div
                                            key={player.nickname}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className={`flex items-center gap-4 p-4 rounded-xl transition-all ${isYou
                                                ? 'bg-primary/20 border-2 border-primary shadow-lg scale-105'
                                                : 'bg-background-hover border border-white/5'
                                                }`}
                                        >
                                            {/* Rank */}
                                            <div className={`text-2xl font-bold w-12 flex-shrink-0 ${rank <= 3 ? 'text-accent-orange' : 'text-text-muted'
                                                }`}>
                                                {medal || `${rank}.`}
                                            </div>

                                            {/* Player info */}
                                            <div className="flex-1 min-w-0">
                                                <div className={`font-bold text-lg truncate ${isYou ? 'text-primary' : 'text-text-primary'
                                                    }`}>
                                                    {player.nickname}
                                                    {isYou && (
                                                        <span className="ml-2 text-sm text-primary/70">(Вы)</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Score */}
                                            <div className={`text-2xl font-bold ${rank === 1 ? 'text-accent-orange' :
                                                rank === 2 ? 'text-gray-300' :
                                                    rank === 3 ? 'text-orange-600' :
                                                        'text-text-secondary'
                                                }`}>
                                                {player.totalScore}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Your Result Summary */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: players.length * 0.1 + 0.2 }}
                            className={`p-6 rounded-2xl mb-6 text-center ${isTopThree
                                ? 'bg-gradient-to-r from-accent-orange/20 to-accent-pink/20 border-2 border-accent-orange/50'
                                : 'bg-background-elevated/50 border border-white/10'
                                }`}
                        >
                            {isTopThree && (
                                <div className="text-5xl mb-2">{getMedalEmoji(yourRank)}</div>
                            )}
                            <div className="text-xl text-text-muted mb-1">Ваше место</div>
                            <div className={`text-5xl font-bold mb-2 ${isTopThree ? 'text-accent-orange' : 'text-primary'
                                }`}>
                                {yourRank}-е
                            </div>
                            <div className="text-text-secondary">
                                Набрано очков: <span className="font-bold text-text-primary">{yourScore}</span>
                            </div>
                            {isTopThree && (
                                <div className="mt-3 text-accent-orange font-bold text-lg">
                                    🎉 Поздравляем! 🎉
                                </div>
                            )}
                        </motion.div>

                        {/* Close Button */}
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: players.length * 0.1 + 0.4 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleClose}
                            className="w-full bg-gradient-to-r from-primary to-accent-purple text-white font-bold text-xl py-4 rounded-xl shadow-lg hover:shadow-xl transition-all"
                        >
                            ВЕРНУТЬСЯ В ЛОББИ
                        </motion.button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
