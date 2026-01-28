import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal';
import ConfirmModal from '../common/ConfirmModal';
import { useUIStore } from '../../store/uiStore';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../api/auth.api';

interface FormErrors {
  email?: string;
  username?: string;
  password?: string;
  passwordConfirm?: string;
  nickname?: string;
  name?: string;
  phone?: string;
  address?: string;
  ssn?: string;
}

export default function AuthModal() {
  const { t } = useTranslation();
  const { isAuthModalOpen, authModalMode, closeAuthModal, setAuthModalMode } = useUIStore();
  const { login, register, isLoggingIn, isRegistering, loginError, registerError, registerSuccess, registerData, resetRegister } = useAuth();

  // 로그인 폼
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // 회원가입 폼
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [ssnFirst, setSsnFirst] = useState('');
  const [ssnSecond, setSsnSecond] = useState('');

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // 회원가입 성공 시 처리
  useEffect(() => {
    if (registerSuccess && registerData) {
      setIsSuccessModalOpen(true);
    }
  }, [registerSuccess, registerData]);

  const validatePassword = (pwd: string): string | undefined => {
    if (pwd.length < 10) {
      return t('auth.passwordTooShort');
    }
    if (!/[A-Za-z]/.test(pwd)) {
      return t('auth.passwordNoLetter');
    }
    if (!/\d/.test(pwd)) {
      return t('auth.passwordNoNumber');
    }
    if (!/[@$!%*#?&]/.test(pwd)) {
      return t('auth.passwordNoSpecial');
    }
    return undefined;
  };

  const validateForm = async (): Promise<boolean> => {
    const errors: FormErrors = {};

    // 이메일 검증
    if (!email) {
      errors.email = t('auth.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = t('auth.emailInvalid');
    } else {
      try {
        const { available } = await authApi.checkEmail(email);
        if (!available) {
          errors.email = t('auth.emailTaken');
        }
      } catch {
        // 네트워크 오류 무시
      }
    }

    // 아이디 검증
    if (!username) {
      errors.username = t('auth.usernameRequired');
    } else if (username.length < 4) {
      errors.username = t('auth.usernameTooShort');
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.username = t('auth.usernameInvalid');
    } else {
      try {
        const { available } = await authApi.checkUsername(username);
        if (!available) {
          errors.username = t('auth.usernameTaken');
        }
      } catch {
        // 네트워크 오류 무시
      }
    }

    // 비밀번호 검증
    const passwordError = validatePassword(password);
    if (passwordError) {
      errors.password = passwordError;
    }

    // 비밀번호 확인 검증
    if (password !== passwordConfirm) {
      errors.passwordConfirm = t('auth.passwordMismatch');
    }

    // 닉네임 검증 (선택값이지만 입력 시 중복 체크)
    if (nickname) {
      try {
        const { available } = await authApi.checkNickname(nickname);
        if (!available) {
          errors.nickname = t('auth.nicknameTaken');
        }
      } catch {
        // 네트워크 오류 무시
      }
    }

    // 성명 검증
    if (!name || name.length < 2) {
      errors.name = t('auth.nameRequired');
    }

    // 연락처 검증 (숫자만, 하이픈 없음)
    if (!phone) {
      errors.phone = t('auth.phoneRequired');
    } else if (!/^[0-9]+$/.test(phone) || phone.length < 10 || phone.length > 11) {
      errors.phone = t('auth.phoneInvalid');
    }

    // 주소 검증
    if (!address || address.length < 5) {
      errors.address = t('auth.addressRequired');
    }

    // 주민등록번호 검증
    if (!ssnFirst || ssnFirst.length !== 6 || !/^\d{6}$/.test(ssnFirst)) {
      errors.ssn = t('auth.ssnInvalid');
    } else if (!ssnSecond || ssnSecond.length !== 7 || !/^\d{7}$/.test(ssnSecond)) {
      errors.ssn = t('auth.ssnInvalid');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ emailOrUsername, password: loginPassword });
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await validateForm();
    if (isValid) {
      setIsConfirmModalOpen(true);
    }
  };

  const handleRegisterConfirm = async () => {
    setIsConfirmModalOpen(false);
    try {
      await register({
        email,
        username,
        password,
        nickname: nickname || undefined,
        name,
        phone,
        address,
        ssn: `${ssnFirst}-${ssnSecond}`,
      });
    } catch {
      // Error is handled by the hook
    }
  };

  const handleSuccessClose = () => {
    setIsSuccessModalOpen(false);
    resetRegister();
    closeAuthModal();
    // 폼 초기화
    setEmail('');
    setUsername('');
    setPassword('');
    setPasswordConfirm('');
    setNickname('');
    setName('');
    setPhone('');
    setAddress('');
    setSsnFirst('');
    setSsnSecond('');
    setFormErrors({});
  };

  const switchMode = () => {
    setAuthModalMode(authModalMode === 'login' ? 'register' : 'login');
    setFormErrors({});
  };

  const error = authModalMode === 'login' ? loginError : registerError;
  const isLoading = authModalMode === 'login' ? isLoggingIn : isRegistering;

  return (
    <Modal
      isOpen={isAuthModalOpen}
      onClose={closeAuthModal}
      title={authModalMode === 'login' ? t('auth.login') : t('auth.register')}
    >
      {authModalMode === 'login' ? (
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label htmlFor="emailOrUsername" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.emailOrUsername')}
            </label>
            <input
              type="text"
              id="emailOrUsername"
              value={emailOrUsername}
              onChange={(e) => {
                const val = e.target.value.replace(/[^a-zA-Z0-9@._\-+]/g, '');
                setEmailOrUsername(val);
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="loginPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.password')}
            </label>
            <input
              type="password"
              id="loginPassword"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">
              {(error as Error).message || t('auth.error')}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t('auth.processing') : t('auth.login')}
          </button>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            {t('auth.noAccount')}{' '}
            <button type="button" onClick={switchMode} className="text-primary-600 hover:underline">
              {t('auth.register')}
            </button>
          </p>
        </form>
      ) : (
        <form onSubmit={handleRegisterSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto overflow-x-hidden pr-1">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.email')} <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${formErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              required
              autoComplete="email"
            />
            {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.username')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${formErrors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              required
              autoComplete="username"
            />
            {formErrors.username && <p className="text-xs text-red-500 mt-1">{formErrors.username}</p>}
            <p className="text-xs text-gray-500 mt-1">{t('auth.usernameHint')}</p>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.password')} <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${formErrors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              required
              autoComplete="new-password"
            />
            {formErrors.password && <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>}
            <p className="text-xs text-gray-500 mt-1">{t('auth.passwordHint')}</p>
          </div>

          <div>
            <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.passwordConfirm')} <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="passwordConfirm"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${formErrors.passwordConfirm ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              required
              autoComplete="new-password"
            />
            {formErrors.passwordConfirm && <p className="text-xs text-red-500 mt-1">{formErrors.passwordConfirm}</p>}
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.name')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              required
              autoComplete="name"
            />
            {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
          </div>

          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.nicknameOptional')}
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${formErrors.nickname ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              autoComplete="nickname"
            />
            {formErrors.nickname && <p className="text-xs text-red-500 mt-1">{formErrors.nickname}</p>}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.phone')} <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="01012345678"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${formErrors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              required
              autoComplete="tel"
              maxLength={11}
            />
            {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
            <p className="text-xs text-gray-500 mt-1">{t('auth.phoneHint')}</p>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.address')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${formErrors.address ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              required
              autoComplete="street-address"
            />
            {formErrors.address && <p className="text-xs text-red-500 mt-1">{formErrors.address}</p>}
          </div>

          <div>
            <label htmlFor="ssn" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.ssn')} <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                id="ssnFirst"
                value={ssnFirst}
                onChange={(e) => setSsnFirst(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="900101"
                className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${formErrors.ssn ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                required
                maxLength={6}
              />
              <span className="text-gray-500">-</span>
              <input
                type="password"
                id="ssnSecond"
                value={ssnSecond}
                onChange={(e) => setSsnSecond(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="*******"
                className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${formErrors.ssn ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                required
                maxLength={7}
              />
            </div>
            {formErrors.ssn && <p className="text-xs text-red-500 mt-1">{formErrors.ssn}</p>}
            <p className="text-xs text-gray-500 mt-1">{t('auth.ssnHint')}</p>
          </div>

          {error && (
            <p className="text-sm text-red-600">
              {(error as Error).message || t('auth.error')}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t('auth.processing') : t('auth.register')}
          </button>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            {t('auth.hasAccount')}{' '}
            <button type="button" onClick={switchMode} className="text-primary-600 hover:underline">
              {t('auth.login')}
            </button>
          </p>
        </form>
      )}

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleRegisterConfirm}
        title={t('auth.register')}
        message={t('auth.registerConfirm', { email })}
        confirmText={t('auth.register')}
        cancelText={t('common.cancel')}
        isLoading={isRegistering}
      />

      <ConfirmModal
        isOpen={isSuccessModalOpen}
        onClose={handleSuccessClose}
        onConfirm={handleSuccessClose}
        title={t('auth.registerSuccess')}
        message={registerData?.message || t('auth.registerSuccessMessage')}
        confirmText={t('common.confirm')}
        showCancel={false}
      />
    </Modal>
  );
}
