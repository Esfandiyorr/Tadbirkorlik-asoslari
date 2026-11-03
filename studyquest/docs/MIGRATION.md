# Moving the existing course into the new environment

The user authorized moving all existing learning materials and student academic records into the new interface. The existing Firebase project remains the source of truth; there is no destructive database replacement.

## Student access

Students open `https://tadbirkorlik-asoslari.vercel.app/`, choose Sign in, and enter their existing first name, surname, and code/password. Both original four-digit PIN accounts and newer salted PBKDF2 passwords continue to use the original verified ownership flow. Students do not register a second account. Google/email sign-in is available separately; new email accounts remain independent learners unless an administrator changes their role.

Browser sessions on the old GitHub Pages origin cannot automatically become sessions on another origin. A student may need to enter the same credentials once on the new site. Credentials, tokens and ownership secrets are never transferred through redirect URLs. Switching to a different email account clears the local legacy login identity, preventing another account from accidentally continuing the old student’s academic session.

## Linked records and live grades

Use Teacher/Administration → Academic records → Link existing students to request `syncLegacy` explicitly. Login and page refresh never start a bulk import. The server checks administrator permission before reading the original roster and creating linked Firestore profiles/enrollments/progress. The private `migrations/legacy-v1` marker records the completed import. A per-student source fingerprint skips unchanged profiles, enrollments and progress on a retry, including after a partially completed import.

The import uses canonical `legacy_<studentId>` IDs and bounded batches of twenty students, prefetching existing records before transactional writes. Repeating it preserves role assignments, XP, privacy choices, saved progress and completion. It never issues XP. It imports only whitelisted profile fields, existing academic totals, topic summaries/manual marks, and known visited-slide IDs. Password hashes, salts, PIN keys, private contact data and Firebase owner records remain in the original database.

Academic rankings read the original approved university roster live, honor class/blocked/independent/privacy boundaries, and show the original academic points. The dashboard and profile show a student’s original points and per-topic grades. The staff Academic records table includes existing groups, status, original grades and manual practical-class marks. Status, class and mark edits require server staff/course permission and update the same original student record. Manual-mark changes adjust the academic total by the original configured multiplier. Academic points are distinct from new platform XP.

New private Firestore profile snapshots support management before each student’s first new-site login. Original account status, group and ownership are checked on each legacy authenticated request, so imported snapshots cannot bypass a blocked account or a password reset. Roster reads are paginated rather than silently stopping at 1,000 records.

## Presentations, games, account tools and materials

All fifteen lesson `<main>` sections remain unchanged. Original interactive questions, matching/crossword/math activities, images, documents, embedded videos and local materials are copied at build time. The new focused viewer hides both app navigation and original topbars/music/chat widgets, provides one set of slide controls, fits desktop slides to the available viewport, supports natural scrolling on small screens, and keeps result/download/quiz tools in a compact details panel.

Original source code is not rewritten to change academic scoring. Only generated presentation copies receive embedded-mode styling and a validated same-origin control bridge. Unread announcements are not marked read merely by opening a lesson. Old install prompts are suppressed inside the new interface. Announcement text appears in new notifications, while original announcement/poll management remains in the embedded course controls.

The original multiplayer Arena is hosted inside Game Arena with the same rooms, challenges and game records. Existing public room hashes survive redirects. Class chat, advanced original course controls and the student’s original account/group tools are accessible inside the new app, using the original data and permissions.

## Old links and phone application

`platform-redirect.js` maps original Pages home/course/topic/arena links to the corresponding new route. It is hostname-restricted so local verification and embedded Vercel copies do not redirect in loops. Direct visits to copied `/legacy/` pages also return to the proper new interface.

Phone application opens an installation guide for Android, iPhone/iPad and desktop. The manifest has the subject name, app icons, stable application ID and course/ranking/game shortcuts. Installation uses the browser’s native install prompt or platform Add to Home Screen instructions. Private APIs and legacy pages are excluded from the new offline worker’s cache. The original push worker is scoped and no longer deletes caches belonging to the new app. Online access is required for live lessons, rankings and games.

## Verification and rollout

Local tests use isolated demo storage, fixtures and emulators; they never import or modify the live roster. After GitHub-triggered Vercel deployment is Ready, an administrator refreshes the new site and starts the authorized link from Academic records, once the Firestore quota is available. Verify the reported count, a sample student’s old-code sign-in and academic points, one lesson and one original multiplayer room. The migration’s real count can only be confirmed in that authenticated production session.
