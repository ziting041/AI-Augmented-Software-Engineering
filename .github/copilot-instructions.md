# Copilot Instructions

- Read `ARCHITECTURE.md` first; it is the source of truth for stack, structure, and conventions.
- Stack: TypeScript (strict), Next.js App Router (React), Tailwind CSS, shadcn/ui.
- All UI text in Traditional Chinese (zh-TW, Taiwan phrasing: 使用者, 專案).
- Keep UI presentational; business logic lives in `lib/`. No new npm packages without approval.
- Before a PR: `npm run lint`, `npm run test:unit`, `npx playwright test`.
- Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`); never commit secrets or `.env*`.
