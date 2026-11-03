# Temporary administrator access and student records

The platform is temporarily closed by default. Only Firebase UIDs in the existing
server-side `STUDYQUEST_ADMIN_UIDS` setting may enter. Teachers and students are
also excluded while this restriction is enabled. The Google sign-in control stays
available on the maintenance page.

`POST /api/admin-access` checks the Firebase token, including revocation, without
Firestore access. It issues an HTTP-only, SameSite=Strict cookie valid for fifteen
minutes, signed using `PLATFORM_ACCESS_SECRET` or the existing server-only
`FIREBASE_PRIVATE_KEY`. Production cookies are Secure. The provider refreshes this
access during API activity and removes it on logout. Changing the UID allowlist
invalidates previously issued cookies. Firebase administrative keys never enter
client bundles.

Next.js Proxy protects all `/legacy/` documents and assets, including image
optimization requests, and API reads/writes. Unauthorized catalog requests return
only empty maintenance metadata. API identity checks separately enforce the owner
UID even if a signed cookie is presented with a different user's token. Existing
GitHub Pages entry points redirect into this protected application. This does not
recall already downloaded files, alter historical public GitHub source, or change
Firebase database security rules.

To reopen access later, set `PLATFORM_ADMIN_ONLY=false` in Vercel and redeploy.
Do not change the administrator UID or reset student records to reopen the site.
For local demos/tests, explicitly use `PLATFORM_ADMIN_ONLY=false`; production never
accepts demo authentication.

## Administrator workflow

Open **Boshqaruv → Talabalar va baholar**. This is the default administrator tab.
The roster reads the original database live, including name, group, status,
academic total, per-topic grades, reading history, registration date and contact
email. Contact email comes from the original private contact collection and is
returned only by the authorized staff roster endpoint, never public rankings or
migration snapshots. Search and group filters work across the entire roster;
only thirty rows are rendered per page. **Natijalar** shows all fifteen topics.

The live roster and student results do not depend on a bulk Firestore import.
**Mavjud talabalarni ulash** remains the explicit, repeat-safe Firestore snapshot
operation; its button is unavailable during Firestore quota exhaustion. Existing
students retain their accounts, history and academic totals.

Select **Parolni tiklash** next to the chosen student. Enter a new password of
8–128 characters, then press **Yangi parolni saqlash**. Give that password to the
student through your usual channel. Students later sign in with their original
name/surname and this new password when access is reopened. The application does
not send messages or expose old passwords.

The server independently checks administrator identity, validates the student ID
and password, and derives the same PBKDF2-SHA256 key as the original login:
600,000 iterations and a fresh 16-byte salt. A single atomic RTDB multipath update
replaces the credential key, clears previous owner sessions, sets the original
password-format metadata, and appends an administrator audit event without the
password or credential hash. It does not replace student records, edit grades,
change groups, or award XP. No plaintext password is saved in Firebase or returned
in the response. This action uses read-only verified identity and RTDB, so it
remains available when Firestore quota is exhausted.

Local verification uses isolated fixtures and mocked remote services. Actual
student counts, configured owner login and a real password reset must be checked
in the deployed project; local checks do not perform a live migration or reset a
student password.
