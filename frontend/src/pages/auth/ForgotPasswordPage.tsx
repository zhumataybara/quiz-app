import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';

const API_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsSubmitting(true);

        try {
            const response = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
            setMessage(response.data.message);
            setEmail(''); // Clear the form
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to send reset email');
        } finally {
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
                    <h1 className="text-heading-lg mb-2">Забыли пароль?</h1>
                    <p className="text-text-secondary">
                        Введите ваш email, и мы отправим ссылку для сброса пароля
                    </p>
                </div>

                {message && (
                    <div className="bg-success/10 text-success text-center p-3 rounded mb-4">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="bg-error/10 text-error text-center p-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-field w-full"
                            placeholder="your@email.com"
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="button-primary w-full"
                    >
                        {isSubmitting ? 'Отправка...' : 'Отправить ссылку'}
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
