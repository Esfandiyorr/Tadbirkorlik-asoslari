# Native interface migration

The visible application uses one design system for presentations, authentication,
activities, account tools, chat and the game arena. Existing educational text and
academic records remain authoritative; the migration must not replace scores with
demo data or reset completed work.

Implemented architecture:

1. Add a sanitized native content surface and a validated same-origin interaction
   adapter. Render content in the main document with the application typography,
   cards, forms, tables and responsive layout. No original page is shown in a
   foreground iframe.
2. Connect all fifteen original lessons, timed quizzes, crossword and financial
   exercises. Preserve the existing attempt, ownership, group-access and scoring
   logic through an isolated, nonvisual compatibility engine. Native interactions
   target existing controls; the adapter never accepts arbitrary XP or score
   amounts. This avoids rewriting historical assessment rules during a design
   migration.
3. Apply the same surface to original registration, account/group settings, class
   chat, advanced teacher tools and multiplayer Arena. Preserve rooms, messages,
   uploaded materials and original account credentials.
4. Return sanitized original per-topic academic results and reading history in
   both normal and quota-limited API responses. Show these in course cards and the
   student's native profile. Independent learners retain reading history without
   university ranking participation.
5. Verify real native controls and layout on desktop/mobile, all fifteen lesson
   covers, long content, video, quiz attempts, crossword input, math activities,
   chat, Arena navigation, data isolation, and quota recovery. Keep source lessons
   as archival content/logic inputs; old public links continue to redirect to the
   new interface.

The compatibility engine is not a second visible design. Its DOM is serialized
without scripts, styles, executable attributes or credentials. The native surface
sanitizes every snapshot again and forwards only bounded user input to elements
inside the current approved surface. All messages validate exact origin and
source window. Password values are never serialized back into snapshots.

## Responsive controls

The adapter forwards validated inline `flex-wrap` alongside the existing layout
allowlist. Losing that property made original teacher toolbars shrink every
button into a single unwrapped row; inherited arbitrary-word wrapping then split
labels into letter columns. Button labels now keep normal word boundaries,
controls retain their content width, and mobile teacher actions use two columns
(or one column on the narrowest phones). Wider staff tables scroll inside their
own wrapper. Page headings reflow with their actions, and ranking names can wrap
without shrinking avatars or scores. No teaching text or academic logic changes.
