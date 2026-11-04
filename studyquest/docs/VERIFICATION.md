# Verification record

Verified locally on 3 November 2026 (Asia/Tashkent), without live Firebase credentials or a deployment.

| Check                                  | Result                                                                                                                                                                                                          |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Next.js production build               | Passed, including TypeScript                                                                                                                                                                                    |
| Standalone TypeScript check            | Passed                                                                                                                                                                                                          |
| Source formatting                      | Passed                                                                                                                                                                                                          |
| Server/domain and legacy-session tests | 47 passed                                                                                                                                                                                                       |
| Firestore permission emulator          | 6 passed; only `demo-studyquest` used                                                                                                                                                                           |
| Browser journeys                       | 13 platform journeys and 7 native-design journeys passed across the suite and focused reruns                                                                                                                    |
| Sign-in browser regressions            | 7 passed with real client provider and mocked remote services: direct Google popup, blocked popup feedback, saved Google account, original code sign-in, expired/revoked sessions, and unavailable API recovery |
| Original website regressions           | Original passwords, learning paths, grading, ranking tables, game invitations and multiplayer/chat suites passed                                                                                                |
| Original educational content           | All 15 lesson `<main>` sections match the pre-change Git version; all 242 original resource files copied identically                                                                                            |
| Production smoke                       | Original 15-lesson fallback works, demo role login returns 404 even when the demo flag is set, original copy has production bridge configuration, login video plays, mobile login fits, no browser exceptions   |
| Production dependency audit            | 0 known vulnerabilities (`npm audit --omit=dev`)                                                                                                                                                                |

The browser tests cover mobile/desktop layout, dark-mode persistence, three interface languages, search, a course catalog with 15 numerically ordered topics inside one course, stable topic numbers after filtering, forbidden role escalation, forged cookies, origin checks, private answer protection, teacher course/lesson creation, server-measured completion, duplicate rewards, saved original slide navigation, upload rejection, and administrator access. Saved-reading tests account for previously saved progress, so rerunning the suite does not assume a fresh slide position.

Patched transitive gRPC and UUID versions are declared in `package.json` overrides. Firestore emulator and browser tests passed after those dependency changes.

Current migration was verified with fixtures, not executed against the live roster by local tests. The authorized import runs in the administrator’s production browser session after deployment; its actual count must be checked there.

Sign-in fixes keep Google and Email as separate actions, retain the login form until the server accepts the account, and ignore delayed responses from an earlier guest session. The Google popup tests simulate Google's helper transport while keeping Firebase's actual popup logic and browser `window.open`; they do not complete a live Google OAuth exchange. The managed environment's network policy blocked a direct request to the production Vercel hostname, so the reported live Google sign-in issue still requires a user retry after deployment.

Not verified directly against a live project: Firebase Email/Google/legacy sign-in, service-account IAM, Storage uploads, real email delivery, and Vercel deployment. See [DEPLOYMENT.md](DEPLOYMENT.md) for the staging review steps. Local verification did not read or modify live student data. The published transition updates the application and old entry points; authenticated administrator migration is documented in [MIGRATION.md](MIGRATION.md).

Transition coverage additionally includes old-link mapping, credentials excluded from redirects/snapshots, repeat-safe imports, preservation of existing XP/roles/progress, legacy summary-only completion, academic point display, all 15 clean presentation viewports, integrated chat/Arena, direct legacy-link return routes, name/surname/code entry, and the install prompt.

## Firestore quota recovery (3 November 2026)

The user's Vercel logs reported `8 RESOURCE_EXHAUSTED: Quota exceeded`. Local tests reproduce that failure with mocked Firestore responses; no live database quota, billing plan or records were changed. All 47 unit/server tests, 7 sign-in browser checks, the 12 existing browser journeys, the focused quota-recovery journey, TypeScript and the production build passed. The quota fixture intentionally has no Firestore reading-position snapshot; it does not assume results from previous demo runs. Firestore permission rules and original website source are unchanged and their earlier verification remains recorded above.

Coverage includes a quota circuit cooldown, safe public catalog fallback, separately verified read-only identity, rejection of forged sessions, original legacy lesson access checks, refusal to expose rankings without privacy data, retryable 503 responses for XP writes, user-scoped dashboard reads despite 1,000 unrelated progress records, deferred staff reports, skipped unchanged profile writes, unchanged migration retries, preserved academic points, and original slide navigation without any XP POST requests. The production fallback must still be confirmed after the new Vercel deployment is Ready.

## Native design migration (3 November 2026)

The seven native browser journeys verify all fifteen presentations in the main document, every original slide through next/previous controls, timed quiz confirmation and answer locking, crossword and financial input, Arena routing, picture-puzzle images and tile swaps, and rejection of scripts/event handlers/unapproved frames. The 13 platform journeys and seven sign-in regressions also pass after adapting selectors to native forms. One full-viewport check timed out after the exhaustive slide traversal under browser load; its isolated rerun passed all fifteen topics. Nested `.inner` and hidden student-alert selectors were corrected; these were test selector failures, not removed content or hidden Google errors.

The server tests additionally verify all fifteen per-topic histories, unchanged academic totals, credential exclusion, independent-learner history without academic grades, quota-limited original results, and refusal to trust stale role claims for quota-mode staff access. Source comparison confirms identical original `<main>` sections and all 242 resource files. The original source and scoring rules are retained as content/logic inputs, with an isolated nonvisual engine; no original page is displayed as the visible interface. See [NATIVE-DESIGN.md](NATIVE-DESIGN.md).

No live student records were read, imported or changed by local verification. Students' original results are read on authenticated sign-in without requiring a bulk Firestore copy. Real production sign-in, roster totals and multiplayer rooms still require verification in the configured deployed project. Firestore quota is not reset by this design change.

## Administrator-only closure and account recovery (3 November 2026)

The managed environment reconnected and repository commands ran successfully.
Current change: 58 unit/server tests passed, all seven authentication browser
regressions passed, three maintenance/roster/password browser journeys passed,
and four focused existing navigation/staff/academic/chat journeys passed.
TypeScript, source formatting and the Next.js production build passed. The
compiled production server also passed loopback checks for default closure,
protected lesson/Arena/roster/material paths, signed owner access and rejection of
a forged cookie. This production smoke used a test-only signing key and no live
Firebase credentials.

Password-reset tests independently derive the original WebCrypto PBKDF2 key,
verify owner-session removal and unchanged academic data, reject unauthorized
actors and malformed inputs, and verify a secret-free audit event. The quota
route test proves recovery uses read-only verified identity without Firestore.
Roster contact information remains staff-only and is excluded from rankings and
migration snapshots. The initial owner browser fixture mistakenly used a separate
API request cookie jar; it was corrected to use the browser context's cookie jar,
and all three maintenance journeys passed. Local HTTP readiness initially went
through the managed external proxy; loopback-only NO_PROXY settings resolved it,
while external proxy and TLS verification remained enabled.

No live import or real student password reset was performed. Actual administrator
UID configuration and Vercel rollout still require confirmation on the deployed
site. See [administrator access](ADMIN-ACCESS.md) for the precise scope and steps.

## Initial passwords and account management (3 November 2026)

Local fixture verification covers the original 1111 hash, one-time initialization,
recovery after an interrupted batch, active-lease exclusion, unchanged academic
data, subsequent personal-password preservation, current-password checks,
unauthorized target rejection, 1111 administrator recovery, and exact-name deletion
with a credential-free archive. Native browser checks cover 1111 login, profile
password confirmation and reauthentication, new registration with the initial
password, and group/account choice for identical names. The maintenance browser
journey now also tests deletion confirmation and removal from the roster. Actual
cohort initialization is deliberately performed by the deployed server only after
an authenticated administrator opens the new version; no production student
credentials were changed by local tools. Administrator-only access remains on.

Final checks for the initial-password change: 64 unit/server tests passed; all
nine authentication journeys passed, followed by the additional identical-name
journey and a registration rerun (both passed); all three maintenance/admin
journeys passed with reset defaults and account deletion. The production build
and TypeScript check passed. The generated original-engine copy is adapted for
initial credentials only; teaching HTML and source archive are preserved.

The original RTDB URL is now a fallback only when the configured Firebase project
matches the original catalog project. An explicit FIREBASE_DATABASE_URL always
wins; an unrelated project never inherits the original database URL. This avoids
requiring an extra URL setting for the existing project while preserving project
separation. No live database credentials are present in local verification.

## Reopening, preserved codes and overall ranking (3 November 2026)

This release supersedes the temporary closure and automatic password setup
recorded above. Access is now open by default; stored personal keys are kept and
`1111` is a separate authorized session path. The old initialization endpoint
is non-destructive, and the client no longer calls it. Password hashes already
lost under an earlier live reset cannot be recovered by this code change.

All 78 unit/server tests passed, including verified owner-email authorization,
student access negotiation while open, owner-cookie issuance before closing,
scoped anonymous common-code grants, revoked-session rejection, unchanged
personal credentials/scores, emergency policy override, policy cache/failure
handling, public minimal academic ranking independent of Firestore quota, and
administrator-only settings writes. TypeScript, formatting and the production
build passed. Production loopback smoke verified the 15-topic single-course
catalog and original lesson remain accessible despite the retired closure flag;
unconfigured login and anonymous settings writes fail instead of fabricating
successful authentication. An initial smoke assertion used an incorrect bridge
marker; checking the actual preserved lesson title passed.

Twelve authentication browser journeys passed with mocked remote services,
including public ranking for guests across groups, original personal-code
verification, common-code entry with preserved points, password changes,
registration and duplicate-name account choice. Three maintenance/admin browser
journeys passed, including protected material paths, signed owner access,
roster/topic history, reset, confirmed deletion and the new platform settings
form. Tests never log in to live Firebase or modify live student records.

All 20 existing platform/native browser journeys also passed in one complete
run (5.2 minutes), including traversal of every slide in all fifteen topics,
mobile/desktop viewports, teacher editing, meaningful completion/duplicate XP,
chat, Arena, install flow and quota-limited academic results. Combined with the
twelve authentication and three maintenance journeys, 35 browser checks passed.
No original root lesson source or resource data was modified by this release.
The deployed Firebase/Google exchange and live Vercel rollout remain unverified
locally; the production smoke ran only on loopback without service credentials.

## Guest ranking restriction (3 November 2026)

This update supersedes public guest ranking access above. The ranking page shows
login to guests, and academic ranking API requests always verify identity before
any original student records are loaded, including in demo and quota fallback
paths. Older `publicLeaderboard: true` settings are normalized to false and the
publishing toggle is removed. Signed-in users retain all-group academic scores.

Validation for this restriction: 79 unit/server tests, twelve authentication
browser journeys and three maintenance/admin browser journeys passed. Coverage
checks guest deep links without ranking requests, signed-in scores across groups,
rejected or missing API sessions before student reads, and ignoring an older
public-ranking setting. TypeScript and the production build passed. Local tests
used fixtures only; no live student data or Firebase settings were changed.

## Topics 1–7 reading access (3 November 2026)

Enabled the same open-reading configuration already used for topics 1–5 on
topics 6 and 7, regenerated every embedded configuration, and retained the
limited defaults for topics 8–15. All 82 unit/server tests passed. New coverage
checks all fifteen actual catalog entries against the original engine's access
functions and the server evaluator: topics 1–7 remain readable even with empty
restricted-group grants; topics 8–15 are closed without a grant and accept an
explicit administrator opening. Every embedded presentation configuration
matches the source configuration. All fifteen original educational main-content
hashes match their pre-change values; no student data was read or modified.
The focused native browser journey for all fifteen presentations passed.
Existing scoring windows and tests are preserved; open reading does not renew
academic assessment deadlines.

TypeScript, formatting and the production build also passed for this update.

## Responsive text and teacher controls (3 November 2026)

Reproduced the reported teacher toolbar at 390px: five controls shrank to
51–69px widths and 190px heights because inline flex wrapping was dropped by the
adapter. The bounded layout allowlist now preserves `flex-wrap`. Native buttons
keep readable word boundaries, mobile teacher tools use two columns (one below
360px), page headings wrap with their actions, and staff tables scroll locally.
Screenshots confirm 44–64px action heights at phone widths after the fix.

The 20 existing platform/native browser journeys passed, including every slide
in all fifteen presentations, quizzes, crossword, Arena, teacher editing, saved
progress, security rejection and quota fallback. Eight focused responsive checks
also passed at 320, 390, 768 and 1280px, measuring actual word line ranges and
clipping, switching original teacher tabs, and visiting eight main pages with a
long profile name. The layout fixture uses a local demo profile and restores its
original value. Initial new-fixture failures involved intercepted responses at
teardown and a zero-height empty marks pane; the revised fixtures use a restored
demo profile and a populated announcements pane. All eight then passed. No live
Firebase account, academic data or teaching text was modified by these checks.

TypeScript, formatting and the production build passed. Live Vercel rollout
was not verified locally.

## Full-window registration and mobile artwork (3 November 2026)

Authentication now renders as a standalone full-width, viewport-height page
for direct login, protected-page prompts and course sign-in. The previous
form-only modal is replaced with the complete branded page. Mobile styling
keeps the existing animation visible in a compact header instead of hiding it;
forms remain a single column with reachable controls through vertical scrolling.
Native login/registration switches update the heading and return to the top.
Originally screen-reader-only helper text retains its intended visual hiding.

All 17 authentication browser journeys passed, covering Google popup/error
handling, restored/rejected sessions, original and 1111 codes, registration and
guest ranking denial. New checks verify full-width geometry, absence of app
chrome, visible artwork, registration controls and no horizontal overflow at
320, 390, 768 and 1440px; course sign-in closes back to its original course.
After the heading refinement, all four responsive checks and actual initial-code
registration passed again. All three maintenance/administrator journeys passed.
TypeScript, formatting and the production build passed. Screenshots of phone
and desktop registration were inspected. Remote auth/database responses in the
sign-in suite are mocked; no live student records or Firebase configuration
were changed, and live Vercel rollout remains to be confirmed after deployment.

## Deferred class reports (4 November 2026)

Routine staff refreshes previously included class-wide user/history/report
queries even on the original academic roster and configuration tabs. These
queries now require the explicit reports flag, with UI loading only for
analytics, learners or CSV. The client shares and reuses the request within the
same base data/session, and refetches after mutation refreshes.

All 83 server/domain tests passed. A 1,000-record fixture confirms that light
staff loads avoid class-wide collections and course-history queries, retain
all fifteen editable lessons, and still return complete reports when requested.
Three browser journeys passed: dashboard navigation, teacher/admin editing,
and measured deferred report loading (zero report requests on normal entry or
settings, one request reused across analytics/learner tabs and CSV). TypeScript,
formatting and the production build passed after correcting test-only typed
assertions. No live Firebase records, quota or billing settings were changed;
actual production read savings require observation after deployment.

## Soft topic 7 palette (4 November 2026)

Added a topic-ID-scoped theme for the native topic 7 reader: muted mint, blue,
sand and lavender card surfaces, darker matching headings, warm callouts and
subtle table/cover accents. Dark mode has its own low-glare palette. The site
receives small inactive navigation-icon accents; other presentations retain
their existing theme. Original text, emoji characters, quizzes and grading
logic are unchanged. No database requests are added.

Manually opened all eighteen topic 7 slides in the isolated local demo, inspected
desktop, 390px phone and dark-mode screenshots, and checked that topic 6 has no
new theme class. Production rollout is not checked locally.

Production build (including TypeScript) and source formatting passed.

## CRM content revision (4 November 2026)

Imported the user's CRM PDF as twenty-two readable native slides, with original
page artwork and a byte-preserved PDF download. New reading uses a separate RTDB
revision instead of mutating historical grades or restarting the old grading
engine. The source presentation and old assessment data remain archived.

All 86 unit/server checks passed, including new regressions proving that an old
95-point, grade-5 completed topic becomes unread at page one with 22 pages while
retaining the same total and mark; a completed new reading restores only reading
status; invalid indices, alternate student IDs and grade injection cannot write
progress. The revision writer only updates the actor's scoped reading record.
Three browser journeys passed: full CRM navigation, delayed reading tracking,
original artwork/PDF, mobile width and guest API rejection; all fifteen lesson
readers; and full presentation viewports. An original iframe assertion was
adapted for the new native CRM reader, which intentionally has no compatibility
iframe. Mobile rendering was visually reviewed. Live student accounts and
production records were not read or changed by local tools.

TypeScript, source formatting and the Next.js production build passed.

## Colour and responsive slide navigation (4 November 2026)

Added soft blue, mint and sand accents to the native lesson cards, with matching
high-contrast headings and dark palettes. The reader shows the subject, full
wrapping lesson title, course-specific topic count and current slide. Persistent
bottom controls provide previous/next buttons and a direct slide selector;
horizontal reading-area swipes and keyboard arrows also navigate. Vertical
scrolling, form inputs, quiz controls, text selection and tables keep their usual
interaction. Changed slides reset the reading scroll position and use a short
transition, disabled when reduced motion is requested.

The original compatibility bridge now selects the destination's existing dot
control directly, rather than taking a single step for every requested index.
This preserves the original lesson navigation and grading hooks and does not
visit or mark intermediate pages. No educational text, student scores, backend
reward rules or production records were changed.

Local browser coverage includes all fifteen native readers and full viewports,
the CRM revision and PDF, timed quiz answer locking, crossword and financial
exercise controls, plus direct selection, touch and keyboard navigation at 320,
390, 768 and 1440 pixel widths. Phone and desktop screenshots were visually
reviewed. Production availability requires the resulting deployment to finish.

All six selected browser journeys passed. TypeScript, source formatting and the
Next.js production build passed. The navigation test initially exposed the old
bridge's single-step behaviour; it passes after the direct destination fix.

## Topic 7 TerDU lecture styling (4 November 2026)

Restored the vivid lecture style requested from the user's reference photograph
for the CRM reader: the repository's original TerDU crest appears large on the
cover and smaller on subsequent slides, with green/cyan/violet title gradients,
a violet lecture badge and green, blue, purple and amber content panels. The
styles are scoped to `.crm-bright`; all twenty-two CRM slides, original PDF
artwork/download, reading revision, rewards and historical grades are retained.

The CRM browser journey and responsive reader navigation journey passed, checking
all twenty-two logos, the actual logo image load, artwork switching, the PDF,
reading persistence, guest rejection and navigation at 320–1440 pixel widths.
Cover screenshots on desktop/phone and a dark content screenshot were visually
reviewed. Checks use the isolated demo; no live student records were changed.

TypeScript, source formatting and the Next.js production build passed.
