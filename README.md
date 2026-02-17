# Project Coin - 업비트 코인 시세 대시보드

업비트 API를 활용한 실시간 코인 시세 조회 및 포트폴리오 관리 웹 애플리케이션입니다.

## 기능

- 실시간 코인 시세 조회 (WebSocket)
- 캔들스틱 차트 (다양한 시간 프레임)
- 회원가입/로그인
- 업비트 API 연동
- 포트폴리오 조회 (보유 코인, 손익)

## 기술 스택

### Backend
- NestJS
- Prisma (PostgreSQL)
- Socket.IO
- JWT Authentication

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS
- TanStack Query (React Query)
- Zustand
- Lightweight Charts

## 시작하기

### 사전 요구사항

- Node.js 18+
- Docker & Docker Compose
- pnpm 또는 npm

### 설치 및 실행

1. **저장소 클론**
```bash
git clone https://github.com/sknskin/project-coin.git
cd project-coin
```

2. **환경 변수 설정**
```bash
cp .env.example .env
# .env 파일을 편집하여 필요한 값 설정
```

3. **Docker로 PostgreSQL 실행**
```bash
docker-compose up -d
```

4. **백엔드 설정 및 실행**
```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

5. **프론트엔드 설정 및 실행** (새 터미널)
```bash
cd frontend
npm install
npm run dev
```

6. **브라우저에서 접속**
```
http://localhost:5173
```

## 프로젝트 구조

```
project-coin/
├── docker-compose.yml
├── .env
├── backend/
│   ├── src/
│   │   ├── auth/          # 인증 모듈
│   │   ├── users/         # 사용자 모듈
│   │   ├── upbit/         # 업비트 API 연동
│   │   ├── portfolio/     # 포트폴리오 관리
│   │   ├── websocket/     # WebSocket Gateway
│   │   └── prisma/        # Prisma 서비스
│   └── prisma/
│       └── schema.prisma  # DB 스키마
└── frontend/
    └── src/
        ├── api/           # API 클라이언트
        ├── components/    # React 컴포넌트
        ├── pages/         # 페이지 컴포넌트
        ├── hooks/         # Custom Hooks
        ├── store/         # Zustand 스토어
        └── types/         # TypeScript 타입
```

## API 엔드포인트

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `POST /api/auth/refresh` - 토큰 갱신
- `GET /api/auth/me` - 현재 사용자 정보

### 마켓
- `GET /api/markets` - 마켓 목록
- `GET /api/markets/:code/ticker` - 현재가
- `GET /api/markets/:code/candles` - 캔들 데이터

### 포트폴리오
- `POST /api/portfolio/connect` - 업비트 API 연동
- `DELETE /api/portfolio/disconnect` - 연동 해제
- `GET /api/portfolio` - 포트폴리오 조회
- `GET /api/portfolio/status` - 연동 상태

### WebSocket
- 네임스페이스: `/market`
- `subscribe` - 마켓 구독
- `unsubscribe` - 구독 해제
- `ticker:update` - 실시간 시세 업데이트

## 라이선스

MIT
