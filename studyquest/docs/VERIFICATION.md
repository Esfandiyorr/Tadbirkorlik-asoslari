# Verification record

Verified locally on 3 November 2026 (Asia/Tashkent), without live Firebase credentials or a deployment.

| Check                                  | Result                                                                                                                                                                                                        |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Next.js production build               | Passed, including TypeScript                                                                                                                                                                                  |
| Standalone TypeScript check            | Passed                                                                                                                                                                                                        |
| Source formatting                      | Passed                                                                                                                                                                                                        |
| Server/domain and legacy-session tests | 26 passed                                                                                                                                                                                                     |
| Firestore permission emulator          | 6 passed; only `demo-studyquest` used                                                                                                                                                                         |
| Browser journeys                       | 12 passed                                                                                                                                                                                                     |
| Original website regressions           | Original passwords, learning paths, grading, ranking tables, game invitations and multiplayer/chat suites passed                                                                                              |
| Original educational content           | All 15 lesson `<main>` sections match the pre-change Git version; all 242 original resource files copied identically                                                                                          |
| Production smoke                       | Original 15-lesson fallback works, demo role login returns 404 even when the demo flag is set, original copy has production bridge configuration, login video plays, mobile login fits, no browser exceptions |
| Production dependency audit            | 0 known vulnerabilities (`npm audit --omit=dev`)                                                                                                                                                              |

The browser tests cover mobile/desktop layout, dark-mode persistence, three interface languages, search, a course catalog with 15 numerically ordered topics inside one course, stable topic numbers after filtering, forbidden role escalation, forged cookies, origin checks, private answer protection, teacher course/lesson creation, server-measured completion, duplicate rewards, saved original slide navigation, upload rejection, and administrator access. Saved-reading tests account for previously saved progress, so rerunning the suite does not assume a fresh slide position.

Patched transitive gRPC and UUID versions are declared in `package.json` overrides. Firestore emulator and browser tests passed after those dependency changes.

Current migration was verified with fixtures, not executed against the live roster by local tests. The authorized import runs in the administrator’s production browser session after deployment; its actual count must be checked there.

Not verified directly against a live project: Firebase Email/Google/legacy sign-in, service-account IAM, Storage uploads, real email delivery, and Vercel deployment. See [DEPLOYMENT.md](DEPLOYMENT.md) for the staging review steps. Local verification did not read or modify live student data. The published transition updates the application and old entry points; authenticated administrator migration is documented in [MIGRATION.md](MIGRATION.md).

Transition coverage additionally includes old-link mapping, credentials excluded from redirects/snapshots, repeat-safe imports, preservation of existing XP/roles/progress, legacy summary-only completion, academic point display, all 15 clean presentation viewports, integrated chat/Arena, direct legacy-link return routes, name/surname/code entry, and the install prompt.
