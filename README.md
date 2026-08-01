# suk.kr v2

개인 포트폴리오, 단축 URL, 파일 관리 기능을 하나의 pnpm workspace에서 운영합니다.

## 구조

- `apps/web` — Next.js 16 / React 19, Vercel 배포
- `apps/api` — Cloudflare Worker / D1, Wrangler 배포
- `packages/contracts` — 양쪽 런타임이 공유하는 Zod 계약

브라우저는 Worker를 직접 호출하지 않습니다. `suk.kr`의 서버 런타임이 `API_TOKEN`으로 `api.suk.kr`을 호출하며, D1만 영속 상태를 보관합니다. SSFS 파일 바이트는 기존 S3에 유지하고 D1은 파일 메타데이터와 단축 URL 관계를 관리합니다.

## 개발

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
pnpm --filter @suk/api db:local
pnpm dev
```

Worker 로컬 비밀값은 `apps/api/.dev.vars`에 `API_TOKEN`으로 설정합니다. 웹 환경에는 같은 값과 SSFS의 기존 S3 환경값을 설정합니다.

기존 SSFS 객체와 D1 메타데이터의 차이는 변경 없이 먼저 확인할 수 있습니다.

```bash
pnpm --filter @suk/web migrate:ssfs -- --dry-run
pnpm --filter @suk/web migrate:ssfs
```

포트폴리오 이미지와 OG 이미지는 S3의 `assets/` prefix에 보관합니다. 로컬 원본과 외부 커버를 새 버킷에 처음 동기화하거나 누락 여부를 확인할 때 아래 명령을 사용합니다.

```bash
pnpm --filter @suk/web sync:assets
```

## 배포

- Vercel 프로젝트 Root Directory: `apps/web`
- Worker 이름: `api-suk-kr`
- Worker Custom Domain: `api.suk.kr`
- D1: `suk-kr`
- GitHub Actions secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

`main`에 API 관련 변경이 push되면 D1 migration을 적용한 뒤 Wrangler로 Worker를 배포합니다. Vercel은 같은 저장소의 `apps/web` 변경을 독립 배포합니다.
