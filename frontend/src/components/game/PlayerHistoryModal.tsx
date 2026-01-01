import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gameAPI } from '../../services/api';
import { useGameStore } from '../../hooks/useGameStore';

interface PlayerHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PlayerHistoryModal({ isOpen, onClose }: PlayerHistoryModalProps) {
    const { playerId } = useGameStore();
    const [answers, setAnswers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && playerId) {
            setLoading(true);
            gameAPI.getPlayerAnswers(playerId)
                .then(data => {
                    console.log('Answers loaded:', data);
                    setAnswers(data);
                })
                .catch(err => console.error('Failed to load answers:', err))
                .finally(() => setLoading(false));
        }
    }, [isOpen, playerId]);

    if (!isOpen) return null;

    // Group answers by round
    const answersByRound = answers.reduce((acc: Record<string, any[]>, answer) => {
        const roundTitle = answer.question.round.title;
        const roundOrder = answer.question.round.orderIndex;
        const key = `${roundOrder}:::${roundTitle}`; // Combine to sort later
        if (!acc[key]) acc[key] = [];
        acc[key].push(answer);
        return acc;
    }, {});

    // Sort rounds by index
    const sortedRoundKeys = Object.keys(answersByRound).sort((a, b) => {
        const [indexA] = a.split(':::');
        const [indexB] = b.split(':::');
        return parseInt(indexA) - parseInt(indexB);
    });

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed inset-x-0 bottom-0 top-20 md:top-auto md:inset-0 md:flex md:items-center md:justify-center z-50 pointer-events-none"
                    >
                        <div className="bg-background-elevated w-full h-full md:h-auto md:max-h-[80vh] md:w-[600px] md:rounded-2xl flex flex-col pointer-events-auto border-t md:border border-white/10 shadow-2xl">
                            {/* Header */}
                            <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
                                <h2 className="text-xl font-bold text-text-primary">История ответов</h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/5 rounded-full transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-text-muted">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center h-48 space-y-4">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                        <p className="text-text-muted">Загрузка истории...</p>
                                    </div>
                                ) : answers.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="text-4xl mb-4 opacity-30">📜</div>
                                        <p className="text-text-secondary mb-2">История пуста</p>
                                        <p className="text-sm text-text-muted">Вы пока не дали ни одного ответа</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {sortedRoundKeys.map((key) => {
                                            const [_, roundTitle] = key.split(':::');
                                            const roundAnswers = answersByRound[key];

                                            return (
                                                <div key={key} className="space-y-3">
                                                    <div className="sticky top-0 bg-background-elevated/95 backdrop-blur py-2 z-10 border-b border-white/5">
                                                        <h3 className="text-sm font-bold text-primary uppercase tracking-wider">{roundTitle}</h3>
                                                    </div>

                                                    <div className="space-y-2">
                                                        {roundAnswers.map((answer) => (
                                                            <div
                                                                key={answer.id}
                                                                className={`p-3 rounded-xl border ${answer.isCorrect === true
                                                                        ? 'bg-success/5 border-success/20'
                                                                        : answer.isCorrect === false
                                                                            ? 'bg-error/5 border-error/20'
                                                                            : 'bg-background hover:bg-background-hover border-white/5'
                                                                    }`}
                                                            >
                                                                <div className="flex justify-between items-start gap-3 mb-1">
                                                                    <div className="font-semibold text-text-primary text-sm line-clamp-2">
                                                                        {answer.question.title}
                                                                    </div>
                                                                    <div className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${answer.isCorrect === true ? 'bg-success text-black' :
                                                                        answer.isCorrect === false ? 'bg-white/10 text-text-muted' :
                                                                            'bg-primary/20 text-primary'
                                                                        }`}>
                                                                        {answer.isCorrect === true ? `+${answer.pointsEarned}` :
                                                                            answer.isCorrect === false ? '0' : '?'}
                                                                    </div>
                                                                </div>

                                                                <div className="text-xs space-y-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-text-muted w-16 shrink-0">Ваш ответ:</span>
                                                                        <span className={`font-medium ${answer.isCorrect === true ? 'text-success' :
                                                                            answer.isCorrect === false ? 'text-error' : 'text-text-primary'
                                                                            }`}>
                                                                            {answer.submittedText}
                                                                        </span>
                                                                    </div>

                                                                    {/* Only show correct answer if we know it based on isCorrect */}
                                                                    {answer.isCorrect === false && (
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-text-muted w-16 shrink-0">Верно:</span>
                                                                            <span className="text-text-secondary">{answer.question.title}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Summary Footer */}
                            {!loading && answers.length > 0 && (
                                <div className="p-4 border-t border-white/5 bg-background/50 text-center text-sm text-text-secondary">
                                    Всего ответов: <span className="font-bold text-white">{answers.length}</span> •
                                    Верных: <span className="font-bold text-success">{answers.filter(a => a.isCorrect).length}</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
