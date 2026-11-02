# Verification record

Verified locally on 3 November 2026 (Asia/Tashkent), without live Firebase credentials or a deployment.

| Check                                  | Result                                                                                                                                                                                                        |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Next.js production build               | Passed, including TypeScript                                                                                                                                                                                  |
| Standalone TypeScript check            | Passed                                                                                                                                                                                                        |
| Source formatting                      | Passed                                                                                                                                                                                                        |
| Server/domain and legacy-session tests | 17 passed                                                                                                                                                                                                     |
| Firestore permission emulator          | 6 passed; only `demo-studyquest` used                                                                                                                                                                         |
| Browser journeys                       | 5 passed                                                                                                                                                                                                      |
| Original website regressions           | Design library, university/independent learning paths, and password compatibility passed                                                                                                                      |
| Original educational content           | All 15 lesson `<main>` sections exactly match the pre-change Git version                                                                                                                                      |
| Production smoke                       | Original 15-lesson fallback works, demo role login returns 404 even when the demo flag is set, original copy has production bridge configuration, login video plays, mobile login fits, no browser exceptions |
| Production dependency audit            | 0 known vulnerabilities (`npm audit --omit=dev`)                                                                                                                                                              |

The browser tests cover mobile/desktop layout, dark-mode persistence, three interface languages, search, forbidden role escalation, forged cookies, origin checks, private answer protection, teacher course/lesson creation, server-measured completion, duplicate rewards, saved original slide navigation, upload rejection, and administrator access. Saved-reading tests account for previously saved progress, so rerunning the suite does not assume a fresh slide position.

Patched transitive gRPC and UUID versions are declared in `package.json` overrides. Firestore emulator and browser tests passed after those dependency changes.

Not verified against a live project: Firebase Email/Google/legacy sign-in, service-account IAM, Storage uploads, real email delivery, and Vercel deployment. See [DEPLOYMENT.md](DEPLOYMENT.md) for the staging review steps. Existing production data, live rules, hosting, and the public domain were not modified.
