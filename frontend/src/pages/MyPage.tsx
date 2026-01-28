import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { mypageApi, UpdateProfileDto, ChangePasswordDto } from '../api/mypage.api';
import { useAuthStore } from '../store/authStore';
import '../styles/MyPage.css';

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
    if (passwords.newPassword.length < 6) {
      setError(t('mypage.passwordTooShort'));
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwords.currentPassword,
      newPassword: passwords.newPassword,
    });
  };

  const getStatusBadgeClass = (status: string) => {
    return status === 'ACTIVE' ? 'status-badge active' : 'status-badge inactive';
  };

  const getApprovalBadgeClass = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'approval-badge approved';
      case 'REJECTED':
        return 'approval-badge rejected';
      default:
        return 'approval-badge pending';
    }
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

  if (isLoading) {
    return (
      <div className="mypage-container">
        <div className="loading">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="mypage-container">
      <h1 className="page-title">{t('menu.mypage')}</h1>

      {success && <div className="success-message">{success}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="profile-card">
        <h2 className="section-title">{t('mypage.accountInfo')}</h2>

        <div className="profile-item">
          <span className="label">{t('mypage.email')}</span>
          <span className="value">{profile?.email}</span>
        </div>

        <div className="profile-item">
          <span className="label">{t('mypage.nickname')}</span>
          {isEditing ? (
            <input
              type="text"
              className="edit-input"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={t('mypage.nicknamePlaceholder')}
            />
          ) : (
            <span className="value">{profile?.nickname || '-'}</span>
          )}
        </div>

        <div className="profile-item">
          <span className="label">{t('mypage.role')}</span>
          <span className="value">{t(`roles.${profile?.role?.toLowerCase()}`)}</span>
        </div>

        <div className="profile-item">
          <span className="label">{t('mypage.status')}</span>
          <span className={getStatusBadgeClass(profile?.status || '')}>
            {t(`status.${profile?.status?.toLowerCase()}`)}
          </span>
        </div>

        <div className="profile-item">
          <span className="label">{t('mypage.approvalStatus')}</span>
          <span className={getApprovalBadgeClass(profile?.approvalStatus || '')}>
            {t(`approvalStatus.${profile?.approvalStatus?.toLowerCase()}`)}
          </span>
        </div>

        <div className="profile-item">
          <span className="label">{t('mypage.lastLogin')}</span>
          <span className="value">{formatDate(profile?.lastLoginAt)}</span>
        </div>

        <div className="profile-item">
          <span className="label">{t('mypage.memberSince')}</span>
          <span className="value">{formatDate(profile?.createdAt)}</span>
        </div>

        <div className="button-group">
          {isEditing ? (
            <>
              <button
                className="btn btn-primary"
                onClick={handleUpdateProfile}
                disabled={updateProfileMutation.isPending}
              >
                {t('common.save')}
              </button>
              <button
                className="btn btn-secondary"
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
              className="btn btn-primary"
              onClick={() => setIsEditing(true)}
            >
              {t('mypage.editProfile')}
            </button>
          )}
        </div>
      </div>

      <div className="profile-card">
        <h2 className="section-title">{t('mypage.security')}</h2>

        {showPasswordForm ? (
          <div className="password-form">
            <div className="form-group">
              <label>{t('mypage.currentPassword')}</label>
              <input
                type="password"
                value={passwords.currentPassword}
                onChange={(e) =>
                  setPasswords({ ...passwords, currentPassword: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>{t('mypage.newPassword')}</label>
              <input
                type="password"
                value={passwords.newPassword}
                onChange={(e) =>
                  setPasswords({ ...passwords, newPassword: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>{t('mypage.confirmPassword')}</label>
              <input
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) =>
                  setPasswords({ ...passwords, confirmPassword: e.target.value })
                }
              />
            </div>
            <div className="button-group">
              <button
                className="btn btn-primary"
                onClick={handleChangePassword}
                disabled={changePasswordMutation.isPending}
              >
                {t('mypage.changePassword')}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswords({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  });
                }}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        ) : (
          <button
            className="btn btn-secondary"
            onClick={() => setShowPasswordForm(true)}
          >
            {t('mypage.changePassword')}
          </button>
        )}
      </div>
    </div>
  );
}
