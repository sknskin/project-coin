import { useEffect, useRef, useCallback } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
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
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const isFirstDataLoadRef = useRef(true);
  const theme = useUIStore((state) => state.theme);

  const chartColors = {
    light: {
      background: '#ffffff',
      textColor: '#333333',
      gridColor: '#f0f0f0',
      borderColor: '#e0e0e0',
    },
    dark: {
      background: '#1f2937',
      textColor: '#e5e7eb',
      gridColor: '#374151',
      borderColor: '#4b5563',
    },
  };

  const colors = chartColors[theme];

  const formatCandles = useCallback((rawCandles: Candle[]) => {
    return rawCandles
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
  }, []);

  // Effect 1: 차트 인스턴스 생성 (마운트/높이 변경 시에만)
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

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#ef4444',
      downColor: '#3b82f6',
      borderUpColor: '#ef4444',
      borderDownColor: '#3b82f6',
      wickUpColor: '#ef4444',
      wickDownColor: '#3b82f6',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;
    isFirstDataLoadRef.current = true;

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
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [height]);

  // Effect 2: 테마 변경 시 차트 옵션만 업데이트 (차트 재생성 없이)
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.applyOptions({
      layout: {
        background: { color: colors.background },
        textColor: colors.textColor,
      },
      grid: {
        vertLines: { color: colors.gridColor },
        horzLines: { color: colors.gridColor },
      },
      rightPriceScale: { borderColor: colors.borderColor },
      timeScale: { borderColor: colors.borderColor },
    });
  }, [colors]);

  // Effect 3: 데이터 업데이트 (줌/팬 상태 유지)
  useEffect(() => {
    if (!seriesRef.current || !candles || candles.length === 0) return;
    const formattedData = formatCandles(candles);
    seriesRef.current.setData(formattedData);

    // 최초 데이터 로드 시에만 전체 표시
    if (isFirstDataLoadRef.current && chartRef.current) {
      chartRef.current.timeScale().fitContent();
      isFirstDataLoadRef.current = false;
    }
  }, [candles, formatCandles]);

  return <div ref={chartContainerRef} className="w-full" />;
}
