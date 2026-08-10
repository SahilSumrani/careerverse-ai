# CareerVerse AI

Career operating system for students and early professionals: career intelligence, opportunity matching, application tracking, resume analysis, roadmaps, events, network, mentors, community, and an AI copilot.

Demo listings, careers, events, and accounts are explicitly marked as **Demo** in the UI. No fabricated company logos or testimonials.

## Stack

- Next.js (App Router) + React + TypeScript
- Prisma + SQLite (default) / configurable via `DATABASE_URL`
- NextAuth (Auth.js) credentials (+ optional Google)
- Tailwind CSS (teal/slate theme, Manrope + Fraunces)
- Optional OpenAI-compatible AI provider with deterministic fallbacks

## Setup

```bash
npm install
cp .env.example .env
# set AUTH_SECRET (e.g. openssl rand -base64 32)
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

If `prisma db seed` is not wired in your Prisma config, run the seed script with:

```bash
npx tsx prisma/seed.ts
```

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Student | `demo.student@careerverse.local` | `DemoPass123!` |
| Platform admin | `admin@careerverse.local` | `DemoPass123!` |
| Mentor | `demo.mentor@careerverse.local` | `DemoPass123!` |
| Speaker | `demo.speaker@careerverse.local` | `DemoPass123!` |

Sign-in defaults to the student demo credentials for local exploration.

## Environment variables

See `.env.example`. Important keys:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Prisma datasource (default `file:./dev.db`) |
| `AUTH_SECRET` | NextAuth secret (required) |
| `AUTH_URL` | App URL for auth callbacks (`http://localhost:3000`) |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Optional Google OAuth |
| `AI_PROVIDER` | e.g. `openai` |
| `AI_API_KEY` | Provider API key (optional — app uses fallbacks without it) |
| `AI_BASE_URL` | OpenAI-compatible base URL |
| `AI_MODEL` | Model id (default `gpt-4o-mini`) |
| `AI_MAX_TOKENS` | Max completion tokens |
| `STORAGE_PROVIDER` | `local` for resume uploads |
| `UPLOAD_DIR` | Local upload directory |
| `MAX_UPLOAD_BYTES` | Upload size limit |
| `NEXT_PUBLIC_APP_NAME` | Display name |
| `NEXT_PUBLIC_APP_URL` | Canonical URL for sitemap/robots |

## Key routes

| Path | Description |
|------|-------------|
| `/dashboard` | Career OS home |
| `/career` | Career intelligence |
| `/applications` | Kanban / list application tracker |
| `/resume` | Resume upload + analysis |
| `/roadmap` | Personalized career roadmaps |
| `/copilot` | Full-page AI chat |
| `/opportunities` | Opportunity discovery |
| `/events` | Events catalog + detail/register |
| `/careers` | Career catalog |
| `/community` | Posts, reactions, comments |
| `/network` | People + connection requests |
| `/mentors` | Mentor directory |
| `/institutions` | Approval requests |
| `/admin` | Admin overview (admin role) |
| `/profile` | Current user profile |

## Scripts

```bash
npm run dev      # development server
npm run build    # production build
npm run start    # serve production build
npm run lint     # ESLint
```

## Notes

- AI scores and match percentages are **estimates**, not guarantees of hiring or fit.
- Resume analysis accepts PDF/DOCX via `POST /api/resume` (multipart).
- SEO: `src/app/robots.ts` and `src/app/sitemap.ts` expose `/robots.txt` and `/sitemap.xml`.
