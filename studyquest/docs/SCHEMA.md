# Firestore data model

All timestamps below are Unix milliseconds. Document IDs are server-generated UUIDs or validated deterministic keys. Existing RTDB paths, passwords, academic points, groups, and presentation data stay in the original database.

| Collection         | Document key                         | Main fields / purpose                                                                                                                                               |
| ------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users`            | Firebase UID or `legacy_<studentId>` | `uid`, `name`, optional `email`, `role`, `learnerType`, `classId`, `xp`, `streak`, `lastStudyDay`, `leaderboardVisible`, `createdAt`, optional `blocked`            |
| `authLinks`        | Firebase UID                         | `actorId`; private mapping used by administrative tooling; not sufficient authorization by itself                                                                   |
| `subjects`         | UUID                                 | `title`, `ownerId`                                                                                                                                                  |
| `courses`          | UUID or `tad-asoslari`               | `title`, `description`, `ownerId`, `published`, `difficulty`, `category`, `illustration`                                                                            |
| `modules`          | UUID / imported module ID            | `courseId`, `title`, `order`                                                                                                                                        |
| `lessons`          | UUID or original `m1`–`m15`          | `courseId`, `moduleId`, `title`, `order`, `published`, `minSeconds`, `slideCount`, `slides[]`; imported originals have `legacyFile`; uploads reference `materialId` |
| `presentations`    | UUID                                 | `courseId`, `ownerId`, `name`, `type`, `size`, private Storage `path`, `createdAt`                                                                                  |
| `quizzes`          | UUID                                 | `lessonId`, `title`, `passingScore`, `attempts`, `timeLimit`, `randomize`, `feedback`; no answer keys                                                               |
| `quizKeys`         | Quiz ID                              | Private `questions[]`, including correct answers, accepted short answers, and explanations                                                                          |
| `quizAttempts`     | UUID                                 | `userId`, `quizId`, `courseId`, `startedAt`, randomized `questionIds[]`; submission adds `submittedAt`, `answers`, `score`, `correct`, `passed`                     |
| `quizUsage`        | `<userId>_<quizId>`                  | `userId`, `count`; reserved transactionally at quiz start                                                                                                           |
| `enrollments`      | `<userId>_<courseId>`                | `userId`, `courseId`, `at`                                                                                                                                          |
| `progress`         | `<userId>_<lessonId>`                | `userId`, `lessonId`, `courseId`, `startedAt`, `updatedAt`, unique `seen[]`, `last`, `completed`                                                                    |
| `xpTransactions`   | `<userId>_<kind>_<target>`           | Immutable reward event: `userId`, `courseId`, `classId`, `kind`, `points`, `createdAt`                                                                              |
| `achievements`     | Badge ID                             | Public badge `name`, `description`, `icon`                                                                                                                          |
| `userAchievements` | `<userId>_<badgeId>`                 | `userId`, `badgeId`, `at`, optional `awardedBy`                                                                                                                     |
| `classes`          | UUID / original group ID             | `title`, `teacherId`, `ownerId`                                                                                                                                     |
| `challenges`       | Challenge ID                         | Reserved configuration; current daily challenge requires a passed quiz that day                                                                                     |
| `notifications`    | Reward event ID                      | `userId`, `title`, `createdAt`; only the recipient is returned by API                                                                                               |
| `settings`         | `platform`                           | Configurable `rewards` and ordered `levels[]`                                                                                                                       |
| `leaderboards`     | Reserved                             | Current boards are computed from authorized XP ledger entries; no client-maintained score documents                                                                 |

## Access and invariants

Production API authentication verifies revoked Firebase tokens. Existing students must additionally own the original RTDB account and have a current eligible status on every request. New email accounts cannot self-assign teacher/administrator roles. Teachers manage their own courses and the imported system course; administrators manage all courses. Staff analytics expose only students enrolled in managed courses. Independent learners are excluded from university leaderboards and class assignment.

Firestore rules permit public published catalog metadata, badge definitions, subjects, and platform reward settings. All private SDK reads and all client writes are denied, including clients with staff claims. Storage clients are also denied direct access. The server applies authorization before using the privileged Admin SDK. This prevents a stale client claim or old legacy-owner link from bypassing current access checks.

Reward transactions read the user and a deterministic event key, then write the XP balance, ledger event, notification, and appropriate badge atomically. Pending writes remain visible to subsequent rewards within the same transaction. Repeated submissions/completions cannot create a second reward for the same target. Daily reward keys use the Asia/Tashkent calendar date. Calendar week/month leaderboard boundaries also use Asia/Tashkent.

`users` may also contain `legacyId`, `legacyStatus`, `academicPoints`, `academicTopics`, `manualMarks`, `readingHistory`, `legacyLinkedAt`, `legacySourceHash`, and `authLinkedUid`. The private `migrations/legacy-v1` document records the authorized import count, timestamp and administrator. Credentials, password hashes and ownership keys are never imported.

The original university permissions remain authoritative for imported lessons. Enrollment alone does not unlock a closed original topic. Imported catalog seeding adds missing Tadbirkorlik asoslari records and never updates an existing lesson document or original RTDB data.

`firestore.indexes.json` includes indexes for progress, attempts, and XP queries. Private student dashboard reads use equality queries on `userId`; managed-course reports use `courseId` and load only on staff screens. Public catalog lists have a sixty-second per-instance cache invalidated by metadata edits. Authorization records are never cached. Paginated collection scans remain for explicit administrator reports and rankings; large deployments still require report pagination and leaderboard aggregates.

`readingHistory` is a whitelisted view of the original topic/slide/time/activity records for each of the fifteen lessons. It contains seen/total slide counts, last position, seconds, correct-answer count, status, and university-only academic score/grade. Original credentials and private owner data are excluded. Academic totals remain the original `students/<id>/total`; they are not recalculated or converted into XP.
