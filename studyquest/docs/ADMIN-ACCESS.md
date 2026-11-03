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

## Initial password and student changes

On the first authenticated administrator refresh after this deployment, the
client explicitly POSTs `initializeStudentPasswords`. The server sets existing
student credentials to `1111` once, using the original name/surname/PIN hash.
A persistent RTDB completion marker prevents later administrator visits from
resetting personal passwords. A two-minute distributed lease prevents parallel
jobs; batches of fifty and per-student version stamps allow interrupted work to
resume safely. Individual account operations wait while initialization is active.
The administrator roster shows the outcome and offers a retry control if setup
is incomplete. No live initialization is performed by local tests.

New registrations in generated platform copies also start with a displayed,
read-only `1111` password and the same setup version. The archived root source and
teaching content are unchanged. When identical names match more than one record,
login asks the student to choose a group/account before claiming ownership;
it does not silently select the first student's grades.

Students use **Profil → Parolni o‘zgartirish** after access is reopened. They must
enter the current password and confirm a new password of 8–128 characters.
The API derives their target ID from verified account ownership, rejects an
arbitrary target ID and incorrect current password, and writes the same
PBKDF2-SHA256 format as the original login (600,000 iterations, fresh salt).
Changing a password revokes existing owner sessions and asks the student to
sign in again; grades, group and progress remain unchanged. The initial-password
hint disappears. A resumed setup job skips this personally changed record.

## Administrator reset and deletion

**Parolni tiklash** defaults to `1111`. The administrator can instead choose a
personal password of at least eight characters. Credential keys are hashed;
plaintext passwords are not saved or returned. Each reset clears old owner
sessions and writes a secret-free audit event. Recovery uses verified read-only
identity and RTDB, so Firestore quota does not block it.

**Talabani o‘chirish** requires typing the displayed full name. One atomic RTDB
update archives the original learning record without credential fields, removes
the active student, credential keys, owner sessions and private contact record,
and writes a deletion marker and audit event. Deleted students disappear from
the live roster; stale Firestore profiles are excluded from active staff lists,
reports and XP rankings using the marker. The archive is a separate
server-managed collection denied by the original client rules. Historical game
messages and Firestore learning records are not erased. Administrator accounts
use their separate Google UID and are not part of the legacy student roster.

The temporary administrator-only restriction remains enabled until the owner
explicitly reopens the platform. Initializing passwords does not reopen access.

Local verification uses isolated fixtures and mocked remote services. Actual
student counts, configured owner login and a real password reset must be checked
in the deployed project; local checks do not perform a live migration or reset a
student password.
