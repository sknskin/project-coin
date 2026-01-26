import { useMemo, useEffect } from 'react';
import { useMarkets } from '../hooks/useMarketData';
import { useMarketWebSocket } from '../hooks/useWebSocket';
import { useUIStore } from '../store/uiStore';
import MarketTable from '../components/market/MarketTable';
import AuthModal from '../components/auth/AuthModal';
import Loading from '../components/common/Loading';

export default function Dashboard() {
  const { data: markets, isLoading, error } = useMarkets();
  const { isAuthModalOpen } = useUIStore();

  const marketCodes = useMemo(() => {
    return markets?.map((m) => m.market) || [];
  }, [markets]);

  useMarketWebSocket(marketCodes);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-600">데이터를 불러오는데 실패했습니다.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">코인 시세</h1>
        <p className="text-gray-600 mt-1">
          원화 마켓 기준 실시간 시세 정보입니다.
        </p>
      </div>

      {markets && <MarketTable markets={markets} />}

      {isAuthModalOpen && <AuthModal />}
    </div>
  );
}
