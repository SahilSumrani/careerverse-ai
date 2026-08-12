---
name: ponytail
description: >-
  Enforces the laziest correct solution for CareerVerse code changes: YAGNI,
  reuse existing helpers, stdlib/native/installed deps before new code, shortest
  working diff. Use on any coding task (write, fix, refactor, review, design)
  and when the user says ponytail, be lazy, YAGNI, do less, simplest/minimal,
  or complains about over-engineering or bloat. Do not use for non-coding asks.
---

# Ponytail (CareerVerse)

Upstream: [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail). This is an **agent coding discipline**, not a runtime library. Do not add npm packages, wrappers, or UI for ponytail.

Always-on project rule: `.cursor/rules/ponytail.mdc`.

## When to use

- Any CareerVerse implementation or review
- User asks for minimal / lazy / YAGNI changes
- Tempted to add a new dependency, abstraction, demo seed, or unused helper

## Ladder (stop at first rung that holds)

1. Need this at all? → skip and say so in one line
2. Already in this repo? → reuse (Firebase helpers, AI service, existing API routes)
3. Stdlib / platform? → use it
4. Already-installed dependency? → use it (do not add new deps for what a few lines cover)
5. One line? → one line
6. Only then: minimum that works

Read and trace the real flow first; then climb the ladder.

## CareerVerse constraints

- Prefer real Firestore data paths; do not reintroduce demo/seed UI
- Touch only files needed for the task — no drive-by refactors of Application Tracker, landing, or unrelated dashboards
- AI stays on `AI_API_KEY` / `AI_BASE_URL` / `AI_MODEL` — do not invent parallel AI clients
- Never cut: trust-boundary validation, auth, security, accessibility, data-loss error handling
- Mark deliberate corners with `// ponytail: <ceiling>; upgrade when <condition>`

## Intensity

| Level | Behavior |
|-------|----------|
| lite | Ship what's asked; name the lazier alternative in one line |
| full | Ladder enforced (default) |
| ultra | Deletion-first; challenge extras in the same breath |

## Output

Code first. At most three short lines: what was skipped, when to add it. Pattern: `[code] → skipped: [X], add when [Y].`

## Not a product integration

Ponytail never ships in the Next.js app, Firebase, or Vercel. If asked to "integrate ponytail into the product," keep the rule/skill only — no dead code.
