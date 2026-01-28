import { useEffect, useRef } from 'react';
import {
  createChart,
  IChartApi,
  UTCTimestamp,
} from 'lightweight-charts';
import type { Candle } from '../../types';
import { useUIStore } from '../../store/uiStore';

interface CoinChartProps {
  candles: Candle[];
  height?: number;
}

export default function CoinChart({
  candles,
  height = 400,
}: CoinChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const theme = useUIStore((state) => state.theme);

  // 테마별 차트 색상 설정
  const chartColors = {
    light: {
      background: '#ffffff',
      textColor: '#333333',
      gridColor: '#f0f0f0',
      borderColor: '#e0e0e0',
    },
    dark: {
      background: '#1f2937', // gray-800
      textColor: '#e5e7eb', // gray-200
      gridColor: '#374151', // gray-700
      borderColor: '#4b5563', // gray-600
    },
  };

  const colors = chartColors[theme];

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height,
      layout: {
        background: { color: colors.background },
        textColor: colors.textColor,
      },
      grid: {
        vertLines: { color: colors.gridColor },
        horzLines: { color: colors.gridColor },
      },
      rightPriceScale: {
        borderColor: colors.borderColor,
      },
      timeScale: {
        borderColor: colors.borderColor,
        timeVisible: true,
      },
      crosshair: {
        mode: 1,
      },
    });

    chartRef.current = chart;

    // ✅ 캔들 시리즈 생성 (v4 정식 API)
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#ef4444',
      downColor: '#3b82f6',
      borderUpColor: '#ef4444',
      borderDownColor: '#3b82f6',
      wickUpColor: '#ef4444',
      wickDownColor: '#3b82f6',
    });

    // ✅ 데이터 포맷 (UTCTimestamp 캐스팅)
    const formattedData = candles
      .map((candle) => ({
        time: Math.floor(
          new Date(candle.candle_date_time_kst).getTime() / 1000
        ) as UTCTimestamp,
        open: candle.opening_price,
        high: candle.high_price,
        low: candle.low_price,
        close: candle.trade_price,
      }))
      .sort((a, b) => a.time - b.time);

    candlestickSeries.setData(formattedData);
    chart.timeScale().fitContent();

    // ✅ 리사이즈 대응
    const handleResize = () => {
      if (!chartContainerRef.current || !chartRef.current) return;

      chartRef.current.applyOptions({
        width: chartContainerRef.current.clientWidth,
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [candles, height, colors]);

  return <div ref={chartContainerRef} className="w-full" />;
}
