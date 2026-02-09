import { useEffect } from 'react';

/**
 * 모달이 열렸을 때 배경 스크롤을 방지하는 훅
 * @param isLocked 스크롤 락 여부
 */
export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    // 현재 스크롤 위치 저장
    const scrollY = window.scrollY;

    // body를 fixed로 만들어 스크롤 방지
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      // body 스타일 복원
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';

      // 스크롤 위치 복원
      window.scrollTo(0, scrollY);
    };
  }, [isLocked]);
}
