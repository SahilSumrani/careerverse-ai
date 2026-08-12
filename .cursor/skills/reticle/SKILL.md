---
name: reticle
description: >-
  Verifies CareerVerse UI against the real running Next.js app via Reticle
  (network, console, DOM, React file:line) — not screenshots alone. Use when
  checking agent-built features, auth/onboarding/dashboard/applications/resume
  flows, silent API failures, or when the user says reticle, verify in browser,
  or proofread the app. Dev/localhost only; never for production or student-facing UI.
---

# Reticle (CareerVerse)

Upstream: [reticlehq/reticle](https://github.com/reticlehq/reticle). Reticle is a **dev-only agent verification SDK + MCP** — runtime perception of *our* app while coding. It is not a student/job-seeker product feature.

Project rule: `.cursor/rules/reticle.mdc`.

## Fit / non-fit

| Fit | Not a fit |
|-----|-----------|
| Local agent loop after changing app UI/API | Production / Vercel |
| Auth, onboarding, dashboard, applications, resume, opportunities | Embedding in Application Tracker or landing as product UI |
| Catching silent 500s, wrong store state, console errors | Testing third-party sites (use Playwright) |

Do **not** add Reticle widgets, dashboards, or demo assertions into product pages.

## Install (already wired in this repo)

Dev deps: `@reticlehq/react`, `@reticlehq/next`.

1. **MCP (once per machine)** — Cursor global `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "reticle": {
      "command": "npx",
      "args": ["@reticlehq/server", "mcp"]
    }
  }
}
```

Or: `npx @reticlehq/server init` (registers MCP + may patch files). Prefer not re-running if already wired.

2. **App wiring (this repo)**
   - `src/app/reticle-dev.tsx` — client connect in development only
   - Mounted from `src/app/layout.tsx` when `NODE_ENV === "development"`
   - `next.config.ts` wraps config with `withReticle` (no-op in production)

3. **Env (local only)** — see `.env.example`:
   - `RETICLE_TOKEN` — shared pairing secret for the daemon (optional if using `~/.reticle/pairing-token` tooling)
   - `NEXT_PUBLIC_RETICLE_TOKEN` — same value exposed to the browser `connect({ token })`
   Never commit real tokens. Never set these on Vercel production.

## Agent workflow

1. Ensure `npm run dev` is up and a localhost tab is open (SDK connects on load).
2. After building a flow, verify with Reticle MCP tools (e.g. sessions → act → assert network/DOM/console).
3. Prefer plain-English checks tied to real CareerVerse routes:
   - Sign-in → dashboard
   - Applications list loads from `/api/applications` (or current route) without console errors
   - Resume parse/upload network success
4. On fail: use `file:line` from Reticle, fix, re-assert. Do not declare "done" on a pretty screenshot alone.
5. If MCP/session missing: say so (`unknown` / no session) — do not fake a pass.

## Constraints

- Tree-shaken / gated out of production; keep it that way
- Localhost bridge only; app data must not leave the machine via Reticle
- Do not expand Reticle into product AI matching, Firestore, or Groq paths
- Prefer existing Playwright for cross-browser / external sites if needed

## Upstream docs

- Skill dump: https://raw.githubusercontent.com/reticlehq/reticle/main/SKILL.md
- Getting started: https://github.com/reticlehq/reticle/blob/main/docs/getting-started.md
