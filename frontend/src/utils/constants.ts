export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

export const TIMEFRAMES = [
  { label: '1분', value: 1, type: 'minutes' as const },
  { label: '3분', value: 3, type: 'minutes' as const },
  { label: '5분', value: 5, type: 'minutes' as const },
  { label: '15분', value: 15, type: 'minutes' as const },
  { label: '30분', value: 30, type: 'minutes' as const },
  { label: '1시간', value: 60, type: 'minutes' as const },
  { label: '4시간', value: 240, type: 'minutes' as const },
  { label: '일', value: 1, type: 'days' as const },
  { label: '주', value: 1, type: 'weeks' as const },
  { label: '월', value: 1, type: 'months' as const },
] as const;

export type TimeframeType = (typeof TIMEFRAMES)[number]['type'];
