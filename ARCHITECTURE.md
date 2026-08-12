# CareerVerse AI — Architecture

## Positioning

AI-powered career operating system: Discover → Understand → Prepare → Connect → Apply → Grow.

## Stack

- **Frontend/Backend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- **Database:** SQLite (local/dev) via Prisma; PostgreSQL-ready schema patterns
- **Auth:** Auth.js (NextAuth v5) — credentials + optional Google OAuth
- **Validation:** Zod
- **Forms:** React Hook Form
- **AI:** Provider-agnostic `AIService` abstraction (OpenAI-compatible by default)

## Priority Modules

| Priority | Modules |
|----------|---------|
| P0 | Auth, Onboarding, Profile, Dashboard, Career Intelligence, Opportunities, Matching, Applications, Resume |
| P1 | Community, Networking, Events, Speakers, Mentors, HR profiles |
| P2 | Institutions, Approvals, Admin, Analytics foundation |

## Route Map

- Public: `/`, `/opportunities`, `/events`, `/careers`, `/auth/*`
- App: `/dashboard`, `/career`, `/resume`, `/applications`, `/roadmap`, `/community`, `/network`, `/events`, `/mentors`, `/copilot`, `/onboarding`
- Admin: `/admin/*`
- API: `/api/auth`, `/api/profile`, `/api/career`, `/api/opportunities`, `/api/applications`, `/api/resume`, `/api/ai`, `/api/community`, `/api/events`, `/api/network`, `/api/mentors`, `/api/institutions`, `/api/approvals`, `/api/notifications`, `/api/admin`

## Security

- RBAC via Firestore `users/{uid}.roles` + `src/lib/rbac.ts` permissions
- Server-side Zod validation on mutations (including `/api/admin` and `/api/ai/chat`)
- Secure resume upload (type/size/MIME)
- Secrets via environment variables only
- Admin UI/API require `PLATFORM_ADMIN` (Firestore `ADMIN` alias accepted); never trust client-only role claims
- Copilot: input cap, daily quota, off-topic refuse before LLM

## Demo Data

Seed data is marked `isDemo: true` and must never be presented as live production content.
