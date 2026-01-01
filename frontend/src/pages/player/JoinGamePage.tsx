import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSocket } from '../../hooks/useSocket';
import { useGameStore } from '../../hooks/useGameStore';

export function JoinGamePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { joinGame } = useSocket();
    const { setPlayerNickname } = useGameStore();

    const [roomCode, setRoomCode] = useState(searchParams.get('code') || '');
    const [nickname, setNickname] = useState('');
    const [isJoining, setIsJoining] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!roomCode.trim() || !nickname.trim()) {
            alert('Заполните все поля');
            return;
        }

        setIsJoining(true);
        setPlayerNickname(nickname);
        joinGame(roomCode.toUpperCase(), nickname);

        // Navigate to lobby (socket will update game state)
        setTimeout(() => {
            navigate('/lobby');
        }, 500);
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
                    >
                        ← Назад на главную
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
