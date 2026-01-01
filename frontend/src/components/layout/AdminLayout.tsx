import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Breadcrumbs logic
    const getBreadcrumbs = () => {
        const path = location.pathname;
        const parts = path.split('/').filter(Boolean);
        // parts: ['admin', 'create'] or ['admin', 'control', 'id']

        const crumbs = [];

        // Home (Dashboard)
        if (parts.length > 1) {
            crumbs.push({ label: 'Панель', path: '/admin' });
        }

        if (parts.includes('create')) {
            crumbs.push({ label: 'Создание игры', path: null });
        } else if (parts.includes('edit')) {
            crumbs.push({ label: 'Редактирование', path: null });
        } else if (parts.includes('control')) {
            crumbs.push({ label: 'Управление', path: null });
        }

        return crumbs;
    };

    const crumbs = getBreadcrumbs();

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="border-b border-white/10 bg-background-elevated/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    {/* Left: Logo & Breadcrumbs */}
                    <div className="flex items-center gap-6">
                        <Link to="/admin" className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-purple uppercase tracking-widest hover:opacity-80 transition-opacity">
                            Quiz Admin
                        </Link>

                        {/* Divider */}
                        {crumbs.length > 0 && (
                            <div className="h-6 w-px bg-white/10 hidden md:block"></div>
                        )}

                        {/* Breadcrumbs */}
                        <div className="hidden md:flex items-center gap-2 text-sm">
                            {crumbs.map((crumb, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    {index > 0 && <span className="text-text-muted">/</span>}
                                    {crumb.path ? (
                                        <Link to={crumb.path} className="text-text-secondary hover:text-white transition-colors">
                                            {crumb.label}
                                        </Link>
                                    ) : (
                                        <span className="text-white font-medium">{crumb.label}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: User Profile */}
                    <div className="flex items-center gap-6">
                        {user && (
                            <div className="hidden sm:flex flex-col items-end">
                                <span className="text-white font-bold leading-none">{user.name}</span>
                                <span className="text-xs text-text-secondary">{user.email}</span>
                            </div>
                        )}

                        <div className="h-8 w-px bg-white/10 hidden sm:block"></div>

                        <button
                            onClick={handleLogout}
                            className="bg-white/5 hover:bg-error/10 text-text-secondary hover:text-error px-4 py-2 rounded-lg transition-all text-sm font-medium border border-transparent hover:border-error/20 flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                            </svg>
                            <span className="hidden sm:inline">Выйти</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6">
                <Outlet />
            </main>
        </div>
    );
}
