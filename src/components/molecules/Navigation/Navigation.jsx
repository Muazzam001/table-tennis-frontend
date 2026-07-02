import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/atoms/Button';

const navItems = [
  { path: '/', label: 'Home', icon: '🏓' },
  { path: '/players', label: 'Players', icon: '👥' },
  { path: '/teams', label: 'Teams', icon: '🤝' },
  { path: '/matches', label: 'Matches', icon: '⚔️' },
  { path: '/tournament', label: 'Tournament', icon: '🏆' },
  { path: '/history', label: 'History', icon: '📜' },
];

const NavLinks = ({ isActive, variant = 'desktop' }) => {
  const isMobile = variant === 'mobile';

  return (
    <>
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`inline-flex items-center gap-2 p-2 text-sm rounded-lg font-medium transition-colors cursor-pointer ${isActive(item.path)
            ? 'bg-red-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'
            }`}
        >
          <span className={isMobile ? 'text-xl' : 'mr-1'}>{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </>
  );
};

const AuthSection = ({ isAuthenticated, isAdmin, user, onLogout, onLogin, variant = 'desktop' }) => {
  const isMobile = variant === 'mobile';

  if (!isAuthenticated) {
    return (
      <Button onClick={onLogin} variant="primary" size="sm" className={isMobile ? 'w-full' : ''}>
        Login
      </Button>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {isAdmin && (
          <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded">
            Admin
          </span>
        )}
        <span className="text-sm text-gray-700">{user?.username}</span>
      </div>
      <Button onClick={onLogout} variant="outline" size="sm">
        Logout
      </Button>
    </div>
  );
};

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate('/login');
  };

  const handleLogin = () => {
    setIsMenuOpen(false);
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-11/12 mx-auto lg:px-5">
        <div className="flex justify-between items-center h-16">
          <Link to={'/'} className="flex items-center space-x-2">
            <span className="text-2xl">🏓</span>
            <span className="text-lg sm:text-xl font-bold text-gray-900 hidden sm:flex">
              Table Tennis Tournament
            </span>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden xl:flex items-center space-x-4">
            <div className="flex space-x-1">
              <NavLinks isActive={isActive} variant="desktop" />
            </div>

            <div className="flex items-center space-x-2 border-l border-gray-300 pl-4">
              <AuthSection
                isAuthenticated={isAuthenticated}
                isAdmin={isAdmin}
                user={user}
                onLogout={handleLogout}
                onLogin={handleLogin}
                variant="desktop"
              />
            </div>
          </div>

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
            className="xl:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {isMenuOpen && (
        <div className="xl:hidden border-t border-gray-200 bg-white">
          <div className="flex flex-col px-4 py-3">
            <NavLinks isActive={isActive} variant="mobile" />
          </div>

          <div className="px-4 py-3 border-t border-gray-200">
            <AuthSection
              isAuthenticated={isAuthenticated}
              isAdmin={isAdmin}
              user={user}
              onLogout={handleLogout}
              onLogin={handleLogin}
              variant="mobile"
            />
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
