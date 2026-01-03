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
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="bg-gradient-to-br from-background-elevated to-background-hover border-t-2 sm:border-2 border-primary/30 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] overflow-hidden shadow-2xl"
                    >
                        {/* Compact Header */}
                        <div className="bg-gradient-to-r from-primary/10 to-accent-purple/10 border-b border-white/5 px-4 py-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center text-white text-sm font-bold">
                                        {roundNumber}
                                    </div>
                                    <div>
                                        <div className="text-xs text-text-muted uppercase tracking-wide">Результаты</div>
                                        <div className="text-sm font-semibold text-text-primary truncate max-w-[200px]">{roundTitle}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-text-muted">Очки</div>
                                    <div className={`text-lg font-bold ${isPerfect ? 'text-accent-orange' : 'text-primary'}`}>
                                        {totalEarned}/{totalPossible}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Scrollable Questions */}
                        <div className="overflow-y-auto max-h-[calc(90vh-240px)] sm:max-h-[calc(85vh-220px)] px-4 py-3 space-y-2">
                            {questions.map((q, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`rounded-xl border p-3 ${q.isCorrect
                                            ? 'bg-success/5 border-success/20'
                                            : 'bg-error/5 border-error/20'
                                        }`}
                                >
                                    <div className="flex gap-2">
                                        {/* Icon */}
                                        <div className="flex-shrink-0 mt-0.5">
                                            {q.isCorrect ? (
                                                <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {/* Question */}
                                            <div className="text-sm font-medium text-text-primary mb-1.5">
                                                {q.questionTitle}
                                            </div>

                                            {/* Answer */}
                                            {q.yourAnswer ? (
                                                <div className="text-xs mb-1">
                                                    <span className="text-text-muted">Ваш ответ: </span>
                                                    <span className={`font-medium ${q.isCorrect ? 'text-success' : 'text-error'}`}>
                                                        {q.yourAnswer}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-text-muted mb-1">Не отвечено</div>
                                            )}

                                            {/* Correct Answer (if wrong) */}
                                            {!q.isCorrect && (
                                                <div className="text-xs">
                                                    <span className="text-text-muted">Правильно: </span>
                                                    <span className="text-success font-medium">{q.correctAnswer}</span>
                                                </div>
                                            )}

                                            {/* Points Badge */}
                                            <div className="mt-1.5">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${q.isCorrect
                                                        ? 'bg-success/10 text-success'
                                                        : 'bg-error/10 text-error'
                                                    }`}>
                                                    {q.isCorrect && '+'}
                                                    {q.points}/{q.maxPoints}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Compact Stats Footer */}
                        <div className="border-t border-white/5 bg-background-elevated/50 px-4 py-3">
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                {/* Rank */}
                                <div className="text-center">
                                    <div className="text-xs text-text-muted mb-1">Место</div>
                                    <div className="flex items-center justify-center gap-1.5">
                                        <span className="text-2xl font-bold text-accent-orange">
                                            {currentRank}
                                        </span>
                                        {rankChange !== 0 && (
                                            <span className="flex items-center">
                                                {rankChange > 0 ? (
                                                    <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-4 h-4 text-error" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                                <span className={`text-sm font-bold ${rankChange > 0 ? 'text-success' : 'text-error'}`}>
                                                    {Math.abs(rankChange)}
                                                </span>
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-text-muted mt-0.5">из {totalPlayers}</div>
                                </div>

                                {/* Total Score */}
                                <div className="text-center">
                                    <div className="text-xs text-text-muted mb-1">Всего</div>
                                    <div className="text-2xl font-bold text-primary">
                                        {totalScore}
                                    </div>
                                    <div className="text-xs text-text-muted mt-0.5">очков</div>
                                </div>
                            </div>

                            {/* Continue Button */}
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                className="w-full bg-gradient-to-r from-primary to-accent-purple text-white font-bold text-base py-3 rounded-xl shadow-lg active:shadow-md transition-shadow"
                            >
                                ПРОДОЛЖИТЬ
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
