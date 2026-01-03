import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTMDBSearch } from '../../hooks/useTMDBSearch';

interface Movie {
    id: number;
    title: string;
    originalTitle: string;
    year: number | null;
    posterPath: string | null;
    mediaType?: 'movie' | 'tv';
}

interface QuestionInputProps {
    onSubmit: (tmdbId: number, text: string, movie?: Movie) => void;
    onClear?: () => void; // Callback to clear answer from store
    disabled: boolean;
    submitted: boolean;
    restoredAnswer?: {
        tmdbId?: number;
        text?: string;
        metadata?: {
            year?: number | null;
            posterPath?: string | null;
            originalTitle?: string | null;
            mediaType?: 'movie' | 'tv';
        };
    };
}

export function QuestionInput({ onSubmit, onClear, disabled, submitted, restoredAnswer }: QuestionInputProps) {
    const [query, setQuery] = useState('');
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const { results, loading } = useTMDBSearch(query);

    // If we have a restored answer but no local selectedMovie, create a pseudo-movie for display
    const displayMovie = selectedMovie || (submitted && restoredAnswer ? {
        id: restoredAnswer.tmdbId || 0,
        title: restoredAnswer.metadata?.originalTitle || restoredAnswer.text || '',
        originalTitle: restoredAnswer.metadata?.originalTitle || restoredAnswer.text || '',
        year: restoredAnswer.metadata?.year || null,
        posterPath: restoredAnswer.metadata?.posterPath || null,
        mediaType: restoredAnswer.metadata?.mediaType || 'movie'
    } as Movie : null);

    const handleSelect = (movie: Movie) => {
        setSelectedMovie(movie);
        setQuery('');
        setShowDropdown(false);
        setIsEditing(false);
        onSubmit(movie.id, movie.title, movie);
    };

    const handleEdit = () => {
        setIsEditing(true);
        setShowDropdown(false);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setQuery('');
        setShowDropdown(false);
    };

    const handleClear = () => {
        setSelectedMovie(null);
        setQuery('');
        setIsEditing(false);
        // Call parent callback to remove from store
        if (onClear) {
            onClear();
        }
    };

    return (
        <div className="relative">
            {/* Editing Mode - Show input field */}
            {isEditing && displayMovie ? (
                <>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        onBlur={() => {
                            // Delay closing to allow clicking on dropdown items
                            setTimeout(() => setShowDropdown(false), 200);
                        }}
                        autoFocus
                        disabled={disabled}
                        placeholder="Введите название фильма или сериала..."
                        className="input-field w-full text-base min-h-[48px]"
                    />
                    {/* ... rest of editing mode ... */}
                    <button
                        onClick={handleCancelEdit}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-error transition-colors text-sm"
                    >
                        ✕
                    </button>

                    {/* Autocomplete Dropdown */}
                    <AnimatePresence>
                        {showDropdown && query && results.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                onMouseDown={(e) => e.preventDefault()} // Prevent blur when clicking dropdown
                                className="absolute top-full mt-2 w-full bg-background-elevated rounded-card shadow-2xl z-50 max-h-96 overflow-y-auto scrollbar-custom"
                            >
                                {results.map((movie) => (
                                    <button
                                        key={movie.id}
                                        onClick={() => handleSelect(movie)}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-background-hover transition-colors text-left border-b border-background-hover last:border-0"
                                    >
                                        {movie.posterPath ? (
                                            <img
                                                src={`https://image.tmdb.org/t/p/w92${movie.posterPath}`}
                                                alt={movie.title}
                                                className="w-12 h-18 object-cover rounded flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-12 h-18 bg-background-hover rounded flex items-center justify-center text-2xl flex-shrink-0"></div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-text-primary truncate">{movie.title}</div>
                                            {movie.originalTitle !== movie.title && (
                                                <div className="text-xs text-text-muted truncate">{movie.originalTitle}</div>
                                            )}
                                            <div className="text-sm text-text-secondary">
                                                {movie.year || 'N/A'}, {movie.mediaType === 'tv' ? 'Сериал' : 'Фильм'}
                                            </div>
                                        </div>
                                    </button>
                                ))}

                                {loading && (
                                    <div className="p-4 text-center text-text-muted flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        <span>Поиск...</span>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            ) : submitted && displayMovie ? (
                /* Submitted State */
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={!disabled ? handleEdit : undefined}
                    className={`bg-background-elevated border border-white/10 rounded-input px-4 py-3 flex items-center justify-between ${!disabled ? 'cursor-pointer hover:border-primary/30 transition-all' : ''}`}
                >
                    <div className="flex items-center gap-3">
                        {displayMovie.posterPath ? (
                            <img
                                src={`https://image.tmdb.org/t/p/w92${displayMovie.posterPath}`}
                                alt={displayMovie.title}
                                className="w-12 h-18 object-cover rounded"
                            />
                        ) : (
                            <div className="w-12 h-18 bg-background-hover rounded flex items-center justify-center text-xs text-text-muted flex-shrink-0 border border-white/10">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                </svg>
                            </div>
                        )}
                        <div>
                            <div className="font-semibold text-text-primary">{displayMovie.title}</div>
                            <div className="text-sm text-text-muted">
                                {displayMovie.year ? `${displayMovie.year}` : ''}
                                {displayMovie.year && displayMovie.mediaType ? ', ' : ''}
                                {displayMovie.mediaType ? `${displayMovie.mediaType === 'tv' ? 'Сериал' : 'Фильм'}` : ''}
                            </div>
                        </div>
                    </div>
                    {!disabled && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClear();
                            }}
                            className="text-text-muted hover:text-error transition-colors text-xl"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                </motion.div>
            ) : displayMovie ? (
                /* Selected but not submitted */
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-background-hover border border-primary rounded-input px-4 py-3 flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        {displayMovie.posterPath ? (
                            <img
                                src={`https://image.tmdb.org/t/p/w92${displayMovie.posterPath}`}
                                alt={displayMovie.title}
                                className="w-12 h-18 object-cover rounded"
                            />
                        ) : (
                            <div className="w-12 h-18 bg-background-hover rounded flex items-center justify-center text-xs text-text-muted flex-shrink-0 border border-white/10">
                                🎞️
                            </div>
                        )}
                        <div>
                            <div className="font-semibold text-text-primary">{displayMovie.title}</div>
                            <div className="text-sm text-text-muted">
                                {displayMovie.year || 'Новый выбор'}
                                {displayMovie.mediaType && `, ${displayMovie.mediaType === 'tv' ? 'Сериал' : 'Фильм'}`}
                            </div>
                        </div>
                    </div>
                    {!disabled && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEdit();
                            }}
                            className="text-text-muted hover:text-primary transition-colors text-sm"
                        >
                            Изменить
                        </button>
                    )}
                </motion.div>
            ) : (
                /* Input State */
                <>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        onBlur={() => {
                            // Delay closing to allow clicking on dropdown items
                            setTimeout(() => setShowDropdown(false), 200);
                        }}
                        disabled={disabled}
                        placeholder="Введите название фильма или сериала..."
                        className="input-field w-full text-base min-h-[48px]"
                    />

                    {/* Autocomplete Dropdown */}
                    <AnimatePresence>
                        {showDropdown && query && results.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                onMouseDown={(e) => e.preventDefault()} // Prevent blur when clicking dropdown
                                className="absolute top-full mt-2 w-full bg-background-elevated rounded-card shadow-2xl z-50 max-h-96 overflow-y-auto scrollbar-custom"
                            >
                                {results.map((movie) => (
                                    <button
                                        key={movie.id}
                                        onClick={() => handleSelect(movie)}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-background-hover transition-colors text-left border-b border-background-hover last:border-0"
                                    >
                                        {movie.posterPath ? (
                                            <img
                                                src={`https://image.tmdb.org/t/p/w92${movie.posterPath}`}
                                                alt={movie.title}
                                                className="w-12 h-18 object-cover rounded flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-12 h-18 bg-background-hover rounded flex items-center justify-center text-2xl flex-shrink-0"></div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-text-primary truncate">{movie.title}</div>
                                            {movie.originalTitle !== movie.title && (
                                                <div className="text-xs text-text-muted truncate">{movie.originalTitle}</div>
                                            )}
                                            <div className="text-sm text-text-secondary">
                                                {movie.year || 'N/A'}, {movie.mediaType === 'tv' ? 'Сериал' : 'Фильм'}
                                            </div>
                                        </div>
                                    </button>
                                ))}

                                {loading && (
                                    <div className="p-4 text-center text-text-muted flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        <span>Поиск...</span>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </div>
    );
}
