# PICKDAY_BE

PICKDAY 백엔드 API 서버 레포지토리입니다.

Express + TypeScript + Prisma 기반으로, 도메인 단위(`domains`)로 기능을 분리합니다.

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express 5
- **ORM**: Prisma 7
- **Database**: MySQL
- **Validation**: Zod
- **Auth**: jsonwebtoken
- **Package Manager**: pnpm

## Folder Structure

```text
PICKDAY_BE/
├── .github/
│   ├── ISSUE_TEMPLATE/          # Feature / Bug / Refactor 이슈 템플릿
│   └── PULL_REQUEST_TEMPLATE.md # PR 템플릿
├── docs/                        # API·기능 명세서 등 문서(gitignore)
├── prisma/
│   ├── migrations/              # Prisma 마이그레이션
│   └── schema.prisma            # DB 스키마 (MySQL)
├── src/
│   ├── common/                  # 공통 유틸 (응답/에러/상수)
│   │   ├── constants.ts
│   │   ├── error.ts
│   │   ├── errorCode.ts
│   │   ├── errorHandler.ts
│   │   └── response.ts
│   ├── config/                  # 앱/인프라 설정
│   │   ├── prisma.ts
│   │   ├── s3.ts
│   │   └── swagger.ts
│   ├── domains/                 # 도메인별 비즈니스 로직
│   │   ├── auth/                # 인증·소셜 로그인·약관
│   │   ├── image/               # 이미지 업로드 (S3)
│   │   ├── reservation/         # 예약
│   │   ├── review/              # 리뷰
│   │   ├── search/              # (예정)
│   │   ├── studio/              # 스튜디오
│   │   ├── user/                # (예정)
│   │   └── wishlist/            # 위시리스트
│   ├── generated/               # 생성물 (gitignore)
│   │   ├── prisma/              # Prisma Client
│   │   └── routes.ts            # tsoa 라우트
│   ├── seed.ts                  # 시드 데이터
│   └── server/
│       ├── authentication.ts    # tsoa 인증 미들웨어
│       └── server.ts            # 앱 진입점 / 라우터 등록
├── terms/                       # 약관 마크다운 (auth)
│   └── auth/
├── .env.example
├── eslint.config.js
├── package.json
├── pnpm-lock.yaml
├── prisma.config.ts
├── tsconfig.json
└── tsoa.json
```

### Domain Layer Convention

각 도메인은 아래 구조를 따릅니다.

| 파일 | 역할 |
|------|------|
| `*.router.ts` | 라우트 정의 |
| `*.controller.ts` | 요청/응답 처리 |
| `*.service.ts` | 비즈니스 로직 |
| `*.repository.ts` | DB 접근 |
| `*.dto.ts` | Zod 스키마 / 입력 검증 |

## Getting Started

### 1. 요구사항

- Node.js
- pnpm (`packageManager`: `pnpm@10.26.2`)
- MySQL

### 2. 설치

```bash
pnpm install
```

### 3. 환경 변수

`.env.example`을 복사해 `.env`를 만들고 값을 채웁니다.

```bash
cp .env.example .env
```

```env
PORT=3000
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/pickday"
JWT_SECRET="change-me"
JWT_ACCESS_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"
```

### 4. Prisma Client 생성 / DB 동기화

```bash
pnpm exec prisma generate
pnpm exec prisma db push
# 또는
pnpm exec prisma migrate dev
```

### 5. 실행

```bash
# 개발
pnpm dev

# 빌드
pnpm build

# 프로덕션 실행
pnpm start
```

서버 기본 포트: `http://localhost:3000`

## API Routes (현재)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/health` | 헬스 체크 |
| - | `/api/v1/auth` | 인증 도메인 |
| - | `/api/v1/studios` | 스튜디오 도메인 |
| - | `/api/v1/reservations` | 예약 도메인 |

## Scripts

| Script | 설명 |
|--------|------|
| `pnpm dev` | 개발 서버 (`tsx watch`) |
| `pnpm build` | TypeScript 빌드 |
| `pnpm start` | 빌드 결과 실행 |
| `pnpm format` | Prettier 포맷 |
| `pnpm lint` | ESLint 검사 |

## Branch / Commit Convention

브랜치 예시:

```text
chore/{이슈번호}-{설명}
feat/{이슈번호}-{설명}
fix/{이슈번호}-{설명}
```

커밋 메시지 예시:

```text
feat: auth 모델 Prisma schema 구현 (#15)
chore: 이슈/PR 템플릿 추가 (#3)
```

## Notes

- Prisma Client는 `src/generated/prisma`에 생성됩니다.
- 공통 응답 포맷은 `src/common/response.ts`의 `success` / `fail`을 사용합니다.
- 기본 브랜치는 `dev`입니다.
