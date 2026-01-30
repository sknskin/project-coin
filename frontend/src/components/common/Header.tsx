import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useMenuStore } from '../../store/menuStore';
import { useAuth } from '../../hooks/useAuth';
import { useSessionTimer } from '../../hooks/useSessionTimer';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import ConfirmModal from './ConfirmModal';
import NotificationIcon from '../notification/NotificationIcon';
import ChatIcon from '../chat/ChatIcon';

export default function Header() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const { menus, fetchMenus } = useMenuStore();
  const { logout } = useAuth();
  const { formattedTime, isExpiringSoon } = useSessionTimer();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus, isAuthenticated]);

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    setIsLogoutModalOpen(false);
    navigate('/coins');
  };

  const handleNicknameClick = () => {
    navigate('/mypage');
  };

  const getMenuLabel = (menu: { name: string; nameEn: string }) => {
    return i18n.language === 'ko' ? menu.name : menu.nameEn;
  };

  const canShowMenu = (requiredRole: string | null) => {
    if (!requiredRole) return true;
    if (!isAuthenticated || !user) return false;
    if (requiredRole === 'USER') return true;
    if (requiredRole === 'ADMIN') {
      return user.role === 'ADMIN' || user.role === 'SYSTEM';
    }
    return false;
  };

  const visibleMenus = menus.filter(
    (menu) => menu.depth === 1 && canShowMenu(menu.requiredRole)
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center space-x-4">
            {/* 테마/언어 토글을 로고 왼쪽에 배치 */}
            <div className="flex items-center space-x-1">
              <LanguageToggle />
              <ThemeToggle />
            </div>
            <Link to="/" className="text-xl font-bold text-primary-600 dark:text-primary-400">
              Project Coin
            </Link>
            <nav className="hidden md:flex space-x-6 ml-4">
              {visibleMenus.map((menu) => (
                menu.path && (
                  <Link
                    key={menu.id}
                    to={menu.path}
                    className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm"
                  >
                    {getMenuLabel(menu)}
                  </Link>
                )
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-2">
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-2 text-sm">
                  <button
                    onClick={handleNicknameClick}
                    className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
                  >
                    {user?.nickname || user?.name || user?.email}{t('auth.userSuffix')}
                  </button>
                  <span
                    className={`font-mono tabular-nums px-2 py-0.5 rounded text-xs ${
                      isExpiringSoon
                        ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {formattedTime}
                  </span>
                </div>
                <div className="flex items-center">
                  <NotificationIcon />
                  <ChatIcon />
                </div>
                <button
                  onClick={handleLogoutClick}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {t('auth.logout')}
                </button>
                <ConfirmModal
                  isOpen={isLogoutModalOpen}
                  onClose={() => setIsLogoutModalOpen(false)}
                  onConfirm={handleLogoutConfirm}
                  title={t('auth.logout')}
                  message={t('auth.logoutConfirm')}
                  confirmText={t('auth.logout')}
                  cancelText={t('common.cancel')}
                  variant="danger"
                />
              </>
            ) : (
              <>
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {t('auth.login')}
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {t('auth.register')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
