import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSocket } from '../../hooks/useSocket';
import { useGameStore } from '../../hooks/useGameStore';
import { socket } from '../../services/socket';

export function JoinGamePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { joinGame } = useSocket();
    const { setPlayerNickname } = useGameStore();

    const [roomCode, setRoomCode] = useState(searchParams.get('code') || '');
    const [nickname, setNickname] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState('');

    // Listen for successful join
    useEffect(() => {
        const handlePlayerJoined = () => {
            console.log('✅ Player joined successfully, navigating to lobby');
            navigate('/lobby');
        };

        const handleError = ({ message }: { message: string }) => {
            console.error('❌ Join error:', message);
            setError(message);
            setIsJoining(false);
        };

        socket.on('player_joined', handlePlayerJoined);
        socket.on('error', handleError);

        return () => {
            socket.off('player_joined', handlePlayerJoined);
            socket.off('error', handleError);
        };
    }, [navigate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!roomCode.trim() || !nickname.trim()) {
            setError('Заполните все поля');
            return;
        }

        setError('');
        setIsJoining(true);
        setPlayerNickname(nickname);
        
        // Join game - will navigate to lobby when player_joined event is received
        joinGame(roomCode.toUpperCase(), nickname);

        // Safety timeout - if no response in 10 seconds, show error
        setTimeout(() => {
            if (isJoining) {
                setError('Не удалось подключиться к игре. Проверьте код комнаты.');
                setIsJoining(false);
            }
        }, 10000);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-primary max-w-md w-full"
            >
                <div className="text-center mb-8">
                    <h1 className="text-heading-lg mb-2">Quiz Room</h1>
                    <p className="text-text-secondary">Присоединиться к игре</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Room Code */}
                    <div>
                        <label htmlFor="roomCode" className="block text-sm font-medium text-text-secondary mb-2">
                            Код комнаты
                        </label>
                        <input
                            id="roomCode"
                            type="text"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                            placeholder="ABC123"
                            maxLength={6}
                            className="input-field w-full text-center text-2xl font-bold tracking-widest uppercase"
                            disabled={isJoining}
                        />
                        <p className="text-xs text-text-muted mt-1 text-center">
                            Введите 6-значный код от организатора
                        </p>
                    </div>

                    {/* Nickname */}
                    <div>
                        <label htmlFor="nickname" className="block text-sm font-medium text-text-secondary mb-2">
                            Ваш никнейм
                        </label>
                        <input
                            id="nickname"
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="Введите имя"
                            maxLength={20}
                            className="input-field w-full"
                            disabled={isJoining}
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isJoining || !roomCode.trim() || !nickname.trim()}
                        className="button-primary w-full"
                    >
                        {isJoining ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Подключение...
                            </span>
                        ) : (
                            'Присоединиться'
                        )}
                    </button>
                </form>

                {/* Back Link */}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => navigate('/')}
                        className="text-text-muted hover:text-text-primary transition-colors text-sm"
                        disabled={isJoining}
                    >
                        ← Назад на главную
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
