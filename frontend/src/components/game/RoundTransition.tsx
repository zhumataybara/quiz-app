import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RoundTransitionProps {
    show: boolean;
    roundNumber: number;
    roundTitle: string;
    playerScore: number;
    playerRank: number;
    totalPlayers: number;
    onClose: () => void;
}

export function RoundTransition({
    show,
    roundNumber,
    roundTitle,
    playerScore,
    playerRank,
    totalPlayers,
    onClose
}: RoundTransitionProps) {
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        if (!show) {
            setCountdown(5);
            return;
        }

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    onClose();
                    return 5;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [show, onClose]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.8, y: 50, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.8, y: 50, opacity: 0 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="bg-gradient-to-br from-background-elevated to-background-hover border-2 border-primary/30 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Round Number Badge */}
                        <div className="flex justify-center mb-6">
                            <div className="bg-gradient-to-r from-primary to-accent-purple text-white px-6 py-3 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg">
                                Раунд {roundNumber}
                            </div>
                        </div>

                        {/* Title */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-4xl font-bold text-center text-text-primary mb-3 leading-tight"
                        >
                            🏁 Начинается!
                        </motion.h1>

                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-2xl font-semibold text-center text-accent-orange mb-8"
                        >
                            {roundTitle}
                        </motion.h2>

                        {/* Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-background-elevated/50 rounded-2xl p-6 mb-8 border border-white/5"
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center">
                                    <div className="text-text-muted text-sm mb-1">Ваши очки</div>
                                    <div className="text-3xl font-bold text-primary">{playerScore}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-text-muted text-sm mb-1">Ваше место</div>
                                    <div className="text-3xl font-bold text-accent-orange">
                                        {playerRank}-е из {totalPlayers}
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Ready Button */}
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onClose}
                            className="w-full bg-gradient-to-r from-primary to-accent-purple text-white font-bold text-xl py-4 rounded-xl shadow-lg hover:shadow-xl transition-all"
                        >
                            ГОТОВ!
                        </motion.button>

                        {/* Countdown */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-center mt-4 text-text-muted text-sm"
                        >
                            Автоматически через {countdown}...
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
