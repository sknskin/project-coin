import { useTranslation } from 'react-i18next';
import type { PortfolioTab } from '../../types/portfolio.types';

interface PortfolioTabsProps {
  activeTab: PortfolioTab;
  onTabChange: (tab: PortfolioTab) => void;
}

const tabs: { key: PortfolioTab; labelKey: string }[] = [
  { key: 'overview', labelKey: 'portfolio.tabs.overview' },
  { key: 'analysis', labelKey: 'portfolio.tabs.analysis' },
  { key: 'holdings', labelKey: 'portfolio.tabs.holdings' },
];

export default function PortfolioTabs({ activeTab, onTabChange }: PortfolioTabsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === tab.key
              ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          {t(tab.labelKey)}
        </button>
      ))}
    </div>
  );
}
