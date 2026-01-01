import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { gameAPI } from '../../services/api';

import { Modal } from '../../components/common/Modal';

export function AdminDashboard() {
    const [games, setGames] = useState<any[]>([]);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; gameId: string | null }>({
        isOpen: false,
        gameId: null
    });

    useEffect(() => {
        loadGames();
    }, []);

    const loadGames = async () => {
        try {
            const data = await gameAPI.getAllGames();
            setGames(data);
        } catch (error) {
            console.error('Error loading games:', error);
        } finally {
            // Loading state removed
        }
    };

    const confirmDeleteGame = (gameId: string) => {
        setDeleteModal({ isOpen: true, gameId });
    };

    const handleDeleteGame = async () => {
        if (!deleteModal.gameId) return;

        try {
            await gameAPI.deleteGame(deleteModal.gameId);
            setDeleteModal({ isOpen: false, gameId: null });
            loadGames();
        } catch (error) {
            console.error('Error deleting game:', error);
            alert('Ошибка при удалении игры');
        }
    };

    const handleExportGame = async (game: any) => {
        try {
            // Fetch full game data with rounds and questions
            const fullGame = await gameAPI.getGameById(game.id);

            // Prepare data for export (remove IDs to avoid conflicts on import)
            const exportData = {
                title: fullGame.title,
                rounds: fullGame.rounds.map((r: any) => ({
                    title: r.title,
                    videoUrl: r.videoUrl,
                    questions: r.questions.map((q: any) => ({
                        title: q.title,
                        originalTitle: q.originalTitle,
                        year: q.year,
                        posterPath: q.posterPath,
                        mediaType: q.tmdbType,
                        tmdbId: q.tmdbId,
                        points: q.points
                    }))
                }))
            };

            const sanitizedTitle = game.title.replace(/[^a-z0-9а-яё]/gi, '_').replace(/_+/g, '_');
            console.log('Starting export...', sanitizedTitle);
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            // Use simple ASCII filename to be safe
            const safeFilename = `${sanitizedTitle}_export.json`;

            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.href = url;
            downloadAnchorNode.download = safeFilename;
            downloadAnchorNode.style.display = 'none';

            document.body.appendChild(downloadAnchorNode);

            // Small delay before clicking to ensure DOM is ready
            setTimeout(() => {
                console.log(`Clicking download anchor for ${safeFilename}...`);
                downloadAnchorNode.click();

                // Cleanup with longer delay to ensure download starts
                setTimeout(() => {
                    console.log('Cleaning up download anchor');
                    if (document.body.contains(downloadAnchorNode)) {
                        document.body.removeChild(downloadAnchorNode);
                    }
                    URL.revokeObjectURL(url);
                }, 2000);
            }, 100);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Ошибка при экспорте игры');
        }
    };

    const handleImportGame = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);

                // Validate structure
                if (!json.title || !Array.isArray(json.rounds)) {
                    throw new Error('Invalid game format');
                }

                // Auto-fetch details for questions with only tmdbId
                const processedRounds = await Promise.all(json.rounds.map(async (round: any) => ({
                    ...round,
                    questions: await Promise.all(round.questions.map(async (q: any) => {
                        // If we have ID but no title/poster, fetch from TMDB
                        if (q.tmdbId && (!q.title || !q.posterPath)) {
                            try {
                                console.log(`Fetching details for TMDB ID: ${q.tmdbId}`);
                                const details = await gameAPI.getTMDBMovie(q.tmdbId);
                                return {
                                    title: details.title,
                                    originalTitle: details.originalTitle,
                                    year: details.year,
                                    posterPath: details.posterPath,
                                    mediaType: 'movie', // Default to movie for now
                                    tmdbId: details.id,
                                    points: q.points || 1
                                };
                            } catch (err) {
                                console.error(`Failed to fetch details for ID ${q.tmdbId}`, err);
                                return q; // Return original if fetch fails
                            }
                        }
                        return q;
                    }))
                })));

                const gameData = {
                    ...json,
                    rounds: processedRounds
                };

                await gameAPI.createGame(gameData);
                loadGames();
                alert('Игра успешно импортирована!');
            } catch (error) {
                console.error('Import failed:', error);
                alert('Ошибка при импорте: неверный формат файла или ошибка при получении данных');
            }
            // Reset input
            event.target.value = '';
        };
        reader.readAsText(file);
    };

    const handleDownloadTemplate = () => {
        const template = {
            "_instructions": "Используйте этот файл для создания новой игры. Вы можете оставить только 'tmdbId' для вопросов, и название/постер загрузятся автоматически.",
            "title": "Новая игра (Шаблон)",
            "rounds": [
                {
                    "title": "Раунд 1",
                    "questions": [
                        {
                            "tmdbId": 603,
                            "points": 1
                        },
                        {
                            "title": "Пример ручного ввода",
                            "originalTitle": "Example Manual",
                            "year": 2024,
                            "points": 15
                        }
                    ]
                }
            ]
        };

        console.log('Starting template download...');
        const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.href = url;
        downloadAnchorNode.download = "game_template.json";
        downloadAnchorNode.style.display = 'none';

        document.body.appendChild(downloadAnchorNode);

        // Small delay before clicking to ensure DOM is ready
        setTimeout(() => {
            console.log('Clicking template download anchor...');
            downloadAnchorNode.click();

            // Cleanup with longer delay to ensure download starts
            setTimeout(() => {
                console.log('Cleaning up template anchor');
                if (document.body.contains(downloadAnchorNode)) {
                    document.body.removeChild(downloadAnchorNode);
                }
                URL.revokeObjectURL(url);
            }, 2000);
        }, 100);
    };

    const handleCreateNewGame = () => {
        // Clear all game constructor drafts
        localStorage.removeItem('game_constructor_title');
        localStorage.removeItem('game_constructor_rounds');
        localStorage.removeItem('game_constructor_current_round');
        localStorage.removeItem('game_constructor_editing_index');
    };

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-display-md mb-2">Обзор</h1>
                    <p className="text-text-secondary">Управление вашими играми</p>
                </div>

                {/* Stats */}
                {/* Actions Grid */}
                {/* Actions Grid */}
                <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-6 mb-8 md:mb-12">
                    <Link
                        to="/admin/create"
                        onClick={handleCreateNewGame}
                        className="group relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br from-primary to-accent-purple p-4 md:p-8 text-white shadow-glow transition-all hover:scale-[1.02] hover:shadow-glow-lg text-center"
                    >
                        <div className="relative z-10 flex flex-col items-center gap-1 md:gap-3">
                            <span className="text-3xl md:text-5xl font-light mb-1 md:mb-2">+</span>
                            <h2 className="text-sm md:text-2xl font-bold leading-tight">Создать игру</h2>
                        </div>
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>

                    <label className="group relative overflow-hidden rounded-xl md:rounded-2xl bg-background-elevated border border-white/5 p-4 md:p-8 text-text-primary shadow-lg transition-all hover:border-accent-teal/50 hover:shadow-glow cursor-pointer text-center">
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImportGame}
                            className="hidden"
                        />
                        <div className="relative z-10 flex flex-col items-center gap-1 md:gap-3">
                            <span className="text-3xl md:text-5xl font-light text-accent-teal mb-1 md:mb-2">↓</span>
                            <h2 className="text-sm md:text-2xl font-bold leading-tight">Импорт (JSON)</h2>
                        </div>
                    </label>
                </div>



                {/* Games List */}
                <div className="space-y-4">
                    <h2 className="text-heading-lg mb-6 px-2">Список игр</h2>

                    {games.length === 0 ? (
                        <div className="text-center py-12 card-primary">
                            <p className="text-text-secondary mb-4">Пока нет созданных игр</p>
                            <Link
                                to="/admin/create"
                                onClick={handleCreateNewGame}
                                className="button-primary inline-block"
                            >
                                Создать первую игру
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {games.map((game, index) => (
                                <motion.div
                                    key={game.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group bg-background-elevated border border-white/5 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all shadow-card hover:border-primary/50 hover:shadow-glow"
                                >
                                    {/* Left: Info */}
                                    <div className="flex items-start gap-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <Link to={`/admin/control/${game.id}`}>
                                                    <h3 className="text-xl font-bold text-text-primary group-hover:text-primary transition-colors hover:text-accent-teal">{game.title}</h3>
                                                </Link>
                                                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${game.status === 'ACTIVE' ? 'bg-success/20 text-success border border-success/20' :
                                                    game.status === 'LOBBY' ? 'bg-warning/20 text-warning border border-warning/20' :
                                                        game.status === 'FINISHED' ? 'bg-text-muted/20 text-text-muted border border-text-muted/20' :
                                                            'bg-info/20 text-info border border-info/20'
                                                    }`}>
                                                    {game.status === 'LOBBY' && 'В лобби'}
                                                    {game.status === 'ACTIVE' && 'Активна'}
                                                    {game.status === 'FINISHED' && 'Завершена'}
                                                    {!['LOBBY', 'ACTIVE', 'FINISHED'].includes(game.status) && game.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-text-secondary">
                                                <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded">
                                                    <span className="text-text-muted">Код:</span>
                                                    <span className="font-mono font-bold text-white tracking-widest">{game.roomCode}</span>
                                                </div>
                                                <span>•</span>
                                                <span>{game.playersCount || 0} игроков</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex items-center gap-2 w-full md:w-auto self-end md:self-center">
                                        <Link
                                            to={`/admin/control/${game.id}`}
                                            className="flex-1 md:flex-none bg-primary hover:bg-primary-dark text-white font-semibold px-5 py-2.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-sm"
                                        >
                                            Управлять
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                            </svg>
                                        </Link>



                                        <div className="flex gap-1">
                                            <Link
                                                to={`/admin/edit/${game.id}`}
                                                className="p-2 text-text-secondary hover:text-white hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-white/10"
                                                title="Редактировать"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                                                </svg>
                                            </Link>
                                            <button
                                                onClick={() => handleExportGame(game)}
                                                className="p-2 text-text-secondary hover:text-accent-teal hover:bg-accent-teal/10 rounded-lg transition-colors border border-transparent hover:border-accent-teal/20"
                                                title="Экспорт в JSON"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => confirmDeleteGame(game.id)}
                                                className="p-2 text-text-secondary hover:text-error hover:bg-error/10 rounded-lg transition-colors border border-transparent hover:border-error/20"
                                                title="Удалить"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer with Template Download */}
                <div className="mt-16 text-center pt-8 border-t border-white/10">
                    <p className="text-text-secondary mb-4">Хотите создать игру быстрее?</p>
                    <button
                        onClick={handleDownloadTemplate}
                        className="text-primary hover:text-accent-teal underline transition-colors"
                    >
                        Скачать шаблон для импорта (JSON)
                    </button>
                    <p className="text-xs text-text-muted mt-2 max-w-2xl mx-auto">
                        В шаблоне можно указывать только <code>tmdbId</code> фильма/сериала, и система автоматически загрузит название, постер и год выпуска при импорте.
                    </p>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, gameId: null })}
                title="Удаление игры"
            >
                <div className="space-y-4">
                    <p className="text-text-secondary">
                        Вы точно хотите удалить эту игру? Это действие нельзя отменить.
                    </p>
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            onClick={() => setDeleteModal({ isOpen: false, gameId: null })}
                            className="px-4 py-2 rounded-lg text-text-secondary hover:text-white transition-colors"
                        >
                            Отмена
                        </button>
                        <button
                            onClick={handleDeleteGame}
                            className="bg-error hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            Удалить
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
