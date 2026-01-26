export function formatPrice(price: number, currency: string = 'KRW'): string {
  if (currency === 'KRW') {
    if (price >= 1000) {
      return price.toLocaleString('ko-KR', {
        maximumFractionDigits: 0,
      });
    }
    if (price >= 100) {
      return price.toLocaleString('ko-KR', {
        maximumFractionDigits: 1,
      });
    }
    if (price >= 1) {
      return price.toLocaleString('ko-KR', {
        maximumFractionDigits: 2,
      });
    }
    return price.toLocaleString('ko-KR', {
      maximumFractionDigits: 4,
    });
  }
  return price.toLocaleString('ko-KR', {
    maximumFractionDigits: 8,
  });
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(2)}%`;
}

export function formatVolume(volume: number): string {
  if (volume >= 1_000_000_000_000) {
    return `${(volume / 1_000_000_000_000).toFixed(1)}조`;
  }
  if (volume >= 100_000_000) {
    return `${(volume / 100_000_000).toFixed(1)}억`;
  }
  if (volume >= 10_000) {
    return `${(volume / 10_000).toFixed(1)}만`;
  }
  return volume.toLocaleString('ko-KR');
}

export function formatNumber(value: number, decimals: number = 2): string {
  return value.toLocaleString('ko-KR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function getChangeColor(change: 'RISE' | 'EVEN' | 'FALL'): string {
  switch (change) {
    case 'RISE':
      return 'text-rise';
    case 'FALL':
      return 'text-fall';
    default:
      return 'text-even';
  }
}

export function getChangeBgColor(change: 'RISE' | 'EVEN' | 'FALL'): string {
  switch (change) {
    case 'RISE':
      return 'bg-red-50';
    case 'FALL':
      return 'bg-blue-50';
    default:
      return 'bg-gray-50';
  }
}
