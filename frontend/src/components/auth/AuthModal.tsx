import { useState } from 'react';
import Modal from '../common/Modal';
import { useUIStore } from '../../store/uiStore';
import { useAuth } from '../../hooks/useAuth';

export default function AuthModal() {
  const { isAuthModalOpen, authModalMode, closeAuthModal } = useUIStore();
  const { login, register, isLoggingIn, isRegistering, loginError, registerError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authModalMode === 'login') {
      login({ email, password });
    } else {
      register({ email, password, nickname: nickname || undefined });
    }
  };

  const error = authModalMode === 'login' ? loginError : registerError;
  const isLoading = authModalMode === 'login' ? isLoggingIn : isRegistering;

  return (
    <Modal
      isOpen={isAuthModalOpen}
      onClose={closeAuthModal}
      title={authModalMode === 'login' ? '로그인' : '회원가입'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            이메일
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            비밀번호
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
            minLength={8}
          />
        </div>

        {authModalMode === 'register' && (
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
              닉네임 (선택)
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600">
            {(error as Error).message || '오류가 발생했습니다.'}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading
            ? '처리 중...'
            : authModalMode === 'login'
              ? '로그인'
              : '회원가입'}
        </button>
      </form>
    </Modal>
  );
}
