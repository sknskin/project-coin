import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useAuth } from '../../hooks/useAuth';

export default function Header() {
  const { isAuthenticated, user } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const { logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold text-primary-600">
              Project Coin
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link
                to="/"
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                시세
              </Link>
              {isAuthenticated && (
                <Link
                  to="/portfolio"
                  className="text-gray-600 hover:text-primary-600 transition-colors"
                >
                  포트폴리오
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-600">
                  {user?.nickname || user?.email}
                </span>
                <button
                  onClick={() => logout()}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  로그인
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  회원가입
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
