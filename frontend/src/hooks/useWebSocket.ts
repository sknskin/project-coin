import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useMarketStore } from '../store/marketStore';
import { WS_URL } from '../utils/constants';
import type { Ticker } from '../types';

export function useMarketWebSocket(markets: string[]) {
  const socketRef = useRef<Socket | null>(null);
  const updateTicker = useMarketStore((state) => state.updateTicker);

  useEffect(() => {
    if (markets.length === 0) return;

    const socket = io(`${WS_URL}/market`, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket connected');
      socket.emit('subscribe', { markets });
    });

    socket.on('ticker:update', (ticker: Ticker) => {
      updateTicker(ticker);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    return () => {
      if (socket.connected) {
        socket.emit('unsubscribe', { markets });
      }
      socket.disconnect();
    };
  }, [markets.join(','), updateTicker]);

  const subscribe = useCallback((newMarkets: string[]) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe', { markets: newMarkets });
    }
  }, []);

  const unsubscribe = useCallback((marketsToRemove: string[]) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe', { markets: marketsToRemove });
    }
  }, []);

  return { subscribe, unsubscribe };
}
