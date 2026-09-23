# Question Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the question workbench spec: split panes, one action bar, retries governed by the max-attempts preference, Mark for review and My notes with clear roles.

**Architecture:** A pure attempt reducer in `src/engine/attempts.ts` drives `QuestionView`, which becomes a two-pane grid with extracted `HeaderStrip`, `NotesDrawer` and `ActionBar` components. Kind components become controlled (value/onChange) so Reset and Show answer can set them, and choice components render button-style options with locked/correct states. Tasks 1–3 are backward compatible (new props optional) so the tree stays green until Task 4 rewires everything.

**Spec:** `docs/superpowers/specs/2026-09-23-question-workbench-design.md` (binding; §3 table and §5 order are exact).

## Global Constraints

As before: TypeScript strict, explicit return types, labeled import groups, no barrel files, no commented-out code, no eslint-disable, exact pins, npm only; commit subjects with a capitalized infinitive verb and no period, every commit ending with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`; never push; never touch `.superpowers/`. Branch `feature/academy-v1`. Every task ends with `npm run lint && npx vitest run && npm run build` green. All new user-facing strings go through i18next with keys in both `en.json` and `es.json` (the parity test enforces it).

---

### Task 1: Attempt reducer and default attempts

**Files:** `src/engine/attempts.ts` (+ `attempts.test.ts`), `src/engine/preferences.ts` (+ test), `src/engine/preferences.test.ts`.

- [ ] Implement exactly the state, events and table in spec §3:
  ```ts
  export type AttemptPhase = 'answering' | 'checking' | 'wrong' | 'resolved';
  export type AttemptOutcome = 'solved' | 'exhausted' | 'shown' | 'self';
  export type AttemptState = { phase; attemptsUsed: number; outcome?: AttemptOutcome; lastResult?: GradeResult; lockedOptionIds: string[] };
  export type AttemptEvent = { type: 'SUBMIT_START' } | { type: 'SUBMIT_RESULT'; result: GradeResult; kind: Kind; submittedOptionId?: string } | { type: 'SHOW_ANSWER' } | { type: 'RESET' } | { type: 'NEW_QUESTION' };
  export const initialAttemptState: AttemptState;
  export function attemptsRemain(state: AttemptState, maxAttempts: MaxAttempts): boolean;
  export function attemptReducer(state: AttemptState, event: AttemptEvent, maxAttempts: MaxAttempts): AttemptState;
  export function shouldRecord(prev: AttemptState, next: AttemptState): boolean; // true exactly on the transition into 'resolved'
  export function recordedScore(state: AttemptState): number; // 1 solved, 0 exhausted/shown, lastResult.score for self
  ```
  `SUBMIT_RESULT` with `result.verdict === 'self'` resolves with outcome `self`. A failing result appends `submittedOptionId` to `lockedOptionIds` only when `kind === 'single'`. `SHOW_ANSWER` from `answering`/`wrong` resolves with `shown`; from other phases it is a no-op. `RESET` keeps attempts. Unknown transitions return the same state object.
- [ ] Tests: one case per table row, plus `unlimited`, `open`/`self`, no-op transitions, `shouldRecord` true only once, `recordedScore` for each outcome.
- [ ] `DEFAULT_PREFERENCES.maxAttempts` becomes `3`; update the preferences tests and any Settings test asserting the old default.
- [ ] Commit: `Add the attempt reducer for question retries`.

### Task 2: Button-style choice components

**Files:** `src/components/question/SingleChoice.tsx`, `MultiChoice.tsx`, a new `src/components/question/OptionButton.tsx`, tests in `QuestionView.test.tsx` only where they break, new `OptionButton.test.tsx`.

- [ ] `OptionButton` props: `{ id; text (Markdown); selected; locked?; correct?; multi?; disabled?; onToggle(id) }`. Renders a full-width `<button type="button" role={multi ? 'checkbox' : 'radio'} aria-checked={selected} aria-disabled={locked || disabled}>` with the letter badge (`font-mono text-xs` box at the left), the Markdown text, a ✓ when `correct`, `line-through opacity-50` when `locked`, accent border when selected, success style when correct. Keyboard: Space/Enter toggle (native button).
- [ ] `SingleChoice`/`MultiChoice` gain optional props `value`, `onChange`, `lockedOptionIds`, `correctOptionIds`, `submitLabelHidden` (when true, no internal Submit button; the parent's action bar submits). Without the new props they behave exactly as today (internal state and Submit button) so `QuestionView` keeps working until Task 4. Selecting a locked option is impossible.
- [ ] Tests: badge text, selected/locked/correct classes and aria, locked click ignored, multi toggling.
- [ ] Commit: `Add button-style options with locked and correct states`.

### Task 3: Controlled input components

**Files:** `PredictOutput.tsx`, `CodeExercise.tsx`, `SqlExercise.tsx`, `OpenAnswer.tsx`, their tests (add `src/components/question/inputs.test.tsx`).

- [ ] Each gains optional controlled props `value`, `onChange`, `readOnly`, `submitLabelHidden`; `OpenAnswer` additionally `revealed`, `onReveal`, `checked`, `onCheckedChange`. Without the new props they behave exactly as today. `CodeEditor` already supports `readOnly` and external `value` changes.
- [ ] `CodeExercise`: when `readOnly`, hide Reset; tests list stays. `SqlExercise`: the schema `<details>` moves to a new exported `SchemaDrawer` component so Task 4 can place it in the question pane; `SqlExercise` still renders it when the `hideSchema` prop is not set.
- [ ] Tests: controlled value round trip for each; `readOnly` disables the editor/textarea; `OpenAnswer` controlled reveal and rubric.
- [ ] Commit: `Make the answer inputs controllable from the workbench`.

### Task 4: The workbench

**Files:** `src/components/question/QuestionView.tsx` (rewrite), new `HeaderStrip.tsx`, `NotesDrawer.tsx`, `ActionBar.tsx`, `AttemptsPill.tsx`; `src/i18n/locales/{en,es}.json`; `QuestionView.test.tsx`; `src/components/question/Feedback.tsx` (only if the explanation panel moves here).

- [ ] Layout per spec §2: card with `HeaderStrip` (level chip, kind chip with hint tooltip, subject · topic link, position, Mark for review button with star and `aria-pressed`, My notes toggle, permalink copy with a 2 s "Copied" toast), a `grid gap-6 md:grid-cols-2` body (question pane: prompt Markdown, predict code / SQL `SchemaDrawer`, kind hint, `NotesDrawer`; answer pane: kind input, `Feedback`, explanation panel when resolved), and `ActionBar` (`sticky bottom-0`) with `AttemptsPill` left and Reset / Show answer / Submit / Next right, exactly per spec §5 including disabled/primary rules and hiding Next without `onNext`.
- [ ] State: `useReducer(attemptReducer)` from Task 1 with `maxAttempts` from `usePreferences`; answer values held in `QuestionView` state and passed to the controlled inputs; `SUBMIT_START` → grade (canonical question) → `SUBMIT_RESULT`; `shouldRecord` gates a single `store.record(id, recordedScore(state))`.
- [ ] Show answer: single/multi → `correctOptionIds` from the canonical answer; predict → textarea set to `question.answer`, read-only; code/fix → editor set to `question.solution`, read-only; sql → editor set to `question.answer`, read-only; then explanation opens.
- [ ] Wrong attempt UI: single locks the chosen option; feedback panel text "Not yet. Try again, or show the answer." (i18n) replaces the grader's "Correct answer: X" line while attempts remain (never reveal early); the grader's line-level feedback for predict/code/sql still shows.
- [ ] Keyboard per spec §5 (`Ctrl+Enter`, `N`, `M`, `Esc`); ignore other modifier combos and typing contexts.
- [ ] Strings: `question.markForReview`, `question.marked`, `question.markHint`, `question.notes`, `question.notesHint`, `question.showAnswer`, `question.reset`, `question.tryAgain`, `question.attemptsLeft_one/_other`, `question.attemptOf`, `question.solvedAttempt`, `question.answerShown`, `question.outOfAttempts`, `question.unlimitedAttempts`, `question.selfScored`, `question.copied`, `question.next` in en and es. Remove the old `flag`/`flagged` keys.
- [ ] Tests (spec §8): wrong-then-right records 1 once; exhausted records 0 once and reveals the correct option; show answer records 0, reveals, opens explanation; multi keeps selections after a wrong submit; code show answer fills the solution read-only; `N`/`M`/`Esc`/`Ctrl+Enter`; notes drawer toggle + persist; grid and sticky classes present; open kind has no attempts pill and resolves on self-score.
- [ ] Commit: `Add the question workbench layout with retries`.

### Task 5: Pages, smoke script and gate

**Files:** `src/pages/Drill.tsx`, `Mock.tsx`, `Review.tsx`, `QuestionPage.tsx` (only if props changed), `README.md` (Modes section: mention retries and Mark for review), and the controller's smoke script.

- [ ] Verify each page still passes `question`, `onNext`, `position`; Review's "flagged" wording becomes "marked for review" in both locales; Home's "Review missed (N)" counts marked + missed (spec §6 says marked items land in Review).
- [ ] Full gate; then the controller extends the headless smoke script with a wrong-then-right retry and a Show answer path and runs it on the build.
- [ ] Commit: `Update the pages and docs for the workbench`.

## Self-review notes
- Tasks 1–3 are disjoint and backward compatible; they run in parallel. Task 4 depends on all three. Task 5 depends on 4.
- The `flagged` progress field name is kept (spec §6); only the UI wording changes.
