import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { socket } from '../../services/socket';
import { gameAPI } from '../../services/api';
import { Modal } from '../../components/common/Modal';
import { ProgressBar } from '../../components/game/ProgressBar';

export function GameControl() {
    const { gameId } = useParams();
    const navigate = useNavigate();

    const [game, setGame] = useState<any>(null);
    const [players, setPlayers] = useState<any[]>([]);
    const [progress, setProgress] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'controls' | 'rounds' | 'players'>('controls');

    const [selectedRoundIndex, setSelectedRoundIndex] = useState(0);
    const [playersCollapsed, setPlayersCollapsed] = useState(true);
    const [showAnswers, setShowAnswers] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);

    // New features state
    const [linkCopied, setLinkCopied] = useState(false);

    // Load game data from API
    useEffect(() => {
        if (!gameId) {
            navigate('/admin');
            return;
        }

        loadGameData();

        // Join the game room to receive socket updates (not as a player)
        socket.emit('admin:join_room', { gameId });

        // Socket.io listeners
        socket.on('round_started', ({ roundId }) => {
            console.log('Round started:', roundId);
            addHistoryEvent('round_start', `Раунд начат`);
            // No need to reload, game_state will follow
        });

        socket.on('round_locked', ({ roundId }) => {
            console.log('Round locked:', roundId);
            addHistoryEvent('round_lock', `Ввод ответов закрыт`);
            loadGameData(); // Reload to update button state
        });

        socket.on('answers_revealed', ({ roundId }) => {
            console.log('Answers revealed:', roundId);
            addHistoryEvent('answers_reveal', `Ответы показаны`);
            loadGameData();
        });

        socket.on('player_joined', ({ player }) => {
            setPlayers(prev => [...prev, player]);
            addHistoryEvent('player_join', `Игрок "${player.nickname}" присоединился`);
        });

        return () => {
            socket.off('round_started');
            socket.off('round_locked');
            socket.off('answers_revealed');
            socket.off('player_joined');
            socket.emit('admin:leave_room', { gameId });
        };
    }, [gameId, navigate]);

    // Listen for game reset
    useEffect(() => {
        socket.on('game_reset', () => {
            console.log('Game was reset');
            loadGameData();
        });

        return () => {
            socket.off('game_reset');
        };
    }, []);

    const loadGameData = async () => {
        try {
            const gameData = await gameAPI.getGameById(gameId!);
            setGame(gameData);

            // Set players from the game
            if (gameData.players) {
                setPlayers(gameData.players);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error loading game:', error);
            alert('Ошибка загрузки игры');
            navigate('/admin');
        }
    };

    // Handle socket game_state event
    useEffect(() => {
        socket.on('admin_game_state', (data) => {
            console.log('Received admin_game_state:', data);
            if (data.game) {
                setGame(data.game);
            }
            if (data.players) {
                setPlayers(data.players);
            }
            if (data.progress) {
                setProgress(data.progress);
            }
        });

        // Also listen to regular game_state but only if we haven't received admin state (fallback? No, better to ignore public state to avoid overwriting)
        // actually, we might receive game_state from other events if we are in the room.
        // We should explicitly IGNORE game_state here to prevent data loss (missing correctAnswers).

        return () => {
            socket.off('admin_game_state');
        };
    }, []);

    const handleStartRound = (roundId: string) => {
        socket.emit('admin:start_round', { roundId });
    };

    const handleLockRound = (roundId: string) => {
        socket.emit('admin:lock_round', { roundId });
    };

    const handleRevealAnswers = (roundId: string) => {
        socket.emit('admin:reveal_answers', { roundId });
    };

    const handleResetGame = () => {
        socket.emit('admin:reset_game', { gameId });
        setShowResetModal(false);
        addHistoryEvent('reset', 'Игра сброшена');
    };

    // Helper: Add event to history
    const addHistoryEvent = (type: string, message: string) => {
        setActionHistory(prev => [...prev, {
            timestamp: new Date(),
            type,
            message
        }].slice(-50)); // Keep last 50 events
    };

    // Helper: Copy join link to clipboard
    const handleCopyLink = async () => {
        const joinUrl = `${window.location.origin}/join?code=${game.roomCode}`;
        try {
            await navigator.clipboard.writeText(joinUrl);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            alert('Не удалось скопировать ссылку');
        }
    };

    if (loading || !game) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-text-secondary">Загрузка игры...</p>
                </div>
            </div>
        );
    }

    const currentRound = game.currentRound;
    const rounds = game.rounds || [];
    const controlledRound = rounds[selectedRoundIndex] || currentRound;

    // Helper for Big Button Logic
    const renderActionList = () => {
        if (!controlledRound) return <div className="text-center text-text-muted">Нет активного раунда</div>;

        const isGameFinished = game.status === 'FINISHED';
        const isLastRound = selectedRoundIndex === rounds.length - 1;

        // Game finished state
        if (isGameFinished) {
            return (
                <div className="space-y-3">
                    <div className="text-center p-6 bg-gradient-to-r from-success/10 to-info/10 border-2 border-success/30 rounded-xl">
                        <svg className="w-12 h-12 mx-auto mb-2 text-success" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                        </svg>
                        <h2 className="text-xl font-bold text-success mb-1">Игра завершена!</h2>
                        <p className="text-sm text-text-secondary">Все раунды пройдены</p>
                    </div>

                    <button
                        onClick={() => window.open(`/screen/${game.roomCode}`, '_blank')}
                        className="w-full bg-accent-purple text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span>Посмотреть результаты</span>
                    </button>

                    <button
                        onClick={() => setShowResetModal(true)}
                        className="w-full bg-primary text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Начать новую игру</span>
                    </button>
                </div>
            );
        }

        // Main control button based on state
        let buttonContent;
        switch (controlledRound.state) {
            case 'WAITING':
                buttonContent = (
                    <button
                        onClick={() => {
                            if (navigator.vibrate) navigator.vibrate(50);
                            handleStartRound(controlledRound.id);
                        }}
                        className="w-full h-32 rounded-xl bg-gradient-to-br from-primary to-accent-purple text-white text-2xl font-bold p-4 shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex flex-col items-center justify-center gap-2"
                    >
                        <span>СТАРТ</span>
                        <span className="text-sm font-normal opacity-90">Запустить раунд</span>
                    </button>
                );
                break;
            case 'ACTIVE':
                buttonContent = (
                    <button
                        onClick={() => {
                            if (navigator.vibrate) navigator.vibrate(50);
                            handleLockRound(controlledRound.id);
                        }}
                        className="w-full h-32 rounded-xl bg-warning text-black text-2xl font-bold p-4 shadow-lg hover:bg-warning/90 active:scale-95 transition-all flex flex-col items-center justify-center gap-2 animate-pulse-slow"
                    >
                        <span>СТОП</span>
                        <span className="text-sm font-normal opacity-80">Закрыть ввод</span>
                    </button>
                );
                break;
            case 'LOCKED':
                buttonContent = (
                    <button
                        onClick={() => {
                            if (navigator.vibrate) navigator.vibrate(50);
                            handleRevealAnswers(controlledRound.id);
                        }}
                        className="w-full h-32 rounded-xl bg-gradient-to-r from-accent-pink to-accent-orange text-white text-2xl font-bold p-4 shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex flex-col items-center justify-center gap-2"
                    >
                        <span>ПОКАЗАТЬ</span>
                        <span className="text-sm font-normal opacity-90">Показать ответы</span>
                    </button>
                );
                break;
            case 'REVEALED':
                buttonContent = !isLastRound ? (
                    <button
                        onClick={() => {
                            if (navigator.vibrate) navigator.vibrate(50);
                            setSelectedRoundIndex(selectedRoundIndex + 1);
                        }}
                        className="w-full h-32 rounded-xl border-2 border-dashed border-primary text-primary text-xl font-bold p-4 hover:bg-primary/10 active:scale-95 transition-all flex flex-col items-center justify-center gap-2"
                    >
                        <span>ДАЛЕЕ</span>
                        <span className="text-sm font-normal opacity-80">Следующий раунд</span>
                    </button>
                ) : (
                    <div className="text-center p-6 bg-success/10 border-2 border-success/30 rounded-xl">
                        <svg className="w-8 h-8 mx-auto mb-1 text-success" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div className="font-bold text-success">Раунд завершен</div>
                        <div className="text-xs text-text-muted mt-1">Это был последний раунд</div>
                    </div>
                );
                break;
            default:
                buttonContent = null;
        }

        return buttonContent;
    };


    const renderRoundsList = () => (
        <div className="space-y-3 pb-24">
            {rounds.map((round: any, index: number) => (
                <button
                    key={round.id}
                    onClick={() => {
                        setActiveTab('controls');
                        setSelectedRoundIndex(index);
                    }}
                    className={`w-full text-left p-4 rounded-xl transition-all border border-white/5 ${selectedRoundIndex === index
                        ? 'bg-primary text-white shadow-lg scale-[1.01] border-primary'
                        : 'bg-background-elevated text-text-secondary shadow-card'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-bold text-lg">Раунд {index + 1}</div>
                            <div className="text-sm opacity-80">{round.title}</div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-bold uppercase ${round.state === 'ACTIVE' ? 'bg-success text-black' :
                            round.state === 'LOCKED' ? 'bg-warning text-black' :
                                'bg-black/20'
                            }`}>
                            {round.state === 'WAITING' && 'Ожидание'}
                            {round.state === 'ACTIVE' && 'Активен'}
                            {round.state === 'LOCKED' && 'Закрыт'}
                            {round.state === 'REVEALED' && 'Раскрыто'}
                            {!['WAITING', 'ACTIVE', 'LOCKED', 'REVEALED'].includes(round.state) && round.state}
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );

    const renderPlayersList = () => (
        <div className="space-y-3 pb-24">
            <div className="bg-background-elevated border border-white/5 p-4 rounded-xl flex justify-between items-center mb-4 shadow-sm">
                <span className="text-text-muted">Всего игроков</span>
                <span className="text-2xl font-bold text-accent-teal">{players.length}</span>
            </div>

            {players.sort((a, b) => b.totalScore - a.totalScore).map((player, index) => (
                <div key={player.id} className="bg-background-elevated border border-white/5 p-4 rounded-xl flex items-center gap-4 shadow-sm">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${index === 0 ? 'bg-accent-orange text-black shadow-lg' :
                        index === 1 ? 'bg-gray-300 text-black' :
                            index === 2 ? 'bg-orange-700 text-white' :
                                'bg-header border border-text-muted/30 text-text-muted'
                        }`}>
                        {index + 1}
                    </div>
                    <div className="flex-1">
                        <div className="font-bold text-text-primary text-lg">{player.nickname}</div>
                        <div className="text-sm text-text-muted flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${player.isConnected ? 'bg-success' : 'bg-error'}`}></span>
                            {player.isConnected ? 'Онлайн' : 'Офлайн'}
                        </div>
                    </div>
                    <div className="text-xl font-bold text-primary">{player.totalScore}</div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-text-primary">

            {/* --- MOBILE VIEW (< md) --- */}
            <div className="md:hidden flex flex-col h-screen fixed inset-0 overflow-hidden">
                {/* Mobile Header - Compact */}
                <div className="bg-background-elevated border-b border-white/5 px-4 py-3 flex justify-between items-center shadow-lg z-20 shrink-0">
                    <div className="flex items-center gap-2">
                        <div>
                            <div className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Код комнаты</div>
                            <div className="text-2xl font-mono font-bold text-primary tracking-wider leading-none">{game.roomCode}</div>
                        </div>
                        <button
                            onClick={handleCopyLink}
                            className={`px-2 py-2 rounded-lg border transition-all text-xs font-semibold flex items-center gap-1.5 ${linkCopied
                                ? 'bg-success/20 text-success border-success/50'
                                : 'bg-primary/10 text-primary border-primary/50 active:bg-primary/20'}`}
                        >
                            {linkCopied ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                    </svg>
                                    <span className="hidden sm:inline">Скопировано</span>
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                                    </svg>
                                    <span className="hidden sm:inline">Ссылка</span>
                                </>
                            )}
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => window.open(`/screen/${game.roomCode}`, '_blank')}
                            className="bg-accent-purple text-white font-semibold px-3 py-2 rounded-lg text-xs active:scale-95 transition-all flex items-center gap-1.5"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.125c0 .621.504 1.125 1.125 1.125Z" />
                            </svg>
                            <span className="hidden xs:inline">QR-код</span>
                        </button>
                        <button
                            onClick={() => setShowResetModal(true)}
                            className="bg-background-hover text-text-muted px-3 py-2 rounded-lg border border-white/10 active:bg-white/10 active:text-white transition-colors text-xs font-semibold flex items-center gap-1.5"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                            <span className="hidden xs:inline">Сбросить</span>
                        </button>
                        <button
                            onClick={() => navigate('/admin')}
                            className="bg-background-hover px-3 py-2 rounded-lg text-text-muted active:text-white border border-white/10 text-xs font-semibold flex items-center gap-1"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                            </svg>
                            <span className="hidden xs:inline">Назад</span>
                        </button>
                    </div>
                </div>

                {/* Mobile Content - Scrollable area */}
                <div className="flex-1 overflow-y-auto w-full scrollbar-hide pb-20">
                    {activeTab === 'controls' && (
                        <div className="flex flex-col p-4 gap-4 min-h-full">
                            {/* Progress Bar (Mobile) */}
                            {progress && controlledRound?.state !== 'WAITING' && (
                                <div className="mb-2">
                                    <ProgressBar
                                        variant="admin"
                                        currentRound={progress.currentRound}
                                        totalRounds={progress.totalRounds}
                                        currentQuestion={progress.currentQuestion}
                                        totalQuestions={progress.totalQuestions}
                                    />
                                </div>
                            )}

                            {/* Round Info Card - Compact */}
                            <div className="bg-background-elevated p-4 rounded-xl border border-white/5 text-center shrink-0 shadow-sm">
                                <div className="text-xs text-text-muted uppercase mb-1">Активный раунд</div>
                                <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 leading-tight">
                                    {controlledRound?.title || 'Нет раунда'}
                                </div>
                                <div className="mt-2 flex justify-center gap-2">
                                    <span className="px-2 py-0.5 bg-black/30 rounded-full text-[10px] text-text-secondary">
                                        {controlledRound?.questions?.length || 0} вопросов
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${controlledRound?.state === 'ACTIVE' ? 'bg-success/20 text-success' :
                                        controlledRound?.state === 'LOCKED' ? 'bg-warning/20 text-warning' :
                                            controlledRound?.state === 'REVEALED' ? 'bg-info/20 text-info' :
                                                'bg-text-muted/20 text-text-muted'
                                        }`}>
                                        {controlledRound?.state === 'WAITING' && 'Ожидание'}
                                        {controlledRound?.state === 'ACTIVE' && 'Активен'}
                                        {controlledRound?.state === 'LOCKED' && 'Закрыт'}
                                        {controlledRound?.state === 'REVEALED' && 'Раскрыто'}
                                    </span>
                                </div>
                            </div>

                            {/* Copy Link Button - Always Visible */}
                            <button
                                onClick={handleCopyLink}
                                className={`w-full py-3 rounded-xl border-2 transition-all font-semibold text-sm flex items-center justify-center gap-2 ${linkCopied
                                    ? 'bg-success/20 text-success border-success/50'
                                    : 'bg-primary/10 text-primary border-primary/50 hover:bg-primary/20 active:scale-[0.98]'}`}
                            >
                                {linkCopied ? (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                        </svg>
                                        <span>Ссылка скопирована!</span>
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                                        </svg>
                                        <span>Скопировать ссылку для игроков</span>
                                    </>
                                )}
                            </button>

                            {/* Action List - Compact Controls */}
                            <div className="shrink-0">
                                {renderActionList()}
                            </div>

                            {/* Question Preview - Better list styling */}
                            {controlledRound?.questions && (
                                <div className="bg-background-elevated rounded-xl p-3 border border-white/5 shadow-inner">
                                    <div
                                        onClick={() => setShowAnswers(!showAnswers)}
                                        className="flex justify-between items-center px-1 cursor-pointer"
                                    >
                                        <div className="text-xs font-bold text-text-muted uppercase tracking-wider">
                                            Вопросы раунда
                                        </div>
                                        <button className="text-xs text-primary hover:text-white transition-colors">
                                            {showAnswers ? 'Скрыть' : 'Показать'}
                                        </button>
                                    </div>
                                    {showAnswers && (
                                        <div className="space-y-1.5 mt-2">
                                            {controlledRound.questions.map((q: any, i: number) => (
                                                <div key={i} className="flex gap-3 items-start p-3 rounded-lg bg-background-hover/50 border border-white/5">
                                                    <span className="text-text-muted font-mono text-xs">{i + 1}.</span>
                                                    <span className="text-sm text-text-secondary leading-snug">{q.title || q.correctAnswers?.[0]?.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Current Question Hint */}
                            {controlledRound?.state !== 'WAITING' && (
                                <div className="text-center text-xs text-text-muted/60 py-4">
                                    Отсканируйте QR на проекторе, чтобы подключиться
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'rounds' && (
                        <div className="p-4">
                            {renderRoundsList()}
                        </div>
                    )}
                    {activeTab === 'players' && (
                        <div className="p-4">
                            {renderPlayersList()}
                        </div>
                    )}
                </div>

                {/* Mobile Bottom Navigation - Improved sizing */}
                <div className="bg-background-elevated border-t border-white/5 fixed bottom-0 left-0 right-0 z-30 h-16 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
                    <div className="flex justify-around items-center h-full">
                        <button
                            onClick={() => setActiveTab('controls')}
                            className={`flex flex-col items-center gap-1 w-full h-full justify-center active:scale-95 transition-transform ${activeTab === 'controls' ? 'text-primary' : 'text-text-muted'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                            </svg>
                            <span className="text-[10px] font-bold uppercase tracking-wider">Пульт</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('rounds')}
                            className={`flex flex-col items-center gap-1 w-full h-full justify-center active:scale-95 transition-transform ${activeTab === 'rounds' ? 'text-primary' : 'text-text-muted'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 17.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                            </svg>
                            <span className="text-[10px] font-bold uppercase tracking-wider">Раунды</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('players')}
                            className={`flex flex-col items-center gap-1 w-full h-full justify-center active:scale-95 transition-transform ${activeTab === 'players' ? 'text-primary' : 'text-text-muted'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                            </svg>
                            <span className="text-[10px] font-bold uppercase tracking-wider">Игроки</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* --- DESKTOP VIEW (>= md) --- */}
            <div className="hidden md:block max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-display-md mb-2">{game.title || 'Управление игрой'}</h1>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-background-elevated px-4 py-2 rounded-lg border border-white/5">
                                <span className="text-text-secondary text-sm">
                                    Код комнаты:
                                </span>
                                <span className="font-mono font-bold text-primary text-lg">{game.roomCode}</span>
                                <button
                                    onClick={handleCopyLink}
                                    className={`p-1.5 rounded transition-all ${linkCopied
                                        ? 'bg-success/20 text-success'
                                        : 'hover:bg-white/10 text-text-muted hover:text-white'}`}
                                    title={linkCopied ? "Скопировано!" : "Скопировать ссылку"}
                                >
                                    {linkCopied ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <span className={`px-3 py-1 rounded-pill text-sm font-semibold ${game.status === 'ACTIVE' ? 'bg-success/20 text-success' :
                                game.status === 'LOBBY' ? 'bg-warning/20 text-warning' :
                                    'bg-text-muted/20 text-text-muted'
                                }`}>
                                {game.status === 'LOBBY' && 'В лобби'}
                                {game.status === 'ACTIVE' && 'Активна'}
                                {game.status === 'FINISHED' && 'Завершена'}
                                {!['LOBBY', 'ACTIVE', 'FINISHED'].includes(game.status) && game.status}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => window.open(`/screen/${game.roomCode}`, '_blank')}
                            className="bg-accent-purple hover:bg-accent-purple/80 text-white font-semibold px-6 py-3 rounded-button transition-all duration-200 active:scale-95"
                        >
                            QR-код и лидерборд
                        </button>
                        <button
                            onClick={() => setShowResetModal(true)}
                            className="bg-background-elevated hover:bg-error/10 text-text-primary hover:text-error font-semibold px-6 py-3 rounded-button border border-text-muted/20 hover:border-error/20 transition-all duration-200 active:scale-95 flex items-center gap-2"
                            title="Сброс прогресса"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                            <span className="hidden xl:inline">Сбросить</span>
                        </button>
                        <button onClick={() => navigate('/admin')} className="button-secondary">
                            ← К списку игр
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Round Control */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Round Selector */}
                        <div className="card-primary">
                            <h2 className="text-heading-md mb-4">Раунды</h2>
                            <div className="space-y-2">
                                {rounds.map((round: any, index: number) => (
                                    <button
                                        key={round.id}
                                        onClick={() => setSelectedRoundIndex(index)}
                                        className={`w-full text-left p-4 rounded-lg transition-colors ${selectedRoundIndex === index
                                            ? 'bg-primary/20 border-2 border-primary'
                                            : 'bg-background-hover hover:bg-background-hover/80'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-semibold text-text-primary">
                                                    Раунд {index + 1}: {round.title}
                                                </div>
                                                <div className="text-sm text-text-muted">
                                                    {round.questions.length} фильмов
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-pill text-xs font-semibold ${round.state === 'ACTIVE' ? 'bg-success/20 text-success' :
                                                round.state === 'LOCKED' ? 'bg-warning/20 text-warning' :
                                                    round.state === 'REVEALED' ? 'bg-info/20 text-info' :
                                                        'bg-text-muted/20 text-text-muted'
                                                }`}>
                                                {round.state === 'WAITING' && 'Ожидание'}
                                                {round.state === 'ACTIVE' && 'Активен'}
                                                {round.state === 'LOCKED' && 'Закрыт'}
                                                {round.state === 'REVEALED' && 'Раскрыто'}
                                                {!['WAITING', 'ACTIVE', 'LOCKED', 'REVEALED'].includes(round.state) && round.state}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Current Round Control */}
                        {controlledRound && (
                            <div className="card-primary">
                                {/* Progress Bar (Desktop) */}
                                {progress && controlledRound.state !== 'WAITING' && (
                                    <div className="mb-6">
                                        <ProgressBar
                                            variant="admin"
                                            currentRound={progress.currentRound}
                                            totalRounds={progress.totalRounds}
                                            currentQuestion={progress.currentQuestion}
                                            totalQuestions={progress.totalQuestions}
                                        />
                                    </div>
                                )}

                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-heading-md">Управление раундом</h2>
                                    <div className={`px-3 py-1 rounded-pill text-xs font-bold uppercase ${controlledRound.state === 'ACTIVE' ? 'bg-success/20 text-success border border-success/30' :
                                        controlledRound.state === 'LOCKED' ? 'bg-warning/20 text-warning border border-warning/30' :
                                            controlledRound.state === 'REVEALED' ? 'bg-info/20 text-info border border-info/30' :
                                                'bg-black/20 text-text-muted'
                                        }`}>
                                        {controlledRound.state === 'WAITING' && 'Ожидание'}
                                        {controlledRound.state === 'ACTIVE' && 'Ввод активен'}
                                        {controlledRound.state === 'LOCKED' && 'Ввод закрыт'}
                                        {controlledRound.state === 'REVEALED' && 'Раскрыто'}
                                    </div>
                                </div>

                                {/* Control Buttons */}
                                <div className="space-y-3">
                                    {controlledRound.state === 'WAITING' && (
                                        <button
                                            onClick={() => handleStartRound(controlledRound.id)}
                                            className="button-primary w-full py-4 text-lg"
                                        >
                                            Запустить раунд
                                        </button>
                                    )}

                                    {controlledRound.state === 'ACTIVE' && (
                                        <button
                                            onClick={() => handleLockRound(controlledRound.id)}
                                            className="bg-warning hover:bg-warning/80 text-black font-semibold px-6 py-4 rounded-button transition-all duration-200 active:scale-95 w-full text-lg"
                                        >
                                            Закрыть ввод
                                        </button>
                                    )}

                                    {controlledRound.state === 'LOCKED' && (
                                        <button
                                            onClick={() => handleRevealAnswers(controlledRound.id)}
                                            className="bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold px-6 py-4 rounded-button transition-all duration-200 active:scale-95 w-full text-lg"
                                        >
                                            Показать правильные ответы
                                        </button>
                                    )}

                                    {controlledRound.state === 'REVEALED' && (
                                        <button
                                            onClick={() => {
                                                if (selectedRoundIndex < rounds.length - 1) {
                                                    setSelectedRoundIndex(selectedRoundIndex + 1);
                                                }
                                            }}
                                            className="bg-success hover:bg-success/80 text-white font-semibold px-6 py-4 rounded-button transition-all duration-200 active:scale-95 w-full text-lg"
                                        >
                                            → Следующий раунд
                                        </button>
                                    )}
                                </div>

                                {/* Questions Preview */}
                                <div className="mt-6 pt-6 border-t border-background-hover">
                                    <div
                                        onClick={() => setShowAnswers(!showAnswers)}
                                        className="flex justify-between items-center cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors -mx-2 mb-2"
                                    >
                                        <div className="text-sm font-semibold text-text-secondary">
                                            Фильмы в раунде ({controlledRound.questions?.length || 0})
                                        </div>
                                        <button className="text-sm text-primary hover:text-white transition-colors">
                                            {showAnswers ? 'Скрыть' : 'Показать'}
                                        </button>
                                    </div>

                                    {showAnswers && (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {controlledRound.questions?.map((q: any, i: number) => (
                                                <div key={i} className="text-sm bg-background-hover px-3 py-2 rounded">
                                                    <span className="text-text-muted mr-2">{i + 1}.</span>
                                                    <span>{q.title || q.correctAnswers?.[0]?.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Players & Leaderboard */}
                    <div className="space-y-6">
                        {/* Consolidated Players & Ranking */}
                        <div className="card-primary">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-heading-md">Рейтинг игроков</h2>
                                    <span className="bg-primary/20 text-primary px-3 py-1 rounded-pill text-sm font-bold">
                                        {players.length}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {players
                                    .sort((a, b) => b.totalScore - a.totalScore)
                                    .slice(0, playersCollapsed ? 5 : players.length)
                                    .map((player, index) => (
                                        <motion.div
                                            key={player.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="flex items-center gap-4 p-3 bg-background-hover rounded-xl border border-white/5 hover:border-primary/30 transition-all group"
                                        >
                                            {/* Rank Indicator */}
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 bg-black/20 text-text-muted border border-white/5">
                                                {index + 1}
                                            </div>

                                            {/* Nickname & Status */}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-text-primary truncate group-hover:text-primary transition-colors">
                                                    {player.nickname}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${player.isConnected ? 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-error'}`}></span>
                                                    <span className={player.isConnected ? 'text-success' : 'text-error'}>
                                                        {player.isConnected ? 'В сети' : 'Офлайн'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Score */}
                                            <div className="text-right shrink-0">
                                                <div className="text-xl font-black text-primary leading-none">{player.totalScore}</div>
                                                <div className="text-[10px] text-text-muted font-bold uppercase">очков</div>
                                            </div>
                                        </motion.div>
                                    ))}

                                {players.length > 5 && (
                                    <button
                                        onClick={() => setPlayersCollapsed(!playersCollapsed)}
                                        className="w-full py-3 mt-2 text-sm font-bold text-text-muted hover:text-primary hover:bg-primary/10 rounded-xl transition-all border border-dashed border-white/10 hover:border-primary/30"
                                    >
                                        {playersCollapsed ? `Показать всех (${players.length}) ▼` : 'Скрыть ▲'}
                                    </button>
                                )}

                                {players.length === 0 && (
                                    <div className="text-center py-12 px-6 bg-black/10 rounded-xl border border-dashed border-white/5">
                                        <div className="text-4xl mb-3 opacity-20 font-bold text-text-muted">?</div>
                                        <p className="text-text-muted text-sm">Ожидание игроков...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reset Confirmation Modal */}
            <Modal
                isOpen={showResetModal}
                onClose={() => setShowResetModal(false)}
                onConfirm={handleResetGame}
                title="Сбросить игру?"
                message="Это удалит все ответы, обнулит очки и вернет игру в самое начало (Лобби). Это действие нельзя будет отменить."
                confirmText="Да, сбросить"
                cancelText="Отмена"
                type="danger"
            />
        </div>
    );
}
