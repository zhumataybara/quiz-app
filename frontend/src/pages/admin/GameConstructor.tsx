import { useState, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTMDBSearch } from '../../hooks/useTMDBSearch';
import { gameAPI } from '../../services/api';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function getDeclension(number: number, titles: string[]) {
    const cases = [2, 0, 1, 1, 1, 2];
    return titles[
        (number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]
    ];
}

interface Movie {
    id: number;
    title: string;
    originalTitle: string;
    year: number | null;
    posterPath: string | null;
    mediaType: 'movie' | 'tv';
}

interface Question {
    points: number;
    correctAnswers: Array<{
        tmdbId: number;
        title: string;
        originalTitle: string;
        year: number | null;
        posterPath: string | null;
        mediaType: 'movie' | 'tv';
    }>;
}

interface Round {
    id?: string;
    title: string;
    videoUrl: string;
    questions: Question[];
}

// Sortable Movie Card Component - Memoized to prevent unnecessary re-renders
const SortableMovieCard = memo(function SortableMovieCard({ question, index, onRemove, onAddAnswer, onRemoveAnswer }: {
    question: Question;
    index: number;
    onRemove: () => void;
    onAddAnswer: (questionIndex: number) => void;
    onRemoveAnswer: (questionIndex: number, answerIndex: number) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: `question-${index}` });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const answerCount = question.correctAnswers.length;
    const [expanded, setExpanded] = useState(answerCount > 1);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-background-hover p-3 rounded-lg relative group transition-all duration-200 ${isDragging ? 'z-50 shadow-2xl cursor-grabbing scale-105' : 'hover:shadow-lg'
                }`}
        >
            {/* Number Badge - Draggable */}
            <div
                {...attributes}
                {...listeners}
                className="absolute top-2 left-2 w-7 h-7 bg-primary rounded-full flex items-center justify-center font-bold text-sm z-10 cursor-grab active:cursor-grabbing shadow-lg"
                title="Перетащите для изменения порядка"
            >
                {index + 1}
            </div>

            {/* Remove Question Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                }}
                className="absolute top-2 right-2 w-7 h-7 bg-error/90 hover:bg-error text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 shadow-lg active:scale-90"
                title="Удалить вопрос"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
            </button>

            {/* Poster Image */}
            <div className="relative mt-8 rounded overflow-hidden group/poster">
                {question.correctAnswers[0]?.posterPath ? (
                    <img
                        src={`https://image.tmdb.org/t/p/w342${question.correctAnswers[0].posterPath}`}
                        alt={question.correctAnswers[0].title}
                        className="w-full h-40 object-cover transition-transform group-hover/poster:scale-105"
                    />
                ) : (
                    <div className="w-full h-40 bg-background rounded flex items-center justify-center text-text-muted text-xs">
                        Нет постера
                    </div>
                )}

                {/* Multiple Answers Indicator Overlay */}
                {answerCount > 1 && (
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            setExpanded(!expanded);
                        }}
                        className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-2 pt-8 cursor-pointer hover:from-primary/90 transition-colors flex justify-end"
                    >
                        <div className="flex items-center gap-1.5 text-xs font-bold text-white bg-white/20 backdrop-blur-md px-2 py-1 rounded-md">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`}>
                                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                            </svg>
                            {answerCount} варианта
                        </div>
                    </div>
                )}
            </div>

            {/* Title and Info */}
            <div className="mt-3 space-y-1">
                <div className="flex items-center gap-2">
                    <div className="text-sm font-bold text-text-primary truncate flex-1" title={question.correctAnswers[0]?.title}>
                        {question.correctAnswers[0]?.title}
                    </div>
                </div>
                <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>{question.correctAnswers[0]?.year}</span>
                    <span className="bg-white/5 px-1.5 rounded uppercase tracking-wider text-[10px]">
                        {question.correctAnswers[0]?.mediaType === 'movie' ? 'Фильм' : 'Сериал'}
                    </span>
                </div>
            </div>

            {/* Expanded Answers List */}
            <div className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${expanded ? 'grid-rows-[1fr] mt-3' : 'grid-rows-[0fr] mt-0'}`}>
                <div className="overflow-hidden">
                    <div className="space-y-1.5 pt-2 border-t border-white/5">
                        {question.correctAnswers.slice(1).map((answer, answerIndex) => (
                            <div
                                key={answerIndex + 1}
                                className="flex gap-2 items-center bg-background-elevated p-1.5 rounded pr-2 group/answer"
                            >
                                {/* Mini Poster */}
                                <div className="w-8 h-12 flex-shrink-0 bg-background rounded overflow-hidden">
                                    {answer.posterPath && (
                                        <img
                                            src={`https://image.tmdb.org/t/p/w92${answer.posterPath}`}
                                            alt={answer.title}
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-semibold text-text-primary truncate" title={answer.title}>
                                        {answer.title}
                                    </div>
                                    <div className="text-[10px] text-text-muted">{answer.year}</div>
                                </div>

                                {/* Remove Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveAnswer(index, answerIndex + 1);
                                    }}
                                    className="w-5 h-5 flex items-center justify-center text-text-muted hover:text-error hover:bg-error/10 rounded transition-colors opacity-0 group-hover/answer:opacity-100"
                                    title="Удалить вариант"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                    </svg>
                                </button>
                            </div>
                        ))}


                    </div>
                </div>
            </div>

            {/* Add Answer Button - Always Visible */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onAddAnswer(index);
                }}
                className={`w-full py-1.5 text-xs text-primary/70 hover:text-primary hover:bg-primary/5 border border-dashed border-primary/20 hover:border-primary/50 rounded transition-all flex items-center justify-center gap-1.5 mt-2 ${expanded ? '' : 'border-t border-white/5 pt-2'}`}
                title="Добавить альтернативный правильный ответ"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
                Добавить вариант
            </button>
        </div>
    );
});

export function GameConstructor() {
    const navigate = useNavigate();
    const { gameId } = useParams(); // Get gameId from URL
    const isEditing = !!gameId;

    const [loading, setLoading] = useState(isEditing);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [gameTitle, setGameTitle] = useState(() => {
        if (isEditing) return ''; // Will be populated from API
        return localStorage.getItem('game_constructor_title') || '';
    });

    const [rounds, setRounds] = useState<Round[]>(() => {
        if (isEditing) return []; // Will be populated from API
        const saved = localStorage.getItem('game_constructor_rounds');
        return saved ? JSON.parse(saved) : [];
    });

    const [currentRound, setCurrentRound] = useState<Round>(() => {
        if (isEditing) return { title: '', videoUrl: '', questions: [] }; // Reset for editing
        const saved = localStorage.getItem('game_constructor_current_round');
        return saved ? JSON.parse(saved) : { title: '', videoUrl: '', questions: [] };
    });

    // Load game data if editing
    useEffect(() => {
        if (gameId) {
            setLoading(true);
            gameAPI.getGameById(gameId).then((game) => {
                setGameTitle(game.title);
                // Map API rounds to local state
                const mappedRounds = game.rounds.map((r: any) => ({
                    title: r.title,
                    videoUrl: r.videoUrl || '',
                    questions: r.questions.map((q: any) => ({
                        points: q.points || 1,
                        correctAnswers: q.correctAnswers || (q.tmdbId ? [
                            {
                                tmdbId: q.tmdbId,
                                title: q.title,
                                originalTitle: q.originalTitle || q.title,
                                year: q.year,
                                posterPath: q.posterPath,
                                mediaType: q.tmdbType || 'movie'
                            }
                        ] : [])
                    }))
                }));
                setRounds(mappedRounds);
                setLoading(false);
            }).catch(err => {
                console.error('Failed to load game:', err);
                alert('Ошибка при загрузке игры');
                navigate('/admin');
            });
        }
    }, [gameId, navigate]);

    const [movieQuery, setMovieQuery] = useState('');
    const [showMovieSearch, setShowMovieSearch] = useState(false);
    const [editingRoundIndex, setEditingRoundIndex] = useState<number | null>(() => {
        if (isEditing) return null; // Don't load from localStorage when editing a game
        const saved = localStorage.getItem('game_constructor_editing_index');
        return saved ? parseInt(saved, 10) : null;
    });
    const { results: movieResults } = useTMDBSearch(movieQuery);

    // State for editing answers
    const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);

    // Save to localStorage on changes
    useEffect(() => {
        localStorage.setItem('game_constructor_title', gameTitle);
    }, [gameTitle]);

    useEffect(() => {
        localStorage.setItem('game_constructor_rounds', JSON.stringify(rounds));
    }, [rounds]);

    useEffect(() => {
        localStorage.setItem('game_constructor_current_round', JSON.stringify(currentRound));
    }, [currentRound]);

    useEffect(() => {
        if (editingRoundIndex !== null) {
            localStorage.setItem('game_constructor_editing_index', editingRoundIndex.toString());
        } else {
            localStorage.removeItem('game_constructor_editing_index');
        }
    }, [editingRoundIndex]);

    // Migrate old rounds without IDs (only once)
    const [migrated, setMigrated] = useState(false);
    useEffect(() => {
        if (migrated) return;

        const needsMigration = rounds.some(r => !r.id);
        if (needsMigration) {
            const migratedRounds = rounds.map(r => ({
                ...r,
                id: r.id || `round-${Date.now()}-${Math.random()}`
            }));
            setRounds(migratedRounds);
            setMigrated(true);
        }
    }, [rounds, migrated]);

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-xl text-text-primary">Загрузка игры...</div>
            </div>
        );
    }



    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = currentRound.questions.findIndex((q, idx) => `question-${idx}` === active.id);
            const newIndex = currentRound.questions.findIndex((q, idx) => `question-${idx}` === over.id);

            setCurrentRound({
                ...currentRound,
                questions: arrayMove(currentRound.questions, oldIndex, newIndex),
            });
        }
    };

    const handleAddMovie = (movie: Movie) => {
        // If editing an existing question, add to its answers
        if (editingQuestionIndex !== null) {
            const updatedQuestions = [...currentRound.questions];
            const question = updatedQuestions[editingQuestionIndex];

            // Check if this movie is already in the answers
            if (question.correctAnswers.some(a => a.tmdbId === movie.id)) {
                alert('Этот фильм уже добавлен как правильный ответ!');
                return;
            }

            updatedQuestions[editingQuestionIndex] = {
                ...question,
                correctAnswers: [...question.correctAnswers, {
                    tmdbId: movie.id,
                    title: movie.title,
                    originalTitle: movie.originalTitle,
                    year: movie.year,
                    posterPath: movie.posterPath,
                    mediaType: movie.mediaType
                }]
            };

            setCurrentRound({
                ...currentRound,
                questions: updatedQuestions
            });

            setEditingQuestionIndex(null);
            setMovieQuery('');
            setShowMovieSearch(false);
        } else {
            // Create new question
            const newQuestion: Question = {
                points: 1,
                correctAnswers: [{
                    tmdbId: movie.id,
                    title: movie.title,
                    originalTitle: movie.originalTitle,
                    year: movie.year,
                    posterPath: movie.posterPath,
                    mediaType: movie.mediaType
                }]
            };

            setCurrentRound({
                ...currentRound,
                questions: [...currentRound.questions, newQuestion]
            });

            setMovieQuery('');
            setShowMovieSearch(false);
        }
    };

    const handleRemoveMovie = (index: number) => {
        setCurrentRound({
            ...currentRound,
            questions: currentRound.questions.filter((_, i) => i !== index)
        });
    };

    // Add alternative answer to existing question
    const handleAddAlternativeAnswer = (questionIndex: number) => {
        setEditingQuestionIndex(questionIndex);
        setShowMovieSearch(true);
    };

    // Remove answer from question (minimum 1 required)
    const handleRemoveAnswer = (questionIndex: number, answerIndex: number) => {
        const question = currentRound.questions[questionIndex];
        if (question.correctAnswers.length <= 1) {
            alert('Вопрос должен содержать хотя бы один правильный ответ!');
            return;
        }

        const updatedQuestions = [...currentRound.questions];
        updatedQuestions[questionIndex] = {
            ...question,
            correctAnswers: question.correctAnswers.filter((_, i) => i !== answerIndex)
        };

        setCurrentRound({
            ...currentRound,
            questions: updatedQuestions
        });
    };

    const handleAddRound = () => {
        if (!currentRound.title.trim() || currentRound.questions.length === 0) {
            alert('Заполните название раунда и добавьте хотя бы один фильм');
            return;
        }

        const roundWithId = {
            ...currentRound,
            id: currentRound.id || `round-${Date.now()}-${Math.random()}`
        };

        // If editing an existing round, replace it at the same position
        if (editingRoundIndex !== null) {
            const newRounds = [...rounds];
            newRounds.splice(editingRoundIndex, 0, roundWithId);
            setRounds(newRounds);
            setEditingRoundIndex(null);
        } else {
            // Otherwise add to the end
            setRounds([...rounds, roundWithId]);
        }

        setCurrentRound({ title: '', videoUrl: '', questions: [] });
    };

    const handleRemoveRound = (id: string) => {
        setRounds(rounds.filter((r) => r.id !== id));
    };

    const handleEditRound = (id: string) => {
        const index = rounds.findIndex((r) => r.id === id);
        if (index === -1) return;

        const round = rounds[index];

        // Save the index for later
        setEditingRoundIndex(index);
        // Load the round into the editor
        setCurrentRound(round);
        // Remove it from the saved rounds
        setRounds(rounds.filter((r) => r.id !== id));
        // Scroll to the editor
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    };

    const handleCreateGame = async () => {
        setErrorMsg(null); // Clear previous errors

        console.log('Button clicked! isEditing:', isEditing, 'Title:', gameTitle, 'Rounds:', rounds.length);

        if (!gameTitle.trim()) {
            alert('Пожалуйста, введите название игры в поле сверху!');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        if (rounds.length === 0) {
            alert('Добавьте хотя бы один раунд!');
            return;
        }

        try {
            setLoading(true); // Show loading state

            const gameData = {
                title: gameTitle,
                rounds: rounds
            };

            console.log('Payload:', JSON.stringify(gameData, null, 2));

            if (isEditing && gameId) {
                console.log('Updating game...', gameId);
                await gameAPI.updateGame(gameId, gameData);
                alert('Игра успешно обновлена!');
            } else {
                console.log('Creating game...');
                await gameAPI.createGame(gameData);

                // Clear localStorage only when creating new game
                localStorage.removeItem('game_constructor_title');
                localStorage.removeItem('game_constructor_rounds');
                localStorage.removeItem('game_constructor_current_round');
                localStorage.removeItem('game_constructor_editing_index');

                alert('Игра успешно создана!');
            }

            // Always clear editing/migrating state
            setEditingRoundIndex(null);

            navigate('/admin');
        } catch (error: any) {
            console.error('Error saving game:', error);
            const msg = error.response?.data?.error || error.message || 'Unknown error';
            setErrorMsg(`Ошибка: ${msg}`);
            // If it's a network error, it might mean the server is down or restarting
            if (msg.includes('Network Error')) {
                alert('Ошибка сети! Проверьте, запущен ли сервер. Попробуйте нажать кнопку еще раз.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-6 pb-24">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-display-md mb-2">{isEditing ? 'Редактирование игры' : 'Конструктор игры'}</h1>
                    <p className="text-text-secondary">{isEditing ? 'Измените параметры викторины' : 'Создайте новую викторину'}</p>
                </div>

                {/* Game Title */}
                <div className="card-primary mb-6">
                    <label className="block text-sm font-semibold text-text-secondary mb-2">
                        Название игры
                    </label>
                    <input
                        type="text"
                        value={gameTitle}
                        onChange={(e) => setGameTitle(e.target.value)}
                        placeholder="Например: Киновикторина 2025"
                        className="input-field w-full"
                    />
                </div>

                {/* ... existing code ... */}



                {/* Saved Rounds */}
                {rounds.length > 0 && (
                    <div className="card-primary mb-6">
                        <h2 className="text-heading-md mb-4">Раунды ({rounds.length})</h2>
                        <div className="space-y-3">
                            {rounds.map((round, index) => (
                                <div key={round.id || `temp-${index}`} className="bg-background-hover p-4 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="font-semibold text-text-primary mb-1">
                                                Раунд {index + 1}: {round.title}
                                            </div>
                                            <div className="text-sm text-text-muted">
                                                {round.questions.length} {getDeclension(round.questions.length, ['вопрос', 'вопроса', 'вопросов'])}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => round.id ? handleEditRound(round.id) : handleEditRound(`temp-${index}`)}
                                                className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                title="Редактировать"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => round.id ? handleRemoveRound(round.id) : handleRemoveRound(`temp-${index}`)}
                                                className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                                                title="Удалить"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Current Round Editor */}
                <div className="card-primary mb-6">
                    <h2 className="text-heading-md mb-4">
                        {editingRoundIndex !== null
                            ? 'Редактирование раунда'
                            : (rounds.length > 0 ? 'Добавить еще раунд' : 'Создать первый раунд')
                        }
                    </h2>

                    {/* Round Title */}
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-text-secondary mb-2">
                            Название раунда
                        </label>
                        <input
                            type="text"
                            value={currentRound.title}
                            onChange={(e) => setCurrentRound({ ...currentRound, title: e.target.value })}
                            placeholder="Например: Раунд 1: Классика"
                            className="input-field w-full"
                        />
                    </div>



                    {/* Questions List */}
                    <div className="mb-4">
                        <label className="text-sm font-semibold text-text-secondary mb-3 block">
                            Вопросы ({currentRound.questions.length})
                        </label>

                        {/* Sortable Questions Grid */}
                        <div className="relative">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={currentRound.questions.map((q, idx) => `question-${idx}`)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {currentRound.questions.map((question, index) => (
                                            <SortableMovieCard
                                                key={`question-${index}`}
                                                question={question}
                                                index={index}
                                                onRemove={() => handleRemoveMovie(index)}
                                                onAddAnswer={handleAddAlternativeAnswer}
                                                onRemoveAnswer={handleRemoveAnswer}
                                            />
                                        ))}

                                        {/* Add Movie Card - Always Visible */}
                                        <button
                                            onClick={() => setShowMovieSearch(true)}
                                            className="bg-background-hover hover:bg-background-elevated p-3 rounded-lg border-2 border-dashed border-primary/30 hover:border-primary/60 transition-all group min-h-[280px] flex flex-col items-center justify-center gap-3"
                                        >
                                            <div className="w-16 h-16 rounded-full bg-primary/20 group-hover:bg-primary/30 flex items-center justify-center transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-primary">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                                </svg>
                                            </div>
                                            <div className="text-center">
                                                <div className="font-semibold text-text-primary mb-1">Добавить фильм или сериал</div>
                                                <div className="text-xs text-text-muted">Нажмите для поиска</div>
                                            </div>
                                        </button>
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>
                    </div>

                    {/* Add Round Button */}
                    <button
                        onClick={handleAddRound}
                        disabled={!currentRound.title.trim() || currentRound.questions.length === 0}
                        className="button-primary w-full"
                    >
                        {editingRoundIndex !== null ? 'Обновить раунд' : 'Сохранить раунд'}
                    </button>
                </div>

                {/* Create/Update Game Button - SIMPLIFIED DEBUG VERSON */}
                <div className="flex flex-col items-center justify-center pb-12 pt-8 relative z-50">
                    <button
                        onClick={() => {
                            handleCreateGame();
                        }}
                        disabled={loading || rounds.length === 0}
                        className={`px-8 py-4 text-lg shadow-xl rounded-lg font-bold text-white transition-all transform hover:scale-105 active:scale-95 z-50 relative ${rounds.length === 0
                            ? 'bg-gray-500 cursor-not-allowed opacity-50'
                            : (isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700')
                            }`}
                        style={{ minWidth: '300px' }} // Force width
                    >
                        {loading
                            ? (isEditing ? 'Сохранение...' : 'Создание...')
                            : (isEditing ? 'Сохранить изменения' : 'Создать игру')
                        }
                    </button>

                    {rounds.length === 0 && (
                        <p className="text-red-400 mt-2 font-medium">
                            Добавьте хотя бы один раунд, чтобы кнопка стала активной
                        </p>
                    )}

                    {errorMsg && (
                        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded w-full text-center">
                            <p className="font-bold">Ошибка сохранения!</p>
                            <p>{errorMsg}</p>
                        </div>
                    )}
                </div>

            </div>

            {/* Search Modal Overlay - Rendered via Portal */}
            {showMovieSearch && createPortal(
                <AnimatePresence>
                    {showMovieSearch && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => {
                                    setShowMovieSearch(false);
                                    setMovieQuery('');
                                }}
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                            />

                            {/* Search Panel */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                onClick={(e) => e.stopPropagation()}
                                style={{ margin: 'auto' }}
                                className="fixed inset-0 w-[calc(100%-2rem)] max-w-2xl h-fit bg-background-elevated p-6 rounded-xl shadow-2xl z-50 max-h-[80vh] flex flex-col"
                            >
                                {/* Close Button */}
                                <button
                                    onClick={() => {
                                        setShowMovieSearch(false);
                                        setMovieQuery('');
                                    }}
                                    className="absolute top-4 right-4 w-8 h-8 bg-background-hover hover:bg-error text-text-muted hover:text-white rounded-full flex items-center justify-center transition-all"
                                    title="Закрыть"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>

                                {/* Title */}
                                <h3 className="text-xl font-bold text-text-primary mb-4 pr-8">Поиск фильма или сериала</h3>

                                {/* Search Input */}
                                <div className="mb-4">
                                    <input
                                        type="text"
                                        value={movieQuery}
                                        onChange={(e) => setMovieQuery(e.target.value)}
                                        placeholder="Например: Южный парк..."
                                        className="input-field w-full text-lg"
                                        autoFocus
                                    />
                                </div>

                                {/* Search Results */}
                                <div className="flex-1 overflow-y-auto scrollbar-custom">
                                    {movieQuery && movieResults.length > 0 ? (
                                        <div className="space-y-2">
                                            {movieResults.map((movie) => (
                                                <button
                                                    key={movie.id}
                                                    onClick={() => handleAddMovie(movie)}
                                                    className="w-full flex items-center gap-3 p-3 hover:bg-background-hover rounded-lg transition-colors text-left border border-transparent hover:border-primary/30"
                                                >
                                                    {movie.posterPath ? (
                                                        <img
                                                            src={`https://image.tmdb.org/t/p/w92${movie.posterPath}`}
                                                            alt={movie.title}
                                                            className="w-16 h-24 object-cover rounded flex-shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-16 h-24 bg-background-hover rounded flex items-center justify-center text-xs text-text-muted flex-shrink-0">
                                                            —
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className="font-semibold text-text-primary truncate flex-1">{movie.title}</div>
                                                            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded flex-shrink-0">
                                                                {movie.mediaType === 'movie' ? 'Фильм' : 'Сериал'}
                                                            </span>
                                                        </div>
                                                        {movie.originalTitle && movie.originalTitle !== movie.title && (
                                                            <div className="text-sm text-text-muted truncate mb-1">{movie.originalTitle}</div>
                                                        )}
                                                        <div className="text-sm text-text-muted">{movie.year || 'N/A'}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : movieQuery ? (
                                        <div className="text-center py-12 text-text-muted">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-3 opacity-50">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                                            </svg>
                                            <p>Ищем...</p>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-text-muted">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-3 opacity-50">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                            </svg>
                                            <p>Введите название для поиска</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
