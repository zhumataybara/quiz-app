import { create } from 'zustand';

interface Player {
    id: string;
    nickname: string;
    totalScore: number;
    isConnected: boolean;
}

interface Question {
    id: string;
    orderIndex: number;
    tmdbId: number;
    title: string;
    points: number;
}

interface Round {
    id: string;
    title: string;
    state: 'WAITING' | 'ACTIVE' | 'LOCKED' | 'REVEALED';
    questions: Question[];
}

interface Game {
    id: string;
    title?: string;
    roomCode: string;
    status: 'LOBBY' | 'ACTIVE' | 'PAUSED' | 'FINISHED';
    currentRound?: Round;
}

interface GameState {
    // Player data
    playerId: string | null;
    playerNickname: string | null;

    // Game data
    game: Game | null;
    players: Player[];
    leaderboard: Array<{ position: number; nickname: string; score: number; }>;
    progress?: {
        currentRound: number;
        totalRounds: number;
        currentQuestion: number;
        totalQuestions: number;
    };

    // Submitted answers tracking
    answeredQuestions: Array<{
        questionId: string;
        tmdbId?: number;
        text?: string;
        metadata?: {
            year?: number | null;
            posterPath?: string | null;
            originalTitle?: string | null;
            mediaType?: 'movie' | 'tv';
        };
    }>;

    // Connection
    isConnected: boolean;

    // Actions
    setPlayerId: (id: string) => void;
    setPlayerNickname: (nickname: string) => void;
    setGame: (game: Game | null) => void;
    setPlayers: (players: Player[]) => void;
    setLeaderboard: (leaderboard: Array<{ position: number; nickname: string; score: number; }>) => void;
    setProgress: (progress: any) => void;
    setAnsweredQuestions: (answers: Array<{
        questionId: string;
        tmdbId?: number;
        text?: string;
        metadata?: {
            year?: number | null;
            posterPath?: string | null;
            originalTitle?: string | null;
            mediaType?: 'movie' | 'tv';
        };
    }>) => void;
    setConnected: (connected: boolean) => void;
    reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
    playerId: null,
    playerNickname: null,
    game: null,
    players: [],
    leaderboard: [],
    progress: undefined,
    answeredQuestions: [],
    isConnected: false,

    setPlayerId: (id) => {
        set({ playerId: id });
        localStorage.setItem('quiz_player_id', id);
    },

    setPlayerNickname: (nickname) => {
        set({ playerNickname: nickname });
        localStorage.setItem('quiz_player_nickname', nickname);
    },

    setGame: (game) => set({ game }),
    setPlayers: (players) => set({ players }),
    setLeaderboard: (leaderboard) => set({ leaderboard }),
    setProgress: (progress) => set({ progress }),
    setAnsweredQuestions: (answeredQuestions) => set({ answeredQuestions }),
    setConnected: (connected) => set({ isConnected: connected }),

    reset: () => {
        set({
            playerId: null,
            playerNickname: null,
            game: null,
            players: [],
            leaderboard: [],
            progress: undefined,
            answeredQuestions: [],
            isConnected: false,
        });
        localStorage.removeItem('quiz_player_id');
        localStorage.removeItem('quiz_player_nickname');
        localStorage.removeItem('quiz_game_id');
    },
}));
