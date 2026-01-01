import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await login({ email, password });
            navigate('/admin');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to login');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-primary max-w-md w-full"
            >
                <div className="text-center mb-8">
                    <h1 className="text-heading-lg mb-2">Вход</h1>
                    <p className="text-text-secondary">Управление квизами</p>
                </div>

                {error && (
                    <div className="bg-error/10 text-error text-center p-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-field w-full"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Пароль</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field w-full"
                            required
                        />
                        <div className="text-right mt-2">
                            <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                                Забыли пароль?
                            </Link>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="button-primary w-full"
                    >
                        {isSubmitting ? 'Вход...' : 'Войти'}
                    </button>

                    <div className="text-center mt-4">
                        <span className="text-text-muted">Нет аккаунта? </span>
                        <Link to="/register" className="text-primary hover:underline">
                            Регистрация
                        </Link>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
