# Question Workbench — Design

**Date:** 2026-09-23
**Status:** Approved in mockups (visual companion session, option C), pending spec review
**Supersedes:** §5 "Question screen layout" of `2026-09-23-engineer-mentat-academy-design.md`

## 1. Goal

Replace the single-column question screen with a workbench: question on the left, answer
on the right, one action bar across both, retries governed by a preference, and clear
purposes for "Mark for review" and "My notes". Every question kind and every mode (Drill,
Mock, Review, permalink) uses the same component.

## 2. Layout

Desktop (≥ `md`, 768 px):

```
┌ header strip: [Level chip] [Kind chip] Subject · Topic        ☆ Mark for review  📝 My notes  ⛓ ┐
├────────────────────────────────┬─────────────────────────────────────────────────────────────┤
│ QUESTION PANE                  │ ANSWER PANE                                                 │
│  prompt (Markdown)             │  kind-specific input (options / editor / textarea)          │
│  code (predict) / schema (sql) │  feedback panel (after a submit)                            │
│  kind hint (muted)             │  explanation panel (only when resolved)                     │
│  ▸ My notes drawer (collapsed) │                                                             │
├────────────────────────────────┴─────────────────────────────────────────────────────────────┤
│ action bar: [attempts pill]                     [Reset] [Show answer] [Submit] [Next →]      │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

- Panes are a two-column CSS grid (`md:grid-cols-2`, gap 6). Each pane scrolls with the page;
  the action bar is `sticky bottom-0` inside the card so it stays visible on long questions.
- Below `md` the grid collapses to one column: header, question pane, answer pane, action
  bar (sticky at the viewport bottom).
- The permalink icon (⛓) copies the `/q/:id` URL to the clipboard and shows a 2-second
  "Copied" toast; on Mock and Drill it also stays a link.
- Position ("3 / 10") shows in the header strip when the caller passes `position`.

## 3. Attempts and states

`maxAttempts` comes from Preferences (`1 | 2 | 3 | 'unlimited'`). **Default changes from
`'unlimited'` to `3`.**

A pure reducer `attemptReducer` in `src/engine/attempts.ts` owns the state:

```
state: { phase: 'answering' | 'checking' | 'wrong' | 'resolved'; attemptsUsed: number;
         outcome?: 'solved' | 'exhausted' | 'shown' | 'self'; lastResult?: GradeResult;
         lockedOptionIds: string[] }
events: SUBMIT_START | SUBMIT_RESULT(result) | SHOW_ANSWER | RESET | NEW_QUESTION
```

Rules:

| Event | From | Effect |
| --- | --- | --- |
| SUBMIT_RESULT pass | checking | `resolved`, outcome `solved` |
| SUBMIT_RESULT fail, attempts remain | checking | `wrong`; `attemptsUsed + 1`; for `single`, the chosen option id is appended to `lockedOptionIds` |
| SUBMIT_RESULT fail, no attempts remain | checking | `resolved`, outcome `exhausted` |
| SUBMIT_RESULT for `open` | checking | `resolved`, outcome `self` (open questions have no retries) |
| SHOW_ANSWER | answering, wrong | `resolved`, outcome `shown` |
| RESET | answering, wrong | answer input back to the starter; attempts unchanged |
| NEW_QUESTION | any | initial state |

"Attempts remain" means `maxAttempts === 'unlimited' || attemptsUsed + 1 < maxAttempts`.

Progress is recorded **once**, on entering `resolved`: score 1 for `solved`, 0 for
`exhausted` and `shown`, the rubric fraction for `self`. `exhausted` and `shown` therefore
appear in Review. Mock results use the same record.

## 4. Answer pane per kind

- **single**: options are full-width buttons; the letter is a monospace badge at the left
  edge; the selected one carries the accent border. A locked (previously wrong) option is
  struck through, dimmed and not clickable. When resolved, the correct option gets the
  success style and a ✓.
- **multi**: same buttons with a checkbox affordance (accent fill when selected). On a wrong
  submit nothing is locked or revealed; the selection stays editable.
- **predict**: read-only code in the question pane; a plain textarea in the answer pane; on
  a wrong submit the feedback lists mismatching lines (existing grader feedback).
- **code / fix**: editor stays editable after a wrong submit; feedback lists failed tests and
  captured logs. Reset restores the starter. Show answer replaces the editor content with the
  reference `solution` in read-only mode and opens the explanation.
- **sql**: schema drawer stays in the question pane; editor in the answer pane; feedback shows
  the row table. Show answer fills the editor with the reference `answer` read-only.
- **open**: textarea, then "Reveal model answer" swaps the Submit button to "Submit
  self-score"; rubric checkboxes render under the model answer in the answer pane. No
  attempts pill; the bar shows "Self-scored" once submitted.

The explanation panel renders in the answer pane under the feedback, only when resolved.

## 5. Action bar

Left: attempts pill — "3 attempts left", "Attempt 2 of 3", "Solved · attempt 2 of 3",
"Answer shown", "Out of attempts", "Unlimited attempts", or for open "Self-scored". Right,
in this order: **Reset** (code, fix, sql, predict only; disabled when resolved), **Show
answer** (disabled when resolved), **Submit** (primary until resolved, then disabled),
**Next →** (disabled until resolved; primary once resolved; hidden when the caller passes no
`onNext`).

Keyboard: `Ctrl+Enter` submits from any input; `N` next when resolved; `M` toggles Mark for
review; `Esc` closes the notes drawer. Shortcuts ignore modifier combinations other than
`Ctrl+Enter` and never fire while typing in an input, textarea or the editor except
`Ctrl+Enter`.

## 6. Mark for review and My notes

- "Flag" is renamed **Mark for review** everywhere (UI strings, en/es). Header button with a
  star; `aria-pressed`; tooltip: "Marked questions show up in Review and in mock results even
  when you got them right." The progress field stays `flagged` (no migration).
- **My notes** is a collapsed drawer at the bottom of the question pane; the header button
  toggles it. Tooltip: "Private notes for this question, stored in this browser and shown
  again when you revisit it." Textarea persists on blur as today.

## 7. Files

- Add `src/engine/attempts.ts` (+ test): reducer, `attemptsRemaining`, `attemptsLabel` inputs.
- Rewrite `src/components/question/QuestionView.tsx` around the reducer and the grid; extract
  `ActionBar.tsx`, `HeaderStrip.tsx`, `NotesDrawer.tsx` into `src/components/question/`.
- Update `SingleChoice.tsx`, `MultiChoice.tsx` (button-style options, locked/correct states,
  `lockedOptionIds` and `correctOptionIds` props), `CodeExercise.tsx`, `SqlExercise.tsx`,
  `PredictOutput.tsx` (controlled value so Reset and Show answer can set it), `OpenAnswer.tsx`
  (bar-driven submit).
- `src/engine/preferences.ts`: default `maxAttempts` 3.
- Locale keys under `question.*` for every new string; Spanish included.
- Pages: no structural change; Drill, Mock and Review keep passing `question`, `onNext`,
  `position`.

## 8. Testing

- Reducer: every row of the table in §3, including `unlimited`, `open`, and `SHOW_ANSWER`
  after a wrong attempt.
- Component: single-choice wrong-then-right within attempts records score 1 once; exhausted
  records 0 once; show answer records 0 and reveals the correct option; multi keeps
  selections after a wrong submit; code Show answer fills the reference solution read-only;
  keyboard shortcuts; the notes drawer toggles and persists; layout classes present
  (`md:grid-cols-2`, sticky bar).
- Existing page tests keep passing (Drill, Mock, Review, Browse).
- Headless smoke script extended with a wrong-then-right retry and a Show answer path.

## 9. Out of scope

Grader feedback sentences in Spanish, lazy-loading translations, partial credit per
attempt, and any change to the Home/Browse pages.
