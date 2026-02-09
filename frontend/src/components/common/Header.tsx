import { useState, useEffect, useRef } from 'react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const hamburgerButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus, isAuthenticated]);

  // 모바일 메뉴가 열려있을 때 화면 크기 변경 감지하여 닫기
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen]);

  // 모바일 메뉴 바깥 클릭 시 닫기
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(target) &&
        hamburgerButtonRef.current &&
        !hamburgerButtonRef.current.contains(target)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

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
            {/* 햄버거 메뉴 버튼 (1024px 미만에서 표시) */}
            <button
              ref={hamburgerButtonRef}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
            {/* 테마/언어 토글 (1024px 이상에서 표시) */}
            <div className="hidden lg:flex items-center space-x-1">
              <LanguageToggle />
              <ThemeToggle />
            </div>
            <Link to="/" className="text-xl font-bold text-primary-600 dark:text-primary-400 whitespace-nowrap">
              Project Coin
            </Link>
            {/* 데스크탑 네비게이션 (1024px 이상에서 표시) */}
            <nav className="hidden lg:flex space-x-6 ml-4">
              {visibleMenus.map((menu) => (
                menu.path && (
                  <Link
                    key={menu.id}
                    to={menu.path}
                    className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm whitespace-nowrap"
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
                {/* 사용자 정보 (1024px 이상에서 표시) */}
                <div className="hidden lg:flex items-center space-x-2 text-sm">
                  <button
                    onClick={handleNicknameClick}
                    className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer whitespace-nowrap"
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
                  className="hidden lg:block px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap"
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
                  className="hidden lg:block px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap"
                >
                  {t('auth.login')}
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="hidden lg:block px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors whitespace-nowrap"
                >
                  {t('auth.register')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 (1024px 미만에서 표시) */}
      {isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="lg:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <div className="container mx-auto px-4 py-3">
            {/* 테마/언어 토글 (모바일) */}
            <div className="flex items-center space-x-2 pb-3 border-b border-gray-200 dark:border-gray-700">
              <LanguageToggle />
              <ThemeToggle />
            </div>

            {/* 네비게이션 메뉴 */}
            <nav className="py-3 space-y-1">
              {visibleMenus.map((menu) => (
                menu.path && (
                  <Link
                    key={menu.id}
                    to={menu.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    {getMenuLabel(menu)}
                  </Link>
                )
              ))}
            </nav>

            {/* 사용자 정보 및 액션 */}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-3 py-2">
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleNicknameClick();
                      }}
                      className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
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
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogoutClick();
                    }}
                    className="w-full px-3 py-2 text-left text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    {t('auth.logout')}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      openAuthModal('login');
                    }}
                    className="w-full px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                  >
                    {t('auth.login')}
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      openAuthModal('register');
                    }}
                    className="w-full px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-center"
                  >
                    {t('auth.register')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
