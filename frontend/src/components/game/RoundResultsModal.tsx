import { motion, AnimatePresence } from 'framer-motion';

interface QuestionResult {
    questionTitle: string;
    yourAnswer: string | null;
    correctAnswer: string;
    isCorrect: boolean;
    points: number;
    maxPoints: number;
}

interface RoundResultsModalProps {
    show: boolean;
    roundNumber: number;
    roundTitle: string;
    questions: QuestionResult[];
    totalEarned: number;
    totalPossible: number;
    currentRank: number;
    rankChange: number; // positive = up, negative = down
    totalScore: number;
    totalPlayers: number;
    onClose: () => void;
}

export function RoundResultsModal({
    show,
    roundNumber,
    roundTitle,
    questions,
    totalEarned,
    totalPossible,
    currentRank,
    rankChange,
    totalScore,
    totalPlayers,
    onClose
}: RoundResultsModalProps) {
    const isPerfect = totalEarned === totalPossible;

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
                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        className="bg-gradient-to-br from-background-elevated to-background-hover border-2 border-primary/30 rounded-3xl p-6 max-w-2xl w-full shadow-2xl my-8"
                    >
                        {/* Header */}
                        <div className="text-center mb-6">
                            <div className="inline-block bg-gradient-to-r from-primary to-accent-purple text-white px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider mb-3">
                                Раунд {roundNumber}
                            </div>
                            <h1 className="text-3xl font-bold text-text-primary mb-2">
                                🎯 Результаты раунда
                            </h1>
                            <h2 className="text-xl text-accent-orange font-semibold">
                                {roundTitle}
                            </h2>
                        </div>

                        {/* Questions List */}
                        <div className="space-y-3 mb-6 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                            {questions.map((q, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`p-4 rounded-xl border ${q.isCorrect
                                            ? 'bg-success/10 border-success/30'
                                            : 'bg-error/10 border-error/30'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Icon */}
                                        <div className={`text-2xl flex-shrink-0 ${q.isCorrect ? 'animate-bounce' : ''
                                            }`}>
                                            {q.isCorrect ? '✅' : '❌'}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {/* Question Title */}
                                            <div className="font-bold text-text-primary mb-2">
                                                Вопрос {index + 1}: {q.questionTitle}
                                            </div>

                                            {/* Your Answer */}
                                            {q.yourAnswer ? (
                                                <div className="text-sm mb-1">
                                                    <span className={q.isCorrect ? 'text-success' : 'text-error'}>
                                                        Ваш ответ:
                                                    </span>{' '}
                                                    <span className="text-text-secondary font-medium">
                                                        {q.yourAnswer}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="text-sm text-text-muted mb-1">
                                                    Ответ не дан
                                                </div>
                                            )}

                                            {/* Correct Answer (if wrong) */}
                                            {!q.isCorrect && (
                                                <div className="text-sm">
                                                    <span className="text-success">Правильно:</span>{' '}
                                                    <span className="text-text-primary font-medium">
                                                        {q.correctAnswer}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Points */}
                                            <div className="text-sm mt-2">
                                                <span className={q.isCorrect ? 'text-success font-bold' : 'text-error'}>
                                                    {q.isCorrect ? '+' : ''}{q.points} / {q.maxPoints} очков
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Summary Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: questions.length * 0.1 + 0.2 }}
                            className="bg-background-elevated/50 rounded-2xl p-6 border border-white/5 mb-6"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                {/* Earned Points */}
                                <div>
                                    <div className="text-text-muted text-sm mb-1">Заработано</div>
                                    <div className={`text-3xl font-bold ${isPerfect ? 'text-accent-orange animate-pulse' : 'text-primary'
                                        }`}>
                                        {totalEarned} / {totalPossible}
                                    </div>
                                    {isPerfect && (
                                        <div className="text-accent-orange text-sm mt-1 font-bold">
                                            🎉 Идеально!
                                        </div>
                                    )}
                                </div>

                                {/* Rank */}
                                <div>
                                    <div className="text-text-muted text-sm mb-1">Ваше место</div>
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-3xl font-bold text-accent-orange">
                                            {currentRank}-е
                                        </span>
                                        {rankChange !== 0 && (
                                            <span className={`text-xl font-bold ${rankChange > 0 ? 'text-success' : 'text-error'
                                                }`}>
                                                {rankChange > 0 ? '↑' : '↓'}{Math.abs(rankChange)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-text-muted text-xs mt-1">
                                        из {totalPlayers} игроков
                                    </div>
                                </div>

                                {/* Total Score */}
                                <div>
                                    <div className="text-text-muted text-sm mb-1">Всего очков</div>
                                    <div className="text-3xl font-bold text-primary">
                                        {totalScore}
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Continue Button */}
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: questions.length * 0.1 + 0.4 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onClose}
                            className="w-full bg-gradient-to-r from-primary to-accent-purple text-white font-bold text-xl py-4 rounded-xl shadow-lg hover:shadow-xl transition-all"
                        >
                            ПРОДОЛЖИТЬ
                        </motion.button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
