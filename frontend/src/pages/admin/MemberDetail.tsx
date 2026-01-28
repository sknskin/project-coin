import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../api/admin.api';
import type { UserRole, UserStatus, LoginHistory } from '../../types/admin.types';
import '../../styles/admin/MemberDetail.css';

export default function MemberDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('USER');
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => adminApi.getUserDetail(id!),
    enabled: !!id,
  });

  const user = data?.data;

  const approveMutation = useMutation({
    mutationFn: () => adminApi.approveUser(id!, selectedRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowApprovalModal(false);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => adminApi.rejectUser(id!, rejectReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowRejectModal(false);
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: UserStatus) => adminApi.updateUserStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteUser(id!),
    onSuccess: () => {
      navigate('/admin/members');
    },
  });

  const handleDelete = () => {
    if (window.confirm(t('admin.confirmDelete'))) {
      deleteMutation.mutate();
    }
  };

  const handleToggleStatus = () => {
    if (!user) return;
    const newStatus: UserStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (window.confirm(t('admin.confirmStatusChange'))) {
      statusMutation.mutate(newStatus);
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
      <div className="member-detail-container">
        <div className="loading">{t('common.loading')}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="member-detail-container">
        <div className="error">{t('admin.userNotFound')}</div>
      </div>
    );
  }

  return (
    <div className="member-detail-container">
      <div className="header-row">
        <button className="btn btn-back" onClick={() => navigate('/admin/members')}>
          &larr; {t('common.back')}
        </button>
        <h1 className="page-title">{t('admin.memberDetail')}</h1>
      </div>

      <div className="detail-card">
        <h2 className="section-title">{t('admin.basicInfo')}</h2>

        <div className="info-grid">
          <div className="info-item">
            <span className="label">{t('admin.email')}</span>
            <span className="value">{user.email}</span>
          </div>
          <div className="info-item">
            <span className="label">{t('admin.nickname')}</span>
            <span className="value">{user.nickname || '-'}</span>
          </div>
          <div className="info-item">
            <span className="label">{t('admin.role')}</span>
            <span className={`role-badge ${user.role.toLowerCase()}`}>
              {t(`roles.${user.role.toLowerCase()}`)}
            </span>
          </div>
          <div className="info-item">
            <span className="label">{t('admin.status')}</span>
            <span className={`status-badge ${user.status.toLowerCase()}`}>
              {t(`status.${user.status.toLowerCase()}`)}
            </span>
          </div>
          <div className="info-item">
            <span className="label">{t('admin.approval')}</span>
            <span className={`approval-badge ${user.approvalStatus.toLowerCase()}`}>
              {t(`approvalStatus.${user.approvalStatus.toLowerCase()}`)}
            </span>
          </div>
          <div className="info-item">
            <span className="label">{t('admin.joinDate')}</span>
            <span className="value">{formatDate(user.createdAt)}</span>
          </div>
          <div className="info-item">
            <span className="label">{t('admin.lastLogin')}</span>
            <span className="value">{formatDate(user.lastLoginAt || undefined)}</span>
          </div>
        </div>

        {user.approvalStatus === 'REJECTED' && (
          <div className="reject-info">
            <h3>{t('admin.rejectInfo')}</h3>
            <p>
              <strong>{t('admin.rejectedAt')}:</strong> {formatDate(user.rejectedAt || undefined)}
            </p>
            {user.rejectReason && (
              <p>
                <strong>{t('admin.rejectReason')}:</strong> {user.rejectReason}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="detail-card">
        <h2 className="section-title">{t('admin.actions')}</h2>

        <div className="action-buttons">
          {user.approvalStatus === 'PENDING' && (
            <>
              <button
                className="btn btn-success"
                onClick={() => setShowApprovalModal(true)}
              >
                {t('admin.approve')}
              </button>
              <button
                className="btn btn-warning"
                onClick={() => setShowRejectModal(true)}
              >
                {t('admin.reject')}
              </button>
            </>
          )}

          {user.approvalStatus === 'APPROVED' && (
            <button className="btn btn-secondary" onClick={handleToggleStatus}>
              {user.status === 'ACTIVE'
                ? t('admin.deactivate')
                : t('admin.activate')}
            </button>
          )}

          <button className="btn btn-danger" onClick={handleDelete}>
            {t('admin.forceDelete')}
          </button>
        </div>
      </div>

      {user.loginHistories && user.loginHistories.length > 0 && (
        <div className="detail-card">
          <h2 className="section-title">{t('admin.loginHistory')}</h2>
          <div className="login-history">
            {user.loginHistories.slice(0, 10).map((history: LoginHistory, index: number) => (
              <div key={index} className="history-item">
                <span className="history-date">{formatDate(history.loginAt)}</span>
                <span className="history-ip">{history.ipAddress || '-'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="modal-overlay" onClick={() => setShowApprovalModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t('admin.approveTitle')}</h3>
            <p>{t('admin.selectRole')}</p>
            <div className="role-selection">
              <label>
                <input
                  type="radio"
                  name="role"
                  value="USER"
                  checked={selectedRole === 'USER'}
                  onChange={() => setSelectedRole('USER')}
                />
                {t('roles.user')}
              </label>
              <label>
                <input
                  type="radio"
                  name="role"
                  value="ADMIN"
                  checked={selectedRole === 'ADMIN'}
                  onChange={() => setSelectedRole('ADMIN')}
                />
                {t('roles.admin')}
              </label>
            </div>
            <div className="modal-buttons">
              <button
                className="btn btn-success"
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
              >
                {t('admin.approve')}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowApprovalModal(false)}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t('admin.rejectTitle')}</h3>
            <div className="form-group">
              <label>{t('admin.rejectReasonLabel')}</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t('admin.rejectReasonPlaceholder')}
              />
            </div>
            <div className="modal-buttons">
              <button
                className="btn btn-warning"
                onClick={() => rejectMutation.mutate()}
                disabled={rejectMutation.isPending}
              >
                {t('admin.reject')}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowRejectModal(false)}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
