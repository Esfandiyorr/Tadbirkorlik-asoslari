# Tadbirkorlik asoslari

The new mobile-first TerDU learning environment. All 15 original presentations, quizzes, exercises, PDF/video materials, accounts, academic scores, teacher controls and game data remain available. Existing Realtime Database records remain authoritative and are never deleted or reset. Approved migration creates private linked profile/progress snapshots in Firestore.

The platform is open to students. Existing personal codes are preserved, with
`1111` available as an additional login method. The overall academic ranking is
available only after sign-in. The verified owner Google account is
`isfandiyor2198@gmail.com` (Isfandiyor Sayfiddinov). See
[administrator access and student recovery](docs/ADMIN-ACCESS.md) for runtime
access controls, the live student roster and password recovery.

## Run locally

Use Node.js 22 or newer. Run these commands from this folder:

```bash
npm ci
npm run dev:demo
```

Open http://localhost:3000. The local demo role selector provides separate student, teacher, and administrator accounts. Demo changes are saved in `.studyquest-demo/`; deleting that folder resets only the local demonstration. Demo presentation frames use isolated browser storage and block live Firebase requests. **Demo authentication is disabled in production and on Vercel.**

For Firebase-backed development, copy `.env.example` to `.env.local`, supply your own configuration, and run `npm run dev`. Without backend credentials the application exposes the existing presentation site and clearly disables the new platform services.

## Included

- Responsive violet dashboard, desktop sidebar, mobile navigation, dark mode, animated progress, notifications, course search, and Uzbek/English/Russian interface switching.
- Course catalog with **Tadbirkorlik asoslari → 15 numbered topics**, course progress, module filters, and course/topic search.
- Native presentation reader with slide navigation, fullscreen, saved position, and restyled original learning activities/video. New teacher-authored slide lessons and protected material downloads are supported too.
- Email/password, password reset, Google sign-in, and a bridge to existing TerDU accounts. University students retain the original approval and lesson-access checks. New email accounts are independent learners by default.
- Server-graded choice, true/false, matching, and accepted-answer quizzes; randomized question order, attempt limits, time limits, feedback settings, and history.
- **Points come only from presentations and extra tasks** — no XP is shown or awarded. Each topic gives up to 100 points (30 slides + 20 reading time + 50 test); teacher marks and live-quiz prizes add extra points. Badges and learning streaks remain as encouragement.
- **Daily and overall rankings**: the top ten rows are coloured, the rest plain; each row shows the place, name, group and points, with an empty avatar silhouette (avatars will be given later as rewards). A card above the list shows the student's own place, points and the gap to the next place; group chips filter the list. The daily ranking counts points earned since 00:00 Tashkent time: the original engine records each student's day-start total (`students/<id>/dd`, `d0`). Independent learners remain outside university rankings.
- Teacher tools for subjects, courses, modules, lessons, quizzes, material uploads, enrollment, classes, achievements, analytics, and CSV reports. Administrator tools manage roles, blocking and platform settings.
- Memory, vocabulary, arithmetic, and typing practice. Quiz Battle opens a server-graded timed quiz; existing multiplayer class games use the new native Game Arena surface.
- **Site manager (back office):** **Admin → 🛠 Site manager** is the administrator's starting page — one card per task, each with a one-line explanation, so the site is run without a developer: ⚡ live quiz, 🎭 avatars, 📢 announcements, plus shortcuts to topic access, students and grades, platform settings and the classic panel.
- **Live quiz restored in the new site:** the original live quiz (Kahoot-style, `kahoot/*`) is read and run by the server. From 20 minutes before the start until the end, a small «⚡ Live quiz» card (anyone may close it) and the side announcements box lead into the game (`#arena/play/live`, typing race `#arena/play/yozuv`). Administrators manage it under **Admin → 🛠 Site manager → ⚡ Live quiz**: the daily automatic game (time, number of questions, seconds per question, sections), the upcoming games (cancel or stop any of them), a hand-picked game (date, time, note, questions), the question bank (add, edit, delete, many at once from text, JSON import/export) and recent results. The server writes exactly the original format (`lib/live-quiz.ts` mirrors `khMakeGame`, `khScore`, `yzScore`, `khParse` and `khQid`; a unit test runs the originals side by side), finalizes finished games so winners' points still reach the overall score, and tops the 14-day schedule up by itself at most every 6 hours (lock `site/locks/liveAuto`). Live typing races are still set up in the classic panel.
- **Announcements box:** a permanent square box under «Students' chat» in the side menu (on phones, at the top of the home page) shows the next live quiz and the administrator's announcements, switching every 5 seconds (paused on hover or with the pause button). Administrators post and delete announcements (title, text, optional link and end date) under **Admin → 🛠 Site manager → 📢 Announcements**; records live in `meta/news/<id>`, written only by the server.
- **Avatars as rewards:** students in places 1–10 of the overall ranking, and students the administrator allows, choose a character from the avatar library (10 characters in `public/avatars/`). Each avatar belongs to one student at a time; a student who drops out of the top 10 without permission loses it and others may take it. The avatar stands on the right of the student's ranking row and on the home page card in place of the topic picture; an empty silhouette opens the library. Students can suggest new avatars (sent to «Message the admin» with the 🎭 category). Administrators allow students and free avatars under **Admin → 🛠 Site manager → 🎭 Avatars**. Records: `meta/avatars/own/<avatar>` and `meta/avatars/allow/<student>`, written only by the server in a transaction. Character images belong to their copyright holders (see `public/avatars/NOTICE.txt`).
- **Online now in the arena:** the Games page lists classmates who are in the arena (free or playing). Press _Invite_, pick Draughts, Chess, Connect Four or Puzzle duel, and the classmate gets an accept/decline window; once accepted, the game starts for both. It shares the original arena's records (`arena/on`, `arena/inv`, `arena/rooms`), so players on the new page and in the original arena see and invite each other.
- Student name/surname/existing code entry, live academic rankings, all 15 per-topic reading/grade histories, a linked academic roster, preserved class chat, and administrator-triggered, repeat-safe profile linking.
- Installable Android/iPhone/desktop PWA with an installation guide and an offline notice. Private responses and presentations are not cached by the new worker.

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

`scripts/sync-legacy.mjs` generates the catalog and copies original materials into `public/legacy/` before development/build. Only the generated copy receives the same-origin interaction adapter and local demo guard. The visible content is sanitized and rendered in the main document using the new design; an offscreen compatibility engine preserves original assessment and game rules. See [native design migration](docs/NATIVE-DESIGN.md). Edit original lessons in the repository root and the shared engine in `_reyting-manba/`, then run `python3 _reyting-manba/inject.py` from the repository root. Do not edit generated copies.

## Verification

```bash
node scripts/sync-legacy.mjs
npm run typecheck
npm test
# Java 21 is required for the Firestore emulator:
npm run test:emulator
npx playwright install --with-deps chromium
npm run test:browser
npm run test:auth
npm run test:maintenance
npm run build
```

Browser tests launch a local demo server and cover responsive navigation, languages, theme persistence, role escalation rejection, lesson completion and duplicate rewards, preservation of the original viewer, and staff controls. Firebase rules tests use only the `demo-studyquest` emulator project. No live database credentials are required for these tests.

`test:auth` runs the real client session provider outside demo mode, with browser-intercepted Firebase and database responses. It checks the direct Google button, blocked popup feedback, saved Google sessions, expired/revoked session recovery, and original code sign-in with preserved academic points. It never contacts live authentication or modifies student records.

## Production setup and current boundaries

See [deployment instructions](docs/DEPLOYMENT.md), [database schema](docs/SCHEMA.md), and the [preservation plan](docs/IMPLEMENTATION.md). Recommended hosting is **Vercel + Firebase**, with Vercel's root directory set to `studyquest`. Existing GitHub Pages links now redirect to the corresponding course, topic or game in the new environment.

This implementation is ready for a configured staging review. Real Firebase sign-in, Storage, and production deployment need your Firebase/Vercel setup; local tests do not prove those external integrations are configured.

- Points shown in the rankings are the original academic points (presentations + teacher marks + live-quiz prizes). New-platform lessons and quizzes record completion and results but award no separate XP.
- The daily ranking starts counting once a student opens a presentation with the current engine that day; students on an older cached copy show 0 until they reload.
- Lesson completion requires at least 80% unique slides and the configured server-measured elapsed time. This checks coverage/time, not learner attention.
- **Firestore free quota (50,000 reads/day):** the 15 original presentations never touch Firestore — opening one and turning slides used to cost about 15 + 5 reads per slide, and their reading history and points already live in the original database. Leaving a presentation refreshes only the student's original academic record (`view=me`), not the whole state. Original-presentation students do not load their redundant Firestore progress while the catalog has only original presentations. The catalog (courses, lessons, quizzes) is cached for 6 hours per server instance and refreshed within 30 seconds of a teacher's change through `meta/catalogVersion`. The class-wide report (all students' progress) loads only when a teacher presses «Load the report».
- Starting a quiz consumes an attempt. Refreshing an in-progress new quiz does not restore its unsent answers. Short answers use teacher-defined accepted variants, not AI grading. Publish quiz edits between assessment sessions.
- Collection reads fetch successive 500-document pages, so migrated student records are not silently truncated. Before opening a large paid service, replace broad report scans with scoped queries and materialized leaderboard aggregates. Index definitions are included.
- Original learning content remains Uzbek. Interface navigation and key learning flows support three languages; teacher-created content and the small practice activities retain their authored language.
- Uploads currently support PDF, PNG, and JPEG up to 4 MiB. Uploaded files download through an authorized API; original PDFs/video remain in their existing presentation viewer.
- Practice mini-games are local exercises and award no points. Live multiplayer Quiz Battle uses the existing arena rather than a new matchmaking service. Top Student badges are teacher-approved.
- Payments, subscriptions, marketplace checkout, push delivery, arbitrary file formats, and offline lesson synchronization are future integrations. No billing or purchases are simulated.
- Original static lesson files remain publicly addressable, as on the existing website. Future paid materials should use the protected API and Storage, rather than public legacy HTML files.

In managed environments that proxy HTTP, run local browser checks with
`NO_PROXY=127.0.0.1,localhost no_proxy=127.0.0.1,localhost` for loopback traffic.
Keep the configured HTTPS proxy and CA trust for external destinations.
