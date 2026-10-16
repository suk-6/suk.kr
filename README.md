# suk.kr v2

개인 포트폴리오, 단축 URL, 파일 관리 기능을 하나의 pnpm workspace에서 운영합니다.

## 구조

- `apps/web` — Next.js 16 / React 19, Vercel 배포
- `apps/api` — Cloudflare Worker / D1, Wrangler 배포
- `packages/contracts` — 양쪽 런타임이 공유하는 Zod 계약

브라우저는 Worker를 직접 호출하지 않습니다. `suk.kr`의 서버 런타임이 `API_TOKEN`으로 `api.suk.kr`을 호출하며, S3가 파일과 폴더의 원본이며 D1은 사이트 데이터와 선택적인 객체 키 → 단축 링크 매핑을 보관합니다.

## 개발

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
pnpm --filter @suk/api db:local
pnpm dev
```

Worker 로컬 비밀값은 `apps/api/.dev.vars`에 `API_TOKEN`으로 설정합니다. 웹 환경에는 같은 값과 SSFS의 기존 S3 환경값을 설정합니다.

관리자 **파일 관리**는 S3 버킷 전체를 폴더별로 탐색합니다. `assets/`도 표시하며 가져오기/등록 단계는 없습니다. 업로드는 현재 폴더에 실제 파일명으로 저장합니다. 기존 객체를 덮어쓰기 전에 확인하며, 단축 링크는 원하는 파일에만 설정하거나 제거합니다. 파일/폴더 이동은 복사 후 링크 매핑을 옮기고 원본을 삭제합니다. 대상 객체의 ETag와 크기가 원본과 같으면 복사를 건너뛰어 실패한 이동을 이어갈 수 있습니다. 내용이 다르면 이동을 거부합니다. 폴더 삭제는 하위 객체 개수를 확인한 뒤 재귀적으로 실행합니다. `assets/` 아래 삭제/이동/덮어쓰기는 라이브 포트폴리오에 영향을 주므로 `assets/`를 직접 입력해야 합니다.

기존 SSFS의 D1 행과 단축 링크는 그대로 유효합니다. 기존 메타데이터 열은 호환성을 위해 유지하지만 목록과 크기/수정일/콘텐츠 유형은 S3에서 읽습니다. **끊어진 링크 확인**은 S3에 없는 키를 가리키는 D1 매핑을 페이지별로 검사하며, 매핑만 제거할 수 있습니다. S3와 D1 사이의 작업은 단일 트랜잭션이 아니므로 부분 실패 시 두 폴더와 끊어진 링크를 새로고침하여 확인하세요. 5GB를 넘는 객체의 업로드/이동은 S3 도구에서 처리해야 합니다. 큰 폴더 작업은 서버 실행 시간에 따라 일부만 처리될 수 있으며 완료된 항목을 오류에 표시합니다.

웹 서버의 S3 자격 증명에는 버킷의 `s3:ListBucket`, 객체의 `s3:GetObject` (HEAD 포함), `s3:PutObject`, `s3:DeleteObject` 권한이 필요합니다. 브라우저 PUT을 허용하려면 AWS S3 콘솔의 해당 버킷 **Permissions → Cross-origin resource sharing (CORS)**에 다음 규칙을 추가합니다. S3 호환 서비스는 해당 버킷의 CORS 설정을 사용합니다. 기존 규칙은 필요한 경우 유지하세요.

```json
[
	{
		"AllowedOrigins": ["https://suk.kr", "http://localhost:3000"],
		"AllowedMethods": ["PUT"],
		"AllowedHeaders": ["content-type", "if-none-match", "if-match"],
		"MaxAgeSeconds": 3600
	}
]
```

로컬 포트나 호스트가 다르면 실제 origin을 추가해야 합니다. `S3_ENDPOINT`는 로컬 MinIO 등 S3 호환 서비스에만 지정하며, AWS S3에서는 비워 둡니다. `NEXT_PUBLIC_S3_URL`은 객체를 공개 제공하는 주소입니다. 설정은 `apps/web/.env.example`을 참고하세요.

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
