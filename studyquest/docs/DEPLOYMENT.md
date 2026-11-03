# Staging and deployment

The recommended target is Vercel for Next.js and Firebase for authentication, Firestore, Storage, and the existing Realtime Database. GitHub Pages cannot run the protected Node.js API. The configured existing Pages links now open the matching Vercel page. Keep the repository’s original materials as the source of truth.

## 1. Firebase configuration

1. Use the **same Firebase project as the original platform** to preserve existing account ownership and teacher sign-in. Enable Firestore and Storage without replacing existing Realtime Database rules/data.
2. In Authentication, enable Email/Password, Google, and Anonymous sign-in. Anonymous sign-in is used by the existing name/password account ownership system. Add your staging/production domains to authorized domains.
3. Fill `.env.local` from `.env.example` for local development. `NEXT_PUBLIC_FIREBASE_*` values come from your Firebase web app and are public client configuration. Server variables must refer to the same project.
4. Configure a dedicated server service account with only the access needed for Auth verification, Firestore, original RTDB ownership/access reads, and Storage. Put `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_PROJECT_ID`, `FIREBASE_DATABASE_URL`, and `FIREBASE_STORAGE_BUCKET` in server environment configuration. Keep the private key out of all `NEXT_PUBLIC_*` variables and Git. The loader accepts escaped `\n` in the key. Application default credentials through `GOOGLE_APPLICATION_CREDENTIALS` are supported for local/cloud environments with a mounted credential file.
5. Review `firestore.rules`, `storage.rules`, and `firestore.indexes.json`. These rules intentionally require the server API for private data. If your Firebase project already uses Firestore/Storage for another product, merge the rules instead of replacing that product's permissions.

After reviewing the exact target project and rule diff, deploy from this folder:

```bash
npx firebase-tools deploy --project YOUR_PROJECT_ID --only firestore:rules,firestore:indexes,storage
```

This command changes live rules. It is a documented deployment step, not part of local tests or an action already performed.

## 2. Initial administrator

Sign in through Google with the verified owner email `isfandiyor2198@gmail.com`. The server assigns this identity the administrator role and displays Isfandiyor Sayfiddinov. Entering this name or email into a student form grants no privileges. `STUDYQUEST_ADMIN_UIDS` remains an optional server-side UID allowlist for additional owner accounts; multiple UIDs may be comma-separated.

Alternatively, run the included bootstrap script in a securely configured shell:

```bash
BOOTSTRAP_ADMIN_UID=EXISTING_AUTH_UID npm run bootstrap-admin
```

The script sets an admin custom claim and a matching private Firestore role; it does not create a password or user. It uses exported server credentials/ADC; it does not automatically load `.env.local`. Sign out and back in afterward. Keep the initial administrator allowlist small and remove a UID from the allowlist when revoking that override.

Existing verified teacher email sign-in is recognized by the configured original teacher email hash. Further teachers are approved by an administrator. Students never choose their own staff role.

## 3. Vercel staging

1. Import this GitHub repository into Vercel as a new project. Select **Root Directory: `studyquest`**, framework Next.js, Node.js 22, build `npm run build`, install `npm ci`.
   The included `vercel.json` explicitly selects Next.js and restores its default output handling. This prevents the project from being served as a generic static site if import detection selects Other. Leave Output Directory at the framework default.
2. Enable access to files outside the root directory in Vercel project settings. The build copies original lesson files from the repository root; build from a full checkout, not an isolated copy of `studyquest/`.
3. Add the Firebase environment values for Preview and Production separately. Set `STUDYQUEST_DEMO=false`. The configured function region is Singapore (`sin1`), matching the existing Firebase databases. Demo role authentication is additionally disabled by code on Vercel and in production.
4. Build a preview deployment first. Add that exact stable preview domain to Firebase authorized domains. Rebuild after changing `NEXT_PUBLIC_*` values because they are embedded at build time.
5. Sign in as the administrator and use **Administrator → Import catalog** to add the original lessons and sample assessment to the new Firestore collections. Import is additive; it never replaces existing records or original content.

Original browser sessions stored under GitHub Pages do not automatically transfer to a different domain. Students sign in with their existing credentials on the new domain; the backend verifies ownership against the same original Firebase project. Their original scores stay in RTDB.

## 4. Review before switching the public link

Verify real email/Google sign-in and password reset, original name/password login, original group approval/access, independent open lessons, teacher editing, a real PDF upload/download, administrator role changes, and duplicate XP protection on staging. Confirm that existing academic grades are unchanged. Local demo/emulator tests do not verify production credentials or IAM permissions.

Start the repeat-safe existing-account import explicitly through Teacher/Administration → Academic records → Link existing students. It does not run automatically at login or refresh. See [MIGRATION.md](MIGRATION.md).

No payment provider is connected in this version. Paid enrollment requires a separate reviewed payment/webhook integration before selling courses. Student dashboards use user-scoped queries, reports load on staff screens, and public catalog lists are cached for up to sixty seconds per server instance. Large deployments still need paginated staff reports and precomputed leaderboard aggregates.

Original Pages routes redirect to `https://tadbirkorlik-asoslari.vercel.app/`. Changing this public origin later requires updating `platform-redirect.js`. The copied `/legacy/` documents redirect standalone visits into the new application but can run as nonvisual compatibility engines for authenticated learning/account/game workflows. Their sanitized content is rendered in the native application design.

## Troubleshooting

- `Tadbirkorlik asoslari services are not configured`: check server project/service-account variables, not only the public web configuration.
- Existing students cannot access a lesson: check the original account approval, `owners` record, group, and topic access. New course enrollment does not bypass the original access rules.
- Staff permission error: check the authenticated account's canonical user ID and private role. Refresh the sign-in after changing custom claims.
- Upload fails: verify the Storage bucket, service-account IAM, course ownership, file signature, and 4 MiB limit.
- Build cannot find original files: enable outside-root repository access and preserve the original root files in the checkout.

## Firestore quota exhaustion

`8 RESOURCE_EXHAUSTED: Quota exceeded` is a Firestore service limit, not an incorrect Google password. Check Firestore → Usage and the relevant Google Cloud quotas to identify whether reads, writes, or another limit was reached. Daily free quotas reset on Firebase's schedule; changing code does not restore an exhausted quota. A paid billing plan is a separate owner decision and is not required or enabled by these fixes.

The server backs off Firestore requests for sixty seconds per instance after a quota failure. The app serves only the existing repository course catalog in limited mode, verifies Google tokens and original RTDB student ownership/status without a Firestore write, and preserves live original academic totals and all fifteen per-topic histories. Separately reverified staff can still read the original academic roster and update its existing status/class/manual marks; Firestore custom role claims alone cannot grant this limited-mode access. The limited lesson endpoint checks original group/access permissions before returning an original presentation. XP, streak and new completion values that cannot be loaded are shown as unavailable; no temporary balances or demo students are written. New XP, private uploads, new quizzes and Firestore management operations return a retryable 503. Private XP rankings fail closed if their Firestore privacy data cannot be loaded. The public overall academic ranking uses original RTDB scores and an explicit minimal field allowlist, independently of Firestore.

After the quota is available again, refresh the site to return to the full platform. Bulk migration is manual, and unchanged student snapshots are skipped on retries. No old accounts, original grades or learning materials are reset by this fallback.

## Public access and runtime controls

The platform now defaults to open access, public overall academic ranking, and
`1111` as an additional login method alongside stored personal codes. Previous
`PLATFORM_ADMIN_ONLY` environment values are ignored. This release does not
perform a bulk password reset. Students use the new Vercel address, or the old
Pages link that redirects there. Existing account approval, blocked status and
lesson/group restrictions still apply.

The verified owner opens **Boshqaruv → Platforma** to change maintenance access,
public academic ranking visibility, and common-code login. Settings are saved in
`meta/platformPolicy` in the original RTDB, without a Firestore write or redeploy.
Policy checks cache values for up to five seconds per server instance. The proxy
reads only these public nonsecret booleans using the existing RTDB metadata read
permission. Previously cached policy is retained on a read failure; a cold
instance without available metadata falls back to the public defaults. Role and
student ownership checks continue independently. Runtime maintenance is an
availability control, not a substitute for authorization or private storage.

`PLATFORM_MAINTENANCE=true` is an optional server emergency closure, overriding
the runtime switch and requiring a redeploy when changed. Remove it or set it
false for the administrator switch to reopen the site. Existing Firebase key
configuration signs the HTTP-only owner cookie. Owner access is verified even
while open so enabling maintenance does not require a new sign-in immediately.

FIREBASE_DATABASE_URL is optional for the matching original Firebase project:
the catalog's original URL is used as a fallback. Other projects require their own
explicit database URL. See [administrator access and recovery](ADMIN-ACCESS.md).
