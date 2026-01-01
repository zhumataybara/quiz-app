import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children?: React.ReactNode;
    message?: string;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'default' | 'danger';
}

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    message,
    onConfirm,
    confirmText,
    cancelText,
    type = 'default'
}: ModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
                    >
                        {/* Modal Content */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-background-elevated rounded-2xl shadow-2xl max-w-md w-full border border-white/10 overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                                <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-text-muted hover:text-white hover:bg-white/10 rounded-lg transition-all"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-8">
                                {message && <p className="text-text-secondary leading-relaxed mb-6">{message}</p>}
                                {children}
                            </div>

                            {/* Footer (if confirmation) */}
                            {onConfirm && (
                                <div className="p-6 bg-black/20 border-t border-white/5 flex gap-3 justify-end">
                                    <button
                                        onClick={onClose}
                                        className="px-5 py-2.5 rounded-xl font-semibold text-text-secondary hover:text-white hover:bg-white/5 transition-all"
                                    >
                                        {cancelText || 'Отмена'}
                                    </button>
                                    <button
                                        onClick={onConfirm}
                                        className={`px-5 py-2.5 rounded-xl font-bold text-white transition-all active:scale-95 shadow-lg ${type === 'danger'
                                                ? 'bg-error hover:bg-error/80 shadow-error/20'
                                                : 'bg-primary hover:bg-primary/80 shadow-primary/20'
                                            }`}
                                    >
                                        {confirmText || 'ОК'}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
