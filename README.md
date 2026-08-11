# CareerVerse AI

Career operating system for students and early professionals: career intelligence, opportunity matching, application tracking, resume analysis, roadmaps, events, network, mentors, community, and an AI copilot.

Demo listings are explicitly marked as **Demo** in the UI.

## Stack

- Next.js (App Router) + React + TypeScript
- Firebase Auth (Google) + Cloud Firestore (user/profile data)
- Firebase Admin SDK on the server (token verify / Firestore writes)
- NextAuth (Auth.js) JWT sessions (Firebase credentials bridge + optional email/password)
- Tailwind CSS
- Optional OpenAI-compatible AI provider with deterministic fallbacks

## Setup

```bash
npm install
cp .env.example .env.local
# set AUTH_SECRET and NEXT_PUBLIC_FIREBASE_* + Firebase Admin service account vars
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Primary student path: **Google sign-in → onboarding → dashboard** (Firestore-backed).

## Environment variables

See `.env.example`. Important keys:

| Variable | Purpose |
|----------|---------|
| `AUTH_SECRET` | NextAuth secret (required) |
| `AUTH_URL` / `NEXTAUTH_URL` | Canonical app origin for Auth.js (production: `https://careerverse-ai-gold.vercel.app` — **never** localhost on Vercel) |
| `NEXT_PUBLIC_APP_URL` | Same production https URL (metadata, absolute links) |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase web app config |
| `FIREBASE_ADMIN_PROJECT_ID` | Admin SDK project id |
| `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | Service account for Firestore on server |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Optional NextAuth Google OAuth |
| `AI_*` | Optional OpenAI-compatible provider |
| `STORAGE_*` | Local resume fallback when Storage unavailable |

### Production URL (Vercel) — sign-out / callbacks

If `AUTH_URL` or `NEXT_PUBLIC_APP_URL` is still `http://localhost:3000` on Vercel, Auth.js redirects (including **Sign out**) go to localhost. Set both to:

```text
AUTH_URL=https://careerverse-ai-gold.vercel.app
NEXT_PUBLIC_APP_URL=https://careerverse-ai-gold.vercel.app
```

Optionally also set `NEXTAUTH_URL` to the same value. No trailing slash. Redeploy after changing env vars.

### Service account (Vercel)

1. Firebase Console → Project settings → Service accounts → **Generate new private key**
2. Set `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` (keep `\n` escapes)
3. Set `FIREBASE_ADMIN_PROJECT_ID=careerverse-ai-3f969`
4. Add your Vercel domain under Firebase Auth → Settings → **Authorized domains** (`careerverse-ai-gold.vercel.app`, plus any custom domain)

`DATABASE_URL` / Prisma are **not** required. Use **Cloud Firestore**, not Realtime Database.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm test` | Unit tests |

## Notes

- Resume binaries: prefers Firebase Storage when Admin + bucket are configured; otherwise stores metadata in Firestore and writes files locally (ephemeral on Vercel).
- Community, network, events, and application tracker return empty/graceful states until migrated to Firestore.
