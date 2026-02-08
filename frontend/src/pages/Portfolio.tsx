import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { usePortfolio, usePortfolioStatus, useConnectUpbit, useReconnectUpbit, useDisconnectUpbit } from '../hooks/usePortfolio';
import PortfolioTabs from '../components/portfolio/PortfolioTabs';
import OverviewTab from '../components/portfolio/OverviewTab';
import AnalysisTab from '../components/portfolio/AnalysisTab';
import HoldingsList from '../components/portfolio/HoldingsList';
import Modal from '../components/common/Modal';
import ConfirmModal from '../components/common/ConfirmModal';
import Loading from '../components/common/Loading';
import type { PortfolioTab } from '../types/portfolio.types';

export default function Portfolio() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const { isUpbitConnectModalOpen, openUpbitConnectModal, closeUpbitConnectModal } = useUIStore();
  const { data: status, isLoading: isStatusLoading } = usePortfolioStatus();
  const { data: portfolio, isLoading: isPortfolioLoading, error, dataUpdatedAt, refetch, isFetching } = usePortfolio();
  const connectMutation = useConnectUpbit();
  const reconnectMutation = useReconnectUpbit();
  const disconnectMutation = useDisconnectUpbit();

  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PortfolioTab>('overview');

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleOpenConnectModal = (editMode: boolean = false) => {
    setIsEditMode(editMode);
    setAccessKey('');
    setSecretKey('');
    openUpbitConnectModal();
  };

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode) {
      reconnectMutation.mutate({ accessKey, secretKey });
    } else {
      connectMutation.mutate({ accessKey, secretKey });
    }
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate();
    setIsDisconnectModalOpen(false);
  };

  const currentMutation = isEditMode ? reconnectMutation : connectMutation;

  if (isStatusLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" />
      </div>
    );
  }

  if (!status?.isConnected) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">{t('portfolio.connectRequired')}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('portfolio.connectDescription')}
          </p>
          <button
            onClick={() => handleOpenConnectModal(false)}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            {t('portfolio.connect')}
          </button>
        </div>

        <Modal
          isOpen={isUpbitConnectModalOpen}
          onClose={closeUpbitConnectModal}
          title={t('portfolio.apiConnect')}
        >
          <form onSubmit={handleConnect} className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('portfolio.apiKeyDescription')}
              <br />
              <a
                href="https://upbit.com/mypage/open_api_management"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                {t('portfolio.getApiKey')}
              </a>
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('portfolio.accessKey')}
              </label>
              <input
                type="text"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('portfolio.secretKey')}
              </label>
              <input
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            {currentMutation.error && (
              <p className="text-sm text-red-600">
                {t('portfolio.connectFailed')}
              </p>
            )}

            <button
              type="submit"
              disabled={currentMutation.isPending}
              className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {currentMutation.isPending ? t('portfolio.connecting') : t('portfolio.connectSubmit')}
            </button>
          </form>
        </Modal>
      </div>
    );
  }

  if (isPortfolioLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-600">{t('portfolio.loadError')}</p>
      </div>
    );
  }

  if (!portfolio) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="mb-0">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('portfolio.title')}</h1>
        <div className="flex items-center justify-between mt-1 min-h-[36px]">
          <div className="flex items-center gap-3">
            <p className="text-gray-600 dark:text-gray-400">{t('portfolio.subtitle')}</p>
            {dataUpdatedAt && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {t('portfolio.lastUpdated')}: {format(new Date(dataUpdatedAt), 'HH:mm:ss')}
              </span>
            )}
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors disabled:opacity-50"
              title={t('portfolio.refresh')}
            >
              <svg
                className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleOpenConnectModal(true)}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {t('portfolio.editApiKey')}
            </button>
            <button
              onClick={() => setIsDisconnectModalOpen(true)}
              className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
            >
              {t('portfolio.disconnect')}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <PortfolioTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      {portfolio.holdings.length > 0 ? (
        <>
          {activeTab === 'overview' && <OverviewTab portfolio={portfolio} />}
          {activeTab === 'analysis' && <AnalysisTab portfolio={portfolio} />}
          {activeTab === 'holdings' && <HoldingsList holdings={portfolio.holdings} />}
        </>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
          {t('portfolio.noHoldings')}
        </div>
      )}

      {/* API 키 수정 모달 */}
      <Modal
        isOpen={isUpbitConnectModalOpen}
        onClose={closeUpbitConnectModal}
        title={isEditMode ? t('portfolio.editApiKey') : t('portfolio.apiConnect')}
      >
        <form onSubmit={handleConnect} className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {isEditMode ? t('portfolio.editApiKeyDescription') : t('portfolio.apiKeyDescription')}
            <br />
            <a
              href="https://upbit.com/mypage/open_api_management"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              {t('portfolio.getApiKey')}
            </a>
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('portfolio.accessKey')}
            </label>
            <input
              type="text"
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('portfolio.secretKey')}
            </label>
            <input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          {currentMutation.error && (
            <p className="text-sm text-red-600">
              {t('portfolio.connectFailed')}
            </p>
          )}

          <button
            type="submit"
            disabled={currentMutation.isPending}
            className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {currentMutation.isPending
              ? t('portfolio.connecting')
              : (isEditMode ? t('portfolio.updateApiKey') : t('portfolio.connectSubmit'))}
          </button>
        </form>
      </Modal>

      {/* 연동 해제 확인 모달 */}
      <ConfirmModal
        isOpen={isDisconnectModalOpen}
        onClose={() => setIsDisconnectModalOpen(false)}
        onConfirm={handleDisconnect}
        title={t('portfolio.disconnectTitle')}
        message={t('portfolio.disconnectConfirm')}
        confirmText={t('portfolio.disconnect')}
        cancelText={t('common.cancel')}
        variant="danger"
      />
    </div>
  );
}
