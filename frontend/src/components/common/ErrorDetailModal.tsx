import { AxiosError } from 'axios';
import Modal from './Modal';
import { useTranslation } from 'react-i18next';
import { useToastStore } from '../../store/toastStore';

interface ErrorDetail {
  status?: number;
  statusText?: string;
  message?: string;
  url?: string;
  method?: string;
  timestamp?: string;
  rawError?: string;
}

interface ErrorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: Error | AxiosError | null;
  title?: string;
}

function extractErrorDetails(error: Error | AxiosError | null): ErrorDetail {
  if (!error) {
    return {};
  }

  const details: ErrorDetail = {
    message: error.message,
    timestamp: new Date().toISOString(),
  };

  // Axios 에러인 경우 추가 정보 추출
  if ('response' in error && error.response) {
    const axiosError = error as AxiosError<{ message?: string | string[]; error?: string }>;
    details.status = axiosError.response?.status;
    details.statusText = axiosError.response?.statusText;
    details.url = axiosError.config?.url;
    details.method = axiosError.config?.method?.toUpperCase();

    // 서버에서 반환한 원본 에러 메시지
    const responseData = axiosError.response?.data;
    if (responseData) {
      if (typeof responseData.message === 'string') {
        details.rawError = responseData.message;
      } else if (Array.isArray(responseData.message)) {
        details.rawError = responseData.message.join(', ');
      } else if (responseData.error) {
        details.rawError = responseData.error;
      }
    }
  } else if ('code' in error) {
    // 네트워크 오류 등
    const axiosError = error as AxiosError;
    details.rawError = axiosError.code;
    details.url = axiosError.config?.url;
    details.method = axiosError.config?.method?.toUpperCase();
  }

  return details;
}

export default function ErrorDetailModal({ isOpen, onClose, error, title }: ErrorDetailModalProps) {
  const { t } = useTranslation();
  const { addToast } = useToastStore();
  const details = extractErrorDetails(error);

  const handleCopy = () => {
    const text = JSON.stringify(details, null, 2);
    navigator.clipboard.writeText(text);
    addToast(t('error.copied'), 'success');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || t('error.detailTitle')} size="md">
      <div className="space-y-4">
        {/* 요약 */}
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-red-700 dark:text-red-300 font-medium">
            {details.message || t('error.unknown')}
          </p>
        </div>

        {/* 상세 정보 */}
        <div className="space-y-3">
          {details.status && (
            <div className="flex items-start">
              <span className="w-24 text-sm font-medium text-gray-500 dark:text-gray-400 shrink-0">
                {t('error.statusCode')}
              </span>
              <span className="text-sm text-gray-900 dark:text-white">
                {details.status} {details.statusText && `(${details.statusText})`}
              </span>
            </div>
          )}

          {details.method && details.url && (
            <div className="flex items-start">
              <span className="w-24 text-sm font-medium text-gray-500 dark:text-gray-400 shrink-0">
                {t('error.endpoint')}
              </span>
              <span className="text-sm text-gray-900 dark:text-white font-mono break-all">
                {details.method} {details.url}
              </span>
            </div>
          )}

          {details.rawError && details.rawError !== details.message && (
            <div className="flex items-start">
              <span className="w-24 text-sm font-medium text-gray-500 dark:text-gray-400 shrink-0">
                {t('error.serverMessage')}
              </span>
              <span className="text-sm text-gray-900 dark:text-white break-all">
                {details.rawError}
              </span>
            </div>
          )}

          {details.timestamp && (
            <div className="flex items-start">
              <span className="w-24 text-sm font-medium text-gray-500 dark:text-gray-400 shrink-0">
                {t('error.timestamp')}
              </span>
              <span className="text-sm text-gray-900 dark:text-white font-mono">
                {details.timestamp}
              </span>
            </div>
          )}
        </div>

        {/* 복사 버튼 */}
        <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleCopy}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {t('error.copyDetails')}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors ml-2"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
