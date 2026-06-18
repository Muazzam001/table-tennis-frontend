import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/atoms/Button';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  
  const navItems = [
    { path: '/', label: 'Home', icon: '🏓' },
    { path: '/players', label: 'Players', icon: '👥' },
    { path: '/teams', label: 'Teams', icon: '🤝' },
    { path: '/matches', label: 'Matches', icon: '⚔️' },
    { path: '/tournament', label: 'Tournament', icon: '🏆' },
    { path: '/history', label: 'History', icon: '📜' },
  ];
  
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-11/12 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🏓</span>
            <h1 className="text-xl font-bold text-gray-900">Table Tennis Tournament</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    isActive(item.path)
                      ? 'bg-red-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center space-x-2 border-l border-gray-300 pl-4">
              {isAuthenticated ? (
                <>
                  {isAdmin && (
                    <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded">
                      Admin
                    </span>
                  )}
                  <span className="text-sm text-gray-700">
                    {user?.username}
                  </span>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => navigate('/login')}
                  variant="primary"
                  size="sm"
                >
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;


