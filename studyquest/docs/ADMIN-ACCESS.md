# Administrator access, signed-in ranking and student records

The platform is open by default. Students sign in with their original name,
surname and stored personal code, or the additional common code `1111`.
Existing approval, blocked status and lesson/group access checks remain active.
The overall academic ranking requires a verified signed-in account, including
across groups. Guest visits show login, and direct ranking API requests reject
missing or invalid sessions before reading any student rows.
Only name, group, academic points and a record identifier are returned. Contact
email, credential keys and reading history remain outside the ranking response.
Blocked, unapproved, independent and explicitly hidden original accounts are
excluded. Academic ranking publication is separate from opt-in platform XP
ranking visibility, which still uses private Firestore settings.

## Owner identity and access controls

Sign in through Google as **isfandiyor2198@gmail.com**. The server requires the
Firebase token's verified email and assigns **Isfandiyor Sayfiddinov** the admin
role. A typed name, unverified email or client-side role grants no permissions.
`STUDYQUEST_ADMIN_UIDS` remains an optional trusted UID allowlist.

Open **Boshqaruv → Platforma** to control:

- Temporary closure to everyone except the verified owner.
- Additional `1111` login (turning it off prevents new common-code logins;
  existing owned sessions and personal codes remain usable).

Settings are saved to the original RTDB `meta/platformPolicy`, cached for up to
five seconds per instance. Guest ranking access is always disabled, even when
old metadata contains `publicLeaderboard: true`; that compatibility field is
normalized to false and no longer has a UI switch. This requires the existing metadata read permission.
A failed metadata request retains a previously cached policy; a cold instance
falls back to public defaults if metadata is unavailable. Sensitive API actions
always enforce identity and role independently. The old `PLATFORM_ADMIN_ONLY`
variable is retired and ignored. `PLATFORM_MAINTENANCE=true` is a separate
emergency server override and must be removed/set false with a redeploy before
the UI can reopen access.

`POST /api/admin-access` checks token revocation without Firestore. A verified
owner receives an HTTP-only, SameSite=Strict cookie valid for fifteen minutes,
signed using `PLATFORM_ACCESS_SECRET` or the existing server-only
`FIREBASE_PRIVATE_KEY`. Production cookies are Secure. The cookie is issued even
while open, refreshed during API activity and cleared on logout. It does not
replace token authorization on API operations. Other authenticated users receive
an open-access response without an owner cookie while the platform is open.

During closure Next.js Proxy protects `/legacy/` documents, assets, image
optimization and API access. Unauthorized catalog requests return only empty
maintenance metadata. Previous downloads and historical public GitHub source are
not recalled. Paid/private materials should use protected Storage/API endpoints.

## Original codes and common-code sessions

Existing personal keys are never replaced merely by visiting, logging in,
opening the roster or enabling `1111`. New common-code login verifies an anonymous
Firebase identity, original name/surname and active account before creating an
opaque grant under `owners/<student>/<uid>`. It returns only success, not personal
credential hashes or salts. Restoring that session requires the existing scoped
grant. Identical names require a group/account choice before ownership is claimed.
Other personal codes continue through original credential verification.

The older `initializeStudentPasswords` action is now a non-destructive
compatibility response with an account count. The provider no longer calls it.
If a previous release already overwrote a student's original key with `1111`,
the former code cannot be reconstructed from the current database; `1111` still
works and a personal password can be set again. This release does not claim to
restore lost credential hashes. New registrations keep their displayed initial
code `1111`.

Students use **Profil → Parolni o‘zgartirish**, supplying the current password
(or `1111` from a verified common-code session), and confirm a new password of
8–128 characters. The target comes from verified ownership, not an arbitrary ID.
The API writes the original PBKDF2-SHA256 format (600,000 iterations, fresh salt),
revokes old owner sessions and requests sign-in again. Academic scores, group and
reading history remain unchanged. Common-code login remains an additional method
while enabled globally, even after a personal password is chosen.

## Administrator workflow

**Boshqaruv → Talabalar va baholar** is the default admin tab. The live roster
shows original names, groups, status, scores, fifteen topic results, reading
history, registration date and private contact email. Search and group filters
span the roster; thirty rows render per page. **Natijalar** shows all fifteen
topics. It does not require bulk Firestore migration.

**Parolni tiklash** defaults to enabling `1111` recovery while keeping a stored
personal key; it revokes old owner sessions and marks the initial-code notice.
A custom password of at least eight characters replaces the personal key using
PBKDF2. Recovery uses RTDB and verified read-only identity, so Firestore quota
does not block it. Audit events contain no plaintext password. The global
common-code switch must be enabled for `1111` recovery to be available.

**Talabani o‘chirish** requires typing the displayed full name. An atomic update
archives the learning record without credential fields, removes the active
student, keys, owners and private contact record, and writes a deletion marker
and audit event. Deleted students disappear from the roster and rankings; stale
Firestore profiles are excluded from staff lists and reports. Historical game
messages and Firestore learning records are not erased.

Course, lesson, quiz, student, class, score, achievement, XP settings and report
controls remain in their corresponding staff tabs. **Kursni boshqarish** includes
the original announcements, assignments and Arena controls in the native design.
**Mavjud talabalarni ulash** is still an explicit, repeat-safe Firestore snapshot
operation and is unavailable during Firestore quota exhaustion. Grades remain in
original RTDB records regardless of whether that snapshot was run.

Local tests use isolated fixtures and mocked remote services. They do not read or
reset production credentials. Real student counts, production owner Google
sign-in and Vercel rollout must be checked on the configured deployed project.

## Topic availability

Topics 1–7 are available for reading to approved students across all groups.
Topics 8–15 remain limited by the original administrator-controlled access grants
and are closed by default without a grant. The owner opens them through
**Boshqaruv → Kursni boshqarish → Mavzuni guruhlarga ochish**, choosing everyone,
a group or an individual. Existing explicit grants, weekly scoring windows and
reading-only transitions are preserved; opening reading access does not reset
grades or restart assessment deadlines. The source config and embedded configs
are generated together so the server and original learning engine agree.
