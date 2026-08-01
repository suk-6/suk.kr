# suk.kr agent guidance

## Architecture

- This repository is a pnpm workspace. `apps/web` is the Next.js frontend, `apps/api` is the Cloudflare Worker, and `packages/contracts` owns the shared Zod contracts.
- Keep `suk.kr` stateless. Browser code must not call the Worker directly; Next.js server runtime calls `api.suk.kr` with `API_TOKEN`.
- Keep persistent state in the Worker and D1. Image generation and other stateless work stay in the Next.js runtime.
- File bytes stay in the existing S3-compatible storage. D1 stores file metadata and the relationship to short links.
- Portfolio media belongs under the S3 `assets/` prefix. Do not add portfolio images to the frontend repository unless they are framework metadata assets such as the favicon.

## D1 operations

- The Cloudflare account is `suk-6` (`521861af0ccd0a033f4bee6b61a9bb18`), and the D1 database is `suk-kr`.
- Use migrations only for schema changes such as tables, columns, indexes, and constraints.
- Do not create migrations for portfolio content, mappings, corrections, or other data-only work. Apply those changes directly from `apps/api` with `npx wrangler d1 execute suk-kr --remote --command ...` or `--file ...`.
- `0001_initial.sql` is the schema-only production baseline created after the 2026-08-02 D1 reset. Do not add admin-managed content or seed data to it.
- Never edit or remove an applied migration after this baseline. Create sequential schema migrations starting at `0002` for future table, column, index, or constraint changes.
- The production D1 database is the source of truth for admin-managed data: `site_settings`, `projects`, `timeline_entries`, `skills`, `short_links`, and `files`.
- When local data must match production, sync production to local. Compare keys and counts first, preserve a temporary backup, and upsert by primary key. Do not broadly truncate the local database when a non-destructive upsert is sufficient.
- Preserve the `files` and `short_links` relationship. File-owned short links are read-only in link management and must only be renamed or deleted through file management. When syncing, write `files` before file-owned `short_links`.
- Before a material production data change, inspect the exact target rows and keep a recoverable D1 export or Time Travel point. Store temporary SQL outside the repository with restrictive permissions and delete it after verification.
- Multiple Cloudflare accounts are available locally. If Wrangler cannot select one, set `CLOUDFLARE_ACCOUNT_ID=521861af0ccd0a033f4bee6b61a9bb18` for the command.
- Never print, commit, or place secrets in command arguments. Keep local Worker secrets in `apps/api/.dev.vars` and web secrets in ignored environment files.
- Normal `pnpm dev` and Vitest use local D1. Never set the shared D1 binding to `remote: true`, because the test configuration reads the same Wrangler config and tests mutate data. Use `npx wrangler dev --remote` only when production-backed manual testing is explicitly intended.
- After data work, verify both D1 results and the relevant Worker API response. For a full sync, compare row contents as well as counts.

## Code organization

- Prefer the least code that keeps the behavior clear. Do not introduce abstractions, hooks, handlers, or wrapper components for one-off logic.
- Inline short event behavior when it is only used once. Extract it only when reuse, testing, or readability materially improves.
- If a feature needs two or more related files, place them in a dedicated feature directory and keep filenames short and camelCase.
- Keep shared API shapes in `packages/contracts`. A persisted feature change usually needs coordinated updates to the schema migration, contract, Worker row mapping/repository, admin action/form, public UI, and tests.
- Use ESLint and Prettier. Do not reintroduce Biome.
- Preserve unrelated user changes in a dirty worktree.

## UI rules

- The portfolio is dark-only, minimal, and restrained. Avoid gradients, glow effects, decorative backgrounds, excessive borders, and unnecessary bold text.
- Keep the admin interface close to default shadcn styling. Prefer existing shadcn components and tokens over custom themes or ornamental CSS.
- Do not add a resume link or frontend toolkit section unless explicitly requested again.

## Validation and delivery

- Run validation proportional to the change. For code changes, the normal full set is `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.
- Deployment is automated through the existing CI/CD configuration. Do not add duplicate deployment documentation or change deployment wiring unless explicitly requested.
- Do not assume a push deployed successfully. Check the relevant CI and production endpoint when deployment status matters; use a manual deploy only when explicitly requested or when the user authorizes recovery from broken automation.
