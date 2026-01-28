import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/admin.api';
import type { UserFilter, UserRole, UserStatus, ApprovalStatus, AdminUser } from '../../types/admin.types';
import '../../styles/admin/MemberManagement.css';

export default function MemberManagement() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [filter, setFilter] = useState<UserFilter>({});
  const [searchText, setSearchText] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', filter],
    queryFn: () => adminApi.getUsers(filter),
  });

  const users = data?.data || [];

  const handleSearch = () => {
    setFilter((prev) => ({
      ...prev,
      search: searchText || undefined,
    }));
  };

  const handleFilterChange = (
    key: keyof UserFilter,
    value: string | undefined
  ) => {
    setFilter((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleUserClick = (userId: string) => {
    navigate(`/admin/members/${userId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const getStatusBadge = (status: UserStatus) => {
    return (
      <span className={`status-badge ${status.toLowerCase()}`}>
        {t(`status.${status.toLowerCase()}`)}
      </span>
    );
  };

  const getApprovalBadge = (status: ApprovalStatus) => {
    return (
      <span className={`approval-badge ${status.toLowerCase()}`}>
        {t(`approvalStatus.${status.toLowerCase()}`)}
      </span>
    );
  };

  const getRoleBadge = (role: UserRole) => {
    return (
      <span className={`role-badge ${role.toLowerCase()}`}>
        {t(`roles.${role.toLowerCase()}`)}
      </span>
    );
  };

  return (
    <div className="member-management-container">
      <h1 className="page-title">{t('admin.memberManagement')}</h1>

      <div className="filter-section">
        <div className="filter-row">
          <div className="filter-group">
            <label>{t('admin.statusFilter')}</label>
            <select
              value={filter.status || ''}
              onChange={(e) =>
                handleFilterChange('status', e.target.value as UserStatus)
              }
            >
              <option value="">{t('common.all')}</option>
              <option value="ACTIVE">{t('status.active')}</option>
              <option value="INACTIVE">{t('status.inactive')}</option>
            </select>
          </div>

          <div className="filter-group">
            <label>{t('admin.approvalFilter')}</label>
            <select
              value={filter.approvalStatus || ''}
              onChange={(e) =>
                handleFilterChange(
                  'approvalStatus',
                  e.target.value as ApprovalStatus
                )
              }
            >
              <option value="">{t('common.all')}</option>
              <option value="PENDING">{t('approvalStatus.pending')}</option>
              <option value="APPROVED">{t('approvalStatus.approved')}</option>
              <option value="REJECTED">{t('approvalStatus.rejected')}</option>
            </select>
          </div>

          <div className="filter-group">
            <label>{t('admin.roleFilter')}</label>
            <select
              value={filter.role || ''}
              onChange={(e) =>
                handleFilterChange('role', e.target.value as UserRole)
              }
            >
              <option value="">{t('common.all')}</option>
              <option value="USER">{t('roles.user')}</option>
              <option value="ADMIN">{t('roles.admin')}</option>
              <option value="SYSTEM">{t('roles.system')}</option>
            </select>
          </div>
        </div>

        <div className="search-row">
          <input
            type="text"
            placeholder={t('admin.searchPlaceholder')}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="btn btn-primary" onClick={handleSearch}>
            {t('common.search')}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setFilter({});
              setSearchText('');
            }}
          >
            {t('common.reset')}
          </button>
        </div>
      </div>

      <div className="user-count">
        {t('admin.totalUsers')}: <strong>{users.length}</strong>
      </div>

      {isLoading ? (
        <div className="loading">{t('common.loading')}</div>
      ) : (
        <div className="user-table-wrapper">
          <table className="user-table">
            <thead>
              <tr>
                <th>{t('admin.email')}</th>
                <th>{t('admin.username')}</th>
                <th>{t('admin.nickname')}</th>
                <th>{t('admin.role')}</th>
                <th>{t('admin.status')}</th>
                <th>{t('admin.approval')}</th>
                <th>{t('admin.joinDate')}</th>
                <th>{t('admin.lastLogin')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: AdminUser) => (
                <tr
                  key={user.id}
                  onClick={() => handleUserClick(user.id)}
                  className="clickable-row"
                >
                  <td>{user.email}</td>
                  <td>{user.username}</td>
                  <td>{user.nickname || '-'}</td>
                  <td>{getRoleBadge(user.role)}</td>
                  <td>{getStatusBadge(user.status)}</td>
                  <td>{getApprovalBadge(user.approvalStatus)}</td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>{user.lastLoginAt ? formatDate(user.lastLoginAt) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && users.length === 0 && (
        <div className="no-results">{t('admin.noUsers')}</div>
      )}
    </div>
  );
}
