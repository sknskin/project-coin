import { useEffect, useRef } from 'react';
import {
  createChart,
  IChartApi,
  UTCTimestamp,
} from 'lightweight-charts';
import type { Candle } from '../../types';

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

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      rightPriceScale: {
        borderColor: '#e0e0e0',
      },
      timeScale: {
        borderColor: '#e0e0e0',
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
  }, [candles, height]);

  return <div ref={chartContainerRef} className="w-full" />;
}
