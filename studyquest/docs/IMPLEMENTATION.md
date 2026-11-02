# Tadbirkorlik asoslari architecture and preservation plan

The public GitHub Pages entry points now redirect to the new Vercel environment. Original source lessons, student credentials, academic points, class/game records and Realtime Database ownership remain intact. An administrator-authorized first-visit migration links private Firestore profiles/progress without resetting grades or issuing XP.

`studyquest/` is a separate Next.js application for Vercel. At build time, `scripts/sync-legacy.mjs` copies the existing materials into `/legacy/` and imports the existing catalog. Original files remain the source of truth. A same-origin iframe bridge preserves lesson controls, original quizzes, university grades, independent learning, the teacher panel, and the supplied animated login. It sends only public session fields and slide navigation; credentials are not posted.

New data uses Firestore collections, isolated from existing Realtime Database records. New XP never overwrites academic points. A legacy account is linked only after the server verifies a Firebase ID token, account status, and its existing `owners/<student>/<auth uid>` entry. Existing teacher authentication is checked server-side against the verified email hash. Administrator access requires server configuration or an administrator claim. New email accounts default to students and independent learning; they cannot self-assign staff roles or university class access.

Folders: `app/` routes and API; `components/` dashboard, lesson, quiz and management interfaces; `lib/server/` authorization, transactions, validation and storage; `lib/` catalog, types and translations; `tests/` domain/security tests; `docs/` schema and deployment.

Stages: (1) design/navigation; (2) catalog and legacy bridge; (3) server-authorized progress, quiz, XP ledger, staff management and uploads; (4) games, analytics, translation, PWA and verification.

Demo mode is explicitly local-only, has separate demo accounts and a local JSON repository, and never connects to live Firebase data. Production requires Firebase Admin credentials, Firestore and Storage setup. The server refuses to fall back to demo storage in production. The interface distinguishes demo progress from existing academic scores.

See [MIGRATION.md](MIGRATION.md) for the account, academic-record, original-link and application transition.
