# Tadbirkorlik asoslari

A mobile-first Next.js learning application alongside the existing TerDU presentation website. The original 15 presentations, quizzes, accounts, academic scores, teacher controls, and animated login remain available. Existing Realtime Database records are never automatically migrated or reset.

## Run locally

Use Node.js 22 or newer. Run these commands from this folder:

```bash
npm ci
npm run dev:demo
```

Open http://localhost:3000. The local demo role selector provides separate student, teacher, and administrator accounts. Demo changes are saved in `.studyquest-demo/`; deleting that folder resets only the local demonstration. Demo presentation frames use isolated browser storage and block live Firebase requests. **Demo authentication is disabled in production and on Vercel.**

For Firebase-backed development, copy `.env.example` to `.env.local`, supply your own configuration, and run `npm run dev`. Without backend credentials the application exposes the existing presentation site and clearly disables the new XP services.

## Included

- Responsive violet dashboard, desktop sidebar, mobile navigation, dark mode, animated progress, notifications, course search, and Uzbek/English/Russian interface switching.
- Course catalog with **Tadbirkorlik asoslari → 15 numbered topics**, course progress, module filters, and course/topic search.
- Original presentation viewer with slide navigation, fullscreen, saved position, and embedded original learning activities/video. New teacher-authored slide lessons and protected material downloads are supported too.
- Email/password, password reset, Google sign-in, and a bridge to existing TerDU accounts. University students retain the original approval and lesson-access checks. New email accounts are independent learners by default.
- Server-graded choice, true/false, matching, and accepted-answer quizzes; randomized question order, attempt limits, time limits, feedback settings, and history.
- Transactional XP ledger, achievement levels, badges, daily challenges, learning streaks, course completion rewards, and class/course/calendar-period leaderboards. Independent learners remain outside university rankings.
- Teacher tools for subjects, courses, modules, lessons, quizzes, material uploads, enrollment, classes, achievements, analytics, and CSV reports. Administrator tools manage roles, blocking, XP settings, and level thresholds.
- Memory, vocabulary, arithmetic, and typing practice. Quiz Battle opens a server-graded timed quiz; existing multiplayer class games remain in the original arena.
- Installable PWA with an offline notice. Private responses and presentations are not cached by the new worker.

## Architecture

```text
app/                 Next.js App Router, layout, HTTP API
components/          Dashboard, viewer, quizzes, staff tools, auth, games
components/ui/       Reusable shadcn-style Button
lib/server/          Authentication, authorization, validation, repository, rewards
lib/                 Types, original catalog, seed content, translations
scripts/             Preserve/copy original site; administrator bootstrap
public/              PWA assets; generated legacy presentation copy
tests/               Domain tests, Firestore rules, browser journeys
docs/                Data model, implementation, deployment
```

The client uses hash navigation within the root App Router page. Sensitive actions go through protected Node.js route handlers. Firebase Admin credentials stay on the server. Client Firestore and Storage rules deny all private reads and writes; the HTTP API verifies identity, role, enrollment, and original account ownership before using Admin SDK access.

`scripts/sync-legacy.mjs` generates the catalog and copies original materials into `public/legacy/` before development/build. Only the generated copy receives the same-origin bridge and local demo guard. Edit original lessons in the repository root and the shared engine in `_reyting-manba/`, then run `python3 _reyting-manba/inject.py` from the repository root. Do not edit generated copies.

## Verification

```bash
node scripts/sync-legacy.mjs
npm run typecheck
npm test
# Java 21 is required for the Firestore emulator:
npm run test:emulator
npx playwright install --with-deps chromium
npm run test:browser
npm run build
```

Browser tests launch a local demo server and cover responsive navigation, languages, theme persistence, role escalation rejection, lesson completion and duplicate rewards, preservation of the original viewer, and staff controls. Firebase rules tests use only the `demo-studyquest` emulator project. No live database credentials are required for these tests.

## Production setup and current boundaries

See [deployment instructions](docs/DEPLOYMENT.md), [database schema](docs/SCHEMA.md), and the [preservation plan](docs/IMPLEMENTATION.md). Recommended hosting is **Vercel + Firebase**, with Vercel's root directory set to `studyquest`. GitHub Pages continues serving the existing website until an intentional migration.

This implementation is ready for a configured staging review. Real Firebase sign-in, Storage, and production deployment need your Firebase/Vercel setup; local tests do not prove those external integrations are configured.

- New Tadbirkorlik asoslari XP is separate from original academic grades; it is never converted into university marks. Levels are platform achievements, not academic qualifications.
- Lesson rewards require at least 80% unique slides and the configured server-measured elapsed time. This checks coverage/time, not learner attention. Repeated reward events cannot generate additional XP.
- Starting a quiz consumes an attempt. Refreshing an in-progress new quiz does not restore its unsent answers. Short answers use teacher-defined accepted variants, not AI grading. Publish quiz edits between assessment sessions.
- The current repository caps collection reads at 1,000 records. Before opening a large paid service, replace broad collection scans with scoped/paginated queries and materialized leaderboard aggregates. Index definitions are included.
- Original learning content remains Uzbek. Interface navigation and key learning flows support three languages; teacher-created content and the small practice activities retain their authored language.
- Uploads currently support PDF, PNG, and JPEG up to 4 MiB. Uploaded files download through an authorized API; original PDFs/video remain in their existing presentation viewer.
- Practice mini-games are local exercises and award no XP. Live multiplayer Quiz Battle uses the existing arena rather than a new matchmaking service. Top Student badges are teacher-approved.
- Payments, subscriptions, marketplace checkout, push delivery, arbitrary file formats, and offline lesson synchronization are future integrations. No billing or purchases are simulated.
- Original static lesson files remain publicly addressable, as on the existing website. Future paid materials should use the protected API and Storage, rather than public legacy HTML files.
