# suk.kr agent guidance

## Architecture

- pnpm monorepo: `apps/web` is Next.js, `apps/api` is a Cloudflare Worker, and `packages/contracts` owns shared Zod contracts.
- Keep `suk.kr` stateless. Browser code must not call the Worker directly; the Next.js server runtime calls `api.suk.kr` with `API_TOKEN`.
- Store persistent state in the Worker and D1, and file bytes in the existing S3-compatible storage. Keep stateless work such as image generation in Next.js.
- Store portfolio media under the S3 `assets/` prefix. Do not add images to the repository except framework metadata such as the favicon.

## D1

- Cloudflare account: `suk-6` (`521861af0ccd0a033f4bee6b61a9bb18`). D1 database: `suk-kr`.
- Production D1 is the source of truth for `site_settings`, `projects`, `timeline_entries`, `skills`, `short_links`, and `files`.
- Use migrations only for schema changes. Never edit applied `0001_initial.sql`; add sequential migrations starting at `0002`.
- Apply content and data corrections directly from `apps/api` with `npx wrangler d1 execute suk-kr --remote`.
- Before material production changes, inspect exact rows and keep a D1 export or Time Travel recovery point. Store temporary SQL outside the repository and delete it after verification.
- Sync production to local by comparing keys and counts, then upserting by primary key. Avoid broad truncation.
- Preserve `files` and file-owned `short_links`. Write files first during sync; rename or delete file-owned links only through file management.
- Normal development and Vitest use local D1. Never set the shared binding to `remote: true`; use `npx wrangler dev --remote` only for explicit production-backed manual testing.
- Set `CLOUDFLARE_ACCOUNT_ID` when account selection is ambiguous. Never print, commit, or place secrets in command arguments; use `.dev.vars` or ignored environment files.
- Verify both D1 results and the relevant Worker API response after data work.

## Code

- Prefer the least code that stays clear. Avoid one-off abstractions, hooks, handlers, and wrappers; inline short event logic used once.
- Group two or more related feature files in a dedicated directory with short camelCase filenames.
- Keep shared API shapes in `packages/contracts`. For persisted features, check contracts, schema, Worker repository/routes, admin UI, public UI, and tests together.
- Use ESLint and Prettier.
- Preserve unrelated user changes in a dirty worktree.

## UI

- Apply `DESIGN.md` only to the portfolio. Use shadcn components and tokens for the admin UI.
- Keep the portfolio dark-only, minimal, and restrained. Avoid gradients, glow, decorative backgrounds, excessive borders, and unnecessary bold text.

## Validation and deployment

- For code changes, normally run `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.
- Use the existing CI/CD. Do not add duplicate deployment documentation or change deployment wiring unless requested.
- Do not assume a push deployed successfully. Check CI and production when deployment status matters; deploy manually only when explicitly requested or authorized for recovery.
