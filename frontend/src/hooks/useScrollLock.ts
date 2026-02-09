import { useEffect } from 'react';

/**
 * 모달이 열렸을 때 배경 스크롤을 방지하는 훅
 * @param isLocked 스크롤 락 여부
 */
export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    // 스크롤바 너비 계산
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    const htmlElement = document.documentElement;
    htmlElement.style.overflow = 'hidden';
    htmlElement.style.paddingRight = `${scrollbarWidth}px`;
    // CSS 변수로 설정하여 fixed 요소들도 사용 가능하게 함
    htmlElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);

    return () => {
      htmlElement.style.overflow = '';
      htmlElement.style.paddingRight = '';
      htmlElement.style.setProperty('--scrollbar-width', '0px');
    };
  }, [isLocked]);
}
