import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { mypageApi, UpdateProfileDto, ChangePasswordDto } from '../api/mypage.api';
import { useAuthStore } from '../store/authStore';

export default function MyPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [nickname, setNickname] = useState('');
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => mypageApi.getProfile(),
  });

  const profile = profileData?.data;

  useEffect(() => {
    if (profile) {
      setNickname(profile.nickname || '');
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileDto) => mypageApi.updateProfile(data),
    onSuccess: (response) => {
      setUser(response.data);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditing(false);
      setSuccess(t('mypage.updateSuccess'));
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: () => {
      setError(t('mypage.updateError'));
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordDto) => mypageApi.changePassword(data),
    onSuccess: () => {
      setShowPasswordForm(false);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccess(t('mypage.passwordChangeSuccess'));
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: () => {
      setError(t('mypage.passwordChangeError'));
    },
  });

  const handleUpdateProfile = () => {
    setError('');
    updateProfileMutation.mutate({ nickname });
  };

  const handleChangePassword = () => {
    setError('');
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError(t('mypage.passwordMismatch'));
      return;
    }
    if (passwords.newPassword.length < 10) {
      setError(t('mypage.passwordTooShort'));
      return;
    }
    if (!/[A-Za-z]/.test(passwords.newPassword)) {
      setError(t('auth.passwordNoLetter'));
      return;
    }
    if (!/\d/.test(passwords.newPassword)) {
      setError(t('auth.passwordNoNumber'));
      return;
    }
    if (!/[@$!%*#?&]/.test(passwords.newPassword)) {
      setError(t('auth.passwordNoSpecial'));
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwords.currentPassword,
      newPassword: passwords.newPassword,
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const isActive = status === 'ACTIVE';
    return (
      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
        {t(`status.${status?.toLowerCase()}`)}
      </span>
    );
  };

  const getApprovalBadge = (status: string) => {
    const colors: Record<string, string> = {
      APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    };
    return (
      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors[status] || colors.PENDING}`}>
        {t(`approvalStatus.${status?.toLowerCase()}`)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('menu.mypage')}</h1>

      {success && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 rounded-lg text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('mypage.accountInfo')}</h2>

        <div className="space-y-3">
          {[
            { label: t('mypage.email'), value: profile?.email },
            { label: t('mypage.username'), value: profile?.username },
            { label: t('mypage.name'), value: profile?.name },
          ].map((item) => (
            <div key={item.label} className="flex items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="w-32 text-sm font-medium text-gray-500 dark:text-gray-400">{item.label}</span>
              <span className="text-sm text-gray-900 dark:text-white">{item.value}</span>
            </div>
          ))}

          <div className="flex items-center py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="w-32 text-sm font-medium text-gray-500 dark:text-gray-400">{t('mypage.nickname')}</span>
            {isEditing ? (
              <input
                type="text"
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={t('mypage.nicknamePlaceholder')}
              />
            ) : (
              <span className="text-sm text-gray-900 dark:text-white">{profile?.nickname || '-'}</span>
            )}
          </div>

          {[
            { label: t('mypage.phone'), value: profile?.phone },
            { label: t('mypage.address'), value: profile?.address },
            { label: t('mypage.ssn'), value: profile?.ssnMasked || '-' },
          ].map((item) => (
            <div key={item.label} className="flex items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="w-32 text-sm font-medium text-gray-500 dark:text-gray-400">{item.label}</span>
              <span className="text-sm text-gray-900 dark:text-white">{item.value}</span>
            </div>
          ))}

          <div className="flex items-center py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="w-32 text-sm font-medium text-gray-500 dark:text-gray-400">{t('mypage.role')}</span>
            <span className="text-sm text-gray-900 dark:text-white">{t(`roles.${profile?.role?.toLowerCase()}`)}</span>
          </div>

          <div className="flex items-center py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="w-32 text-sm font-medium text-gray-500 dark:text-gray-400">{t('mypage.status')}</span>
            {getStatusBadge(profile?.status || '')}
          </div>

          <div className="flex items-center py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="w-32 text-sm font-medium text-gray-500 dark:text-gray-400">{t('mypage.approvalStatus')}</span>
            {getApprovalBadge(profile?.approvalStatus || '')}
          </div>

          {[
            { label: t('mypage.lastLogin'), value: formatDate(profile?.lastLoginAt) },
            { label: t('mypage.memberSince'), value: formatDate(profile?.createdAt) },
          ].map((item) => (
            <div key={item.label} className="flex items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="w-32 text-sm font-medium text-gray-500 dark:text-gray-400">{item.label}</span>
              <span className="text-sm text-gray-900 dark:text-white">{item.value}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-6">
          {isEditing ? (
            <>
              <button
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                onClick={handleUpdateProfile}
                disabled={updateProfileMutation.isPending}
              >
                {t('common.save')}
              </button>
              <button
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => {
                  setIsEditing(false);
                  setNickname(profile?.nickname || '');
                }}
              >
                {t('common.cancel')}
              </button>
            </>
          ) : (
            <button
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
              onClick={() => setIsEditing(true)}
            >
              {t('mypage.editProfile')}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('mypage.security')}</h2>

        {showPasswordForm ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('mypage.currentPassword')}</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('mypage.newPassword')}</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('mypage.confirmPassword')}</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                onClick={handleChangePassword}
                disabled={changePasswordMutation.isPending}
              >
                {t('mypage.changePassword')}
              </button>
              <button
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        ) : (
          <button
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            onClick={() => setShowPasswordForm(true)}
          >
            {t('mypage.changePassword')}
          </button>
        )}
      </div>
    </div>
  );
}
