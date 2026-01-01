import { motion } from 'framer-motion';

interface ProgressBarProps {
    currentRound: number;
    totalRounds: number;
    currentQuestion: number;
    totalQuestions: number;
    variant?: 'player' | 'screen' | 'admin';
}

export function ProgressBar({
    currentRound,
    totalRounds,
    variant = 'player'
}: ProgressBarProps) {
    // Calculate percentages
    const roundProgress = (currentRound / totalRounds) * 100;
    // const questionProgress = (currentQuestion / totalQuestions) * 100; // Not used anymore

    if (variant === 'screen') {
        return (
            <div className="flex flex-col items-center text-white/80">
                <span className="text-sm font-medium uppercase tracking-wider text-white/60">Раунд</span>
                <span className="text-2xl font-bold font-mono">{currentRound}/{totalRounds}</span>
            </div>
        );
    }

    if (variant === 'admin') {
        return (
            <div className="bg-background-hover p-4 rounded-xl border border-white/5">
                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-text-secondary">Раунд</span>
                        <span className="font-mono text-text-primary">{currentRound} / {totalRounds}</span>
                    </div>
                    <div className="h-1.5 bg-background rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${roundProgress}%` }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // Default 'player' variant
    return (
        <div className="w-full">
            <div className="text-xs text-text-secondary mb-1 font-medium">
                Раунд {currentRound} / {totalRounds}
            </div>
            <div className="h-1.5 bg-background-hover rounded-full overflow-hidden flex">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${roundProgress}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-primary"
                />
            </div>
        </div>
    );
}
