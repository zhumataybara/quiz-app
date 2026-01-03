import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';

const API_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            setError('Invalid reset link');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate passwords match
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Validate password length
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsSubmitting(true);

        try {
            await axios.post(`${API_URL}/api/auth/reset-password`, {
                token,
                password,
            });

            setSuccess(true);

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to reset password');
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-background">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card-primary max-w-md w-full text-center"
                >
                    <svg className="w-20 h-20 mx-auto mb-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <h1 className="text-heading-lg mb-2">Пароль изменен!</h1>
                    <p className="text-text-secondary mb-4">
                        Ваш пароль успешно изменен. Перенаправление на страницу входа...
                    </p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-primary max-w-md w-full"
            >
                <div className="text-center mb-8">
                    <h1 className="text-heading-lg mb-2">Новый пароль</h1>
                    <p className="text-text-secondary">
                        Введите новый пароль для вашего аккаунта
                    </p>
                </div>

                {error && (
                    <div className="bg-error/10 text-error text-center p-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Новый пароль
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field w-full"
                            placeholder="Минимум 6 символов"
                            required
                            disabled={isSubmitting}
                            minLength={6}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Подтвердите пароль
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="input-field w-full"
                            placeholder="Повторите пароль"
                            required
                            disabled={isSubmitting}
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="button-primary w-full"
                    >
                        {isSubmitting ? 'Сохранение...' : 'Сохранить новый пароль'}
                    </button>

                    <div className="text-center mt-4">
                        <Link to="/login" className="text-primary hover:underline">
                            ← Вернуться к входу
                        </Link>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
