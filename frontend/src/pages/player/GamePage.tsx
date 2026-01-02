import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../../hooks/useGameStore';
import { useSocket } from '../../hooks/useSocket';
import { QuestionInput } from '../../components/game/QuestionInput';
import { socket } from '../../services/socket';
import { ProgressBar } from '../../components/game/ProgressBar';
import { PlayerHistoryModal } from '../../components/game/PlayerHistoryModal';
import { RoundTransition } from '../../components/game/RoundTransition';
import { RoundResultsModal } from '../../components/game/RoundResultsModal';
import { FinalLeaderboardModal } from '../../components/game/FinalLeaderboardModal';

export function GamePage() {
    const navigate = useNavigate();
    const { game, playerId, playerNickname, progress, answeredQuestionIds } = useGameStore();
    const { submitAnswer } = useSocket();

    const [submittedAnswers, setSubmittedAnswers] = useState<Set<string>>(new Set());
    const [showHistory, setShowHistory] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    // Round transition state
    const [showRoundTransition, setShowRoundTransition] = useState(false);
    const [transitionData, setTransitionData] = useState<any>(null);

    // Round results state
    const [showRoundResults, setShowRoundResults] = useState(false);
    const [resultsData, setResultsData] = useState<any>(null);

    // Final leaderboard state
    const [showFinalLeaderboard, setShowFinalLeaderboard] = useState(false);
    const [finalLeaderboardData, setFinalLeaderboardData] = useState<any>(null);

    const currentRound = game?.currentRound;
    const questions = currentRound?.questions || [];
    const roundState = currentRound?.state;

    // Give time for reconnection to load data
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsInitializing(false);
        }, 3000); // Wait 3 seconds for reconnection (increased from 1s)

        return () => clearTimeout(timer);
    }, []);

    // Sync answeredQuestionIds from store to local state
    useEffect(() => {
        if (answeredQuestionIds.length > 0) {
            setSubmittedAnswers(new Set(answeredQuestionIds));
            console.log('✅ Synced submitted answers from store:', answeredQuestionIds.length);
        }
    }, [answeredQuestionIds]);

    // Listen for round transitions and results
    useEffect(() => {
        const handleRoundStarted = (data: any) => {
            console.log('Round started event:', data);
            // Show transition modal
            setTransitionData(data);
            setShowRoundTransition(true);
        };

        const handleAnswersRevealed = (data: any) => {
            console.log('Answers revealed event:', data);
            // Show results modal
            setResultsData(data);
            setShowRoundResults(true);
        };

        socket.on('round_started', handleRoundStarted);
        socket.on('answers_revealed', handleAnswersRevealed);

        return () => {
            socket.off('round_started', handleRoundStarted);
            socket.off('answers_revealed', handleAnswersRevealed);
        };
    }, []);

    useEffect(() => {
        // Don't redirect while initializing (reconnection may be in progress)
        if (isInitializing) return;

        // Check localStorage for saved session
        const savedPlayerId = localStorage.getItem('quiz_player_id');
        const savedGameId = localStorage.getItem('quiz_game_id');

        // If no game/player but we have saved data, wait for reconnection
        if ((!game || !playerId) && savedPlayerId && savedGameId) {
            console.log('Waiting for reconnection...');
            return; // Don't redirect yet
        }

        // If truly no game/player data, redirect to join
        if (!game || !playerId) {
            navigate('/join');
            return;
        }

        if (game.status === 'LOBBY') {
            navigate('/lobby');
        }
    }, [game, playerId, navigate, isInitializing]);

    const handleSubmitAnswer = (questionId: string, tmdbId: number, text: string) => {
        if (!playerId) return;

        submitAnswer(playerId, questionId, tmdbId, text);
        setSubmittedAnswers((prev) => new Set(prev).add(questionId));
    };

    if (!game || !currentRound) {
        return null;
    }

    const isInputDisabled = roundState !== 'ACTIVE';

    return (
        <div className="min-h-screen p-4 pb-20">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                >
                    {/* Player Info & Room Code */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                                <span className="text-text-secondary text-xs">Игрок:</span>
                                <span className="text-white text-sm font-mono tracking-widest">{playerNickname}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                                <span className="text-text-secondary text-xs">Код:</span>
                                <span className="text-white text-sm font-mono tracking-widest">{game?.roomCode}</span>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {progress && (
                        <div className="mb-4">
                            <ProgressBar
                                currentRound={progress.currentRound}
                                totalRounds={progress.totalRounds}
                                currentQuestion={progress.currentQuestion}
                                totalQuestions={progress.totalQuestions}
                            />
                        </div>
                    )}

                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-heading-lg">{currentRound.title}</h1>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowHistory(true)}
                                className="p-2 bg-background-elevated rounded-full hover:bg-background-hover transition-colors border border-white/5"
                                title="История ответов"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-text-secondary">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                </svg>
                            </button>

                            <div
                                className={`px-4 py-2 rounded-pill font-semibold ${roundState === 'ACTIVE'
                                    ? 'bg-success/20 text-success'
                                    : roundState === 'LOCKED'
                                        ? 'bg-warning/20 text-warning'
                                        : roundState === 'REVEALED'
                                            ? 'bg-info/20 text-info'
                                            : 'bg-text-muted/20 text-text-muted'
                                    }`}
                            >
                                {roundState === 'ACTIVE' && 'Активен'}
                                {roundState === 'LOCKED' && 'Ввод закрыт'}
                                {roundState === 'REVEALED' && 'Раскрыто'}
                                {roundState === 'WAITING' && 'Ожидание'}
                            </div>
                        </div>
                    </div>
                    <p className="text-text-secondary">
                        Угадайте фильмы и сериалы, показанные на экране
                    </p>
                </motion.div>

                {/* Questions */}
                <div className="space-y-4">
                    {questions.map((question, index) => (
                        <motion.div
                            key={question.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div className="bg-background-elevated border border-white/5 rounded-xl p-4 shadow-sm hover:border-primary/30 transition-all group">
                                <div className="mb-2 flex items-center gap-2">
                                    <span className="text-primary/80 font-medium text-sm bg-primary/10 px-2 py-0.5 rounded-md group-hover:bg-primary/20 transition-colors">
                                        Вопрос {question.orderIndex + 1}
                                    </span>
                                </div>

                                <QuestionInput
                                    onSubmit={(tmdbId, text) => handleSubmitAnswer(question.id, tmdbId, text)}
                                    disabled={isInputDisabled}
                                    submitted={submittedAnswers.has(question.id)}
                                />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Status Messages */}
                {roundState === 'LOCKED' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-4 bg-warning/10 border border-warning/40 rounded-lg text-center"
                    >
                        <p className="text-warning font-semibold">
                            Ввод закрыт. Ожидание результатов...
                        </p>
                    </motion.div>
                )}

                {roundState === 'REVEALED' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-4 bg-info/10 border border-info/40 rounded-lg text-center"
                    >
                        <p className="text-info font-semibold">
                            Раунд завершен! Смотрите результаты на экране.
                        </p>
                    </motion.div>
                )}

                {/* Tips */}
                {roundState === 'ACTIVE' && (
                    <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                        <p className="text-sm text-text-secondary">
                            <strong>Совет:</strong> Начните вводить название фильма или сериала, и появится список вариантов. Выберите правильный вариант из списка.
                        </p>
                    </div>
                )}
            </div>

            <PlayerHistoryModal
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
            />

            {/* Round Transition Modal */}
            {transitionData && (
                <RoundTransition
                    show={showRoundTransition}
                    roundNumber={transitionData.roundNumber || 1}
                    roundTitle={transitionData.roundTitle || currentRound?.title || ''}
                    playerScore={transitionData.playerScore || 0}
                    playerRank={transitionData.playerRank || 1}
                    totalPlayers={transitionData.totalPlayers || 1}
                    onClose={() => setShowRoundTransition(false)}
                />
            )}

            {/* Round Results Modal */}
            {resultsData && (
                <RoundResultsModal
                    show={showRoundResults}
                    roundNumber={resultsData.roundNumber || 1}
                    roundTitle={resultsData.roundTitle || currentRound?.title || ''}
                    questions={resultsData.questions || []}
                    totalEarned={resultsData.totalEarned || 0}
                    totalPossible={resultsData.totalPossible || 0}
                    currentRank={resultsData.currentRank || 1}
                    rankChange={resultsData.rankChange || 0}
                    totalScore={resultsData.totalScore || 0}
                    totalPlayers={resultsData.totalPlayers || 1}
                    onClose={() => {
                        setShowRoundResults(false);
                        // If this was the last round, show final leaderboard
                        if (resultsData.isLastRound) {
                            setFinalLeaderboardData({
                                players: resultsData.leaderboard || [],
                                yourRank: resultsData.currentRank || 1,
                                yourScore: resultsData.totalScore || 0
                            });
                            setShowFinalLeaderboard(true);
                        }
                    }}
                />
            )}

            {/* Final Leaderboard Modal */}
            {finalLeaderboardData && (
                <FinalLeaderboardModal
                    show={showFinalLeaderboard}
                    players={finalLeaderboardData.players}
                    yourRank={finalLeaderboardData.yourRank}
                    yourScore={finalLeaderboardData.yourScore}
                    onClose={() => setShowFinalLeaderboard(false)}
                />
            )}
        </div>
    );
}
