import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { useSocket } from './hooks/useSocket';
import { useGameStore } from './hooks/useGameStore';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import './index.css';

// Lazy imports
// Helper to handle named exports
const lazyImport = <T extends React.ComponentType<any>>(
  factory: () => Promise<{ [key: string]: T }>,
  name: string
) => lazy(() => factory().then((module) => ({ default: module[name] })));

const AdminLayout = lazyImport(() => import('./components/layout/AdminLayout'), 'AdminLayout');
const LoginPageLazy = lazyImport(() => import('./pages/auth/LoginPage'), 'LoginPage');
const RegisterPageLazy = lazyImport(() => import('./pages/auth/RegisterPage'), 'RegisterPage');
const ForgotPasswordPageLazy = lazyImport(() => import('./pages/auth/ForgotPasswordPage'), 'ForgotPasswordPage');
const ResetPasswordPageLazy = lazyImport(() => import('./pages/auth/ResetPasswordPage'), 'ResetPasswordPage');
const JoinGamePage = lazyImport(() => import('./pages/player/JoinGamePage'), 'JoinGamePage');
const LobbyPage = lazyImport(() => import('./pages/player/LobbyPage'), 'LobbyPage');
const GamePage = lazyImport(() => import('./pages/player/GamePage'), 'GamePage');
const AdminDashboard = lazyImport(() => import('./pages/admin/AdminDashboard'), 'AdminDashboard');
const GameConstructor = lazyImport(() => import('./pages/admin/GameConstructor'), 'GameConstructor');
const GameControl = lazyImport(() => import('./pages/admin/GameControl'), 'GameControl');
const ProjectorPage = lazyImport(() => import('./pages/screen/ProjectorPage'), 'ProjectorPage');

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      <p className="text-text-secondary animate-pulse">Загрузка...</p>
    </div>
  </div>
);

function App() {
  // Initialize socket connection
  const { reconnectPlayer } = useSocket();
  const { setPlayerId, setPlayerNickname } = useGameStore();

  // Reconnect player on page load
  useEffect(() => {
    const savedPlayerId = localStorage.getItem('quiz_player_id');
    const savedGameId = localStorage.getItem('quiz_game_id');
    const savedNickname = localStorage.getItem('quiz_player_nickname');

    if (savedPlayerId && savedGameId) {
      console.log('Reconnecting player:', savedPlayerId);
      setPlayerId(savedPlayerId);
      if (savedNickname) {
        setPlayerNickname(savedNickname);
      }
      reconnectPlayer(savedPlayerId, savedGameId);
    }
  }, [reconnectPlayer, setPlayerId, setPlayerNickname]);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth Routes */}
            <Route path="/login" element={<LoginPageLazy />} />
            <Route path="/register" element={<RegisterPageLazy />} />
            <Route path="/forgot-password" element={<ForgotPasswordPageLazy />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPageLazy />} />

            {/* Player Routes */}
            <Route path="/join" element={<JoinGamePage />} />
            <Route path="/lobby" element={<LobbyPage />} />
            <Route path="/game" element={<GamePage />} />

            {/* Admin Routes (Protected) */}
            {/* Admin Routes (Protected Layout) */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="create" element={<GameConstructor />} />
              <Route path="edit/:gameId" element={<GameConstructor />} />
              <Route path="control/:gameId" element={<GameControl />} />
            </Route>

            {/* Screen Routes */}
            <Route path="/screen/:roomCode" element={<ProjectorPage />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

function LandingPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card-primary max-w-2xl w-full">
        <div className="text-center space-y-12 py-20">
          <div className="space-y-4">
            <h1 className="text-[5rem] font-bold bg-gradient-to-r from-primary via-accent-purple to-accent-pink bg-clip-text text-transparent tracking-tight leading-none drop-shadow-lg">
              Quiz Room
            </h1>
          </div>

          <div className="flex flex-col gap-6 justify-center items-center mt-12 max-w-md mx-auto">
            <Link
              to="/join"
              className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-accent-purple p-[2px] transition-all hover:scale-[1.02] hover:shadow-glow-lg"
            >
              <div className="relative h-full w-full rounded-2xl bg-background-elevated/10 backdrop-blur-sm group-hover:bg-transparent transition-colors">
                <div className="px-12 py-6 text-2xl font-bold text-white flex items-center justify-center gap-3">
                  Присоединиться к игре
                </div>
              </div>
            </Link>

            {user ? (
              <Link
                to="/admin"
                className="group w-full rounded-2xl bg-gradient-to-r from-accent-teal to-primary p-[2px] block hover:scale-[1.02] transition-transform shadow-lg shadow-accent-teal/10"
              >
                <div className="relative h-full w-full rounded-2xl bg-background-elevated/90 backdrop-blur-sm px-12 py-6 flex items-center justify-center gap-3 group-hover:bg-background-elevated/50 transition-colors">
                  <span className="text-2xl font-bold text-white">Перейти в панель</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </Link>
            ) : (
              <Link
                to="/admin"
                className="group w-full rounded-2xl border border-white/10 bg-white/5 px-12 py-5 text-xl font-semibold text-text-secondary transition-all hover:bg-white/10 hover:text-white hover:scale-[1.02] hover:border-white/20 flex items-center justify-center gap-3"
              >
                Создать комнату
              </Link>
            )}

            {/* User Info - Compact Below Buttons */}
            {user && (
              <div className="w-full mt-4 pt-6 border-t border-white/10">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 text-left">
                    <div className="text-text-secondary text-xs mb-0.5">Вы вошли как</div>
                    <div className="text-white font-semibold text-sm truncate">{user.email}</div>
                  </div>
                  <button
                    onClick={logout}
                    className="px-4 py-2 text-text-secondary hover:text-error hover:bg-error/5 rounded-lg transition-colors text-xs font-medium border border-white/10 hover:border-error/20 whitespace-nowrap"
                  >
                    Выйти
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
