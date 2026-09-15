# OenoBoost

Monorepo: public app (`apps/web`) + CMS (`apps/cms`).

## Develop

```bash
npm install
npm run dev:web   # http://localhost:3000
npm run dev:cms   # http://localhost:3001
```

## Workflow

GitHub Issue → Development → Human product review → Full QA → Merge

See `docs/GITHUB_ISSUE_WORKFLOW.md` and `AGENTS.md`.

## QA

```bash
cp .env.qa.example .env.qa   # fill test project credentials
npx playwright install chromium
npm run qa:full
```

Details: `docs/QA.md`
