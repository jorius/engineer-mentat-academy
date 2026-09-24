# Saved drills — Design

**Date:** 2026-09-23
**Status:** Approved in chat ("yup, continue")
**Builds on:** `2026-09-23-iteration-3-design.md` §4 (filters, Drill setup card)

## 1. Goal

A drill is a saved object, not a URL. Reloading resumes it at the next unanswered question,
and every drill you ever started is listed on the Drill page with its progress so you can go
back to it at any time.

## 2. Model and storage

```ts
export type SavedDrill = {
  id: string;            // crypto.randomUUID() (fallback: Date.now + random)
  name?: string;         // user-set; undefined → described from the query at render time
  query: string;         // the drill's URLSearchParams string, e.g. "domain=languages&subject=typescript&kind=single,code"
  questionIds: string[]; // frozen, in the shuffled order chosen at creation
  createdAt: string;     // ISO
  startedAt: string;     // ISO; equals createdAt until Restart, which sets it to now
};
```

`src/engine/drills.ts` exports `DRILLS_KEY = 'ema:drills:v1'`, `DrillsStore { all(): SavedDrill[]; get(id): SavedDrill | undefined; create(input: { query: string; questionIds: string[] }): SavedDrill; rename(id, name: string | undefined): void; restart(id): void; remove(id): void; reset(): void; subscribe(listener): () => void }` and `createDrillsStore(storage: Storage | null)`, modelled on `createProgressStore` (JSON in localStorage, validation on load, in-memory fallback, listeners). Newest first in `all()`. `src/hooks/useDrills.ts` mirrors `useProgress` (`DrillsProvider`, `useDrills(): { store, drills }`); the provider is added to `App.tsx` and to every test provider stack that renders routes.

**Done** is derived, never stored: a question is done in a drill when `progress[id].lastAt >= drill.startedAt`. `src/utils/drillProgress.ts` exports `drillStatus(drill, progress): { done: number; total: number; nextIndex: number; finished: boolean }` where `nextIndex` is the index of the first question not done (or `total` when finished). Answering, Show answer, exhausting attempts and self-scoring all record progress, so they all count; nothing else is needed.

## 3. Routes and resume

- `/drill/:drillId` renders the saved drill: questions from `questionIds` in order, current = `nextIndex`, `position = { index: done, total }`. Unknown id → "This drill no longer exists" with a link to `/drill`. A question id missing from the bank (content removed) is skipped and not counted.
- `/drill?…` (every existing link: Browse "Drill these N", per-topic "Drill · N", Home "Drill unseen", the setup card's Start) becomes a **creator**: on mount it computes the matched, shuffled question list exactly as `DrillQueue` does today, calls `store.create`, and `navigate(`/drill/${id}`, { replace: true })`. Zero matches → the existing "No questions match" screen, nothing created. The setup card keeps navigating to `/drill?…`, so it goes through the same path.
- `/drill` with no query: the setup card, then the list (§4).
- Finishing: the existing completion screen, plus "Restart" (store.restart → `startedAt = now`, navigates to the same drill) and "My drills" (link to `/drill`).
- `DrillQueue`'s `useDrillQueue` is replaced by the derived `nextIndex`; the `key` on `QuestionView` stays `current.id` so the workbench resets per question.

## 4. The list

Below the setup card on `/drill`, section "My drills" (`drill.myDrills`): one row per saved drill, newest first: display name (`name ?? describeDrill(query, t, locale)`), a muted scope line when a custom name hides it, `ProgressBar` with "done / total" (`drill.progressLabel`), and actions Resume (`drill.resume`, primary; reads "Start" when done = 0, "Review again"… no: reads `drill.restart` when finished), Rename (`drill.rename`, inline text input with Save/Cancel, empty → clears the custom name), Restart (`drill.restart`, only when done > 0), Delete (`drill.delete`, immediate, no confirm; the row can be recreated from the same filter). Empty list → `drill.noDrills` ("Drills you start show up here."). Home gains a "Continue: <name> · 4 / 12" link (`home.continueDrill`) to the most recent unfinished drill, shown only when one exists.

`describeDrill(query, t, locale)`: "<Subject or Domain or 'All subjects'> · <Topic if any> · <levels: 'all levels' or joined labels> · <kinds: 'all kinds' or joined labels> · <only label if any>", e.g. "TypeScript · all levels · Single choice, Write code". Lives in `src/utils/drillProgress.ts` next to `drillStatus`.

## 5. Settings

Clear progress and Reset everything also call `drillsStore.reset()` (a drill without its progress would show as fresh, which is misleading). The Danger zone note stays as is.

## 6. Testing

Store: create/get/rename/restart/remove/reset/persist/validate-on-load. `drillStatus`: done counting against `startedAt`, `nextIndex`, finished, missing ids skipped. `describeDrill` in both locales. Pages: creator redirects `/drill?subject=…` to `/drill/<id>` and creates exactly one drill; reload of `/drill/<id>` after one recorded answer shows position "2 / N"; finished drill shows completion with Restart; list renders rows, rename persists, restart resets `startedAt`, delete removes; Home continue link. Existing Drill tests that asserted `/drill?…` rendering a question now assert the redirect target renders it. Settings tests: reset clears drills.

## 7. Out of scope

Sharing drills between browsers, editing a drill's filter after creation, Mock or Review changes.

## 8. Skip (added 2026-09-23, Jose's request)

Every mode lets the learner move on without answering. `QuestionView` gains `onSkip?: () => void`; when
present and the question is not yet resolved, the action bar shows a ghost **Skip** button
(`question.skip` = "Skip" / "Saltar", tooltip `question.skipHint` = "Move on without answering; nothing is
recorded." / "Pasa a la siguiente sin responder; no se registra nada.") at the left of Reset. Skipping
records nothing in progress. Keyboard: none (Next stays `N`).

- **Saved drill:** `DrillsStore.skip(id, questionId)` moves that question id to the end of
  `questionIds` (persisted), so `nextIndex` advances to the next unanswered question and the skipped one
  returns after the others. Skipping the last remaining question keeps it current (nothing to rotate
  past); the button is hidden when only one unanswered question remains. Position stays
  `{ index: done, total }`.
- **Mock:** Skip calls the queue's `next`; the results page already lists unanswered questions as
  skipped and scores them 0. The old "Show answer is the skip" behaviour is no longer needed but stays.
- **Review:** Skip calls the queue's `next`; the question stays in Review since nothing was recorded.
- **Permalink page:** no `onSkip` (nothing to move on to).

## 9. Code inside choice options (added 2026-09-23, Jose's request)

Options and prompts that contain a statement or more of code use fenced blocks with a language tag
(```` ```js ````, `ts`, `tsx`, `jsx`, `csharp`, `java`, `sql`, `json`, `bash`), formatted over several
lines with two-space indentation, so they render highlighted and legible. Inline code spans stay for
identifiers and short expressions.

- `OptionButton` renders Markdown block content: it becomes a `<div role="radio"|"checkbox" tabIndex={0}
  aria-checked aria-disabled>` with `onKeyDown` handling Space and Enter (preventDefault, then toggle),
  because `<pre>` is not allowed inside `<button>`. Everything else (badge letter, selected/locked/correct
  styles, `aria-label` = option text) is unchanged. Focus ring: `focus-visible:ring-2 ring-accent-500`.
- Inside an option, `.md pre` is compact: `my-1 p-2 text-xs leading-snug`, no horizontal margin, and the
  option's flex layout gives the code block the full remaining width (`min-w-0 flex-1`).
- `Markdown` registers highlight.js grammars `csharp`, `java`, and aliases `jsx` → javascript, `tsx` →
  typescript in addition to the existing ones.
- Content pass (done together with the audit fixes, per domain): every option or prompt whose inline
  code span is longer than about 45 characters or contains `{`, `;` or `=>` becomes a fenced block in
  the file's language, mirrored in the `.es.ts` (code untranslated). A trailing note such as
  "(no dependency array)" moves to a line of plain text after the block.

## 10. Confirmation for destructive actions (added 2026-09-24, Jose's request)

Every action that discards data opens a confirmation dialog before it runs. Actions covered:

| Action | Where | Dialog title / body | Confirm label |
| --- | --- | --- | --- |
| Delete drill | My drills row | `confirm.deleteDrillTitle` "Delete this drill?" / `confirm.deleteDrillBody` "\"{{name}}\" is removed from My drills. Your answers stay in your progress." | `drill.delete` |
| Restart drill | My drills row, finished screen | `confirm.restartDrillTitle` "Restart this drill?" / `confirm.restartDrillBody` "The drill starts over from the first question. Answers already recorded stay in your progress." | `drill.restart` |
| Import progress | Settings → Progress | `confirm.importTitle` "Replace your progress?" / `confirm.importBody` "The file replaces every record stored in this browser." | `settings.importProgress` |
| Clear progress | Settings → Danger zone | `confirm.clearTitle` "Clear all progress?" / `confirm.clearBody` "Attempts, scores, marks, notes and saved drills are deleted. Preferences stay." | `settings.clearProgress` |
| Reset everything | Settings → Danger zone | `confirm.resetTitle` "Reset everything?" / `confirm.resetBody` "Progress, saved drills, preferences, theme and language go back to their defaults." | `settings.resetEverything` |

Spanish: "¿Eliminar esta práctica?" / "\"{{name}}\" se quita de Mis prácticas. Tus respuestas siguen en tu progreso."; "¿Reiniciar esta práctica?" / "La práctica vuelve a empezar desde la primera pregunta. Las respuestas ya registradas siguen en tu progreso."; "¿Reemplazar tu progreso?" / "El archivo reemplaza todos los registros guardados en este navegador."; "¿Borrar todo el progreso?" / "Se eliminan intentos, puntajes, marcas, notas y prácticas guardadas. Las preferencias se conservan."; "¿Restablecer todo?" / "El progreso, las prácticas guardadas, las preferencias, el tema y el idioma vuelven a sus valores por defecto."

- `src/components/primitives/ConfirmDialog.tsx`: a native `<dialog>` opened with `showModal()` when `open` is true and closed otherwise. Props `{ open; title; body; confirmLabel; cancelLabel?; danger?: boolean; typeToConfirm?: string; onConfirm; onCancel }`. Esc and the backdrop click cancel; the Cancel button (`common.cancel`) gets initial focus so Enter never confirms by accident; the confirm button is `Button variant="danger"` when `danger` (always true for the five actions). When `typeToConfirm` is set (the two Danger-zone actions pass `'RESET'`), the dialog holds the text input labelled `settings.typeToConfirm` and the confirm button stays disabled until the trimmed value matches; the Danger-zone card loses its inline field and its buttons are always enabled. `aria-labelledby` the title, `aria-describedby` the body. The dialog's `close` event (Esc) routes to `onCancel`.
- Pages keep a single `pending` state describing which action awaits confirmation and render one `ConfirmDialog`; confirming runs the action, then clears `pending`.
- jsdom lacks `showModal`; the component guards with `typeof dialog.showModal === 'function'` and falls back to the `open` attribute, so tests can assert on `getByRole('dialog')`.
- Tests: the dialog renders title/body/labels and calls the right callback; Esc cancels; Delete/Restart/Import/Clear/Reset each do nothing until confirmed and run once confirmed; the typed gate still blocks the two Danger-zone actions.

## 11. Run and the debug console (added 2026-09-24, Jose's request)

For `code` and `fix` questions the learner can see what their program prints.

- **Run** (`question.run` "Run" / "Ejecutar", tooltip `question.runHint` "Run the hidden tests without
  using an attempt" / "Ejecuta las pruebas ocultas sin gastar un intento"): a ghost button in the action
  bar at the left of Skip, shown only for `code`/`fix`, enabled whenever the editor holds source (also
  after the question is resolved, so the reference solution can be run). It calls the same worker runner
  the grader uses (`runJs` from `src/engine/runner/runJs.ts` with the canonical question's tests and
  language) and stores the `RunResult` in `QuestionView` state as `lastRun`; it dispatches nothing to the
  attempt reducer and records nothing. While it runs the button is disabled (`question.running`
  "Running…" / "Ejecutando…"). Keyboard: `Ctrl+Shift+Enter`.
- **Submit** keeps grading as today; when the grade result carries `run`, that run also becomes
  `lastRun`, so the console reflects the latest execution whichever button caused it.
- **Console panel** (`src/components/question/ConsolePanel.tsx`): rendered in the answer pane under the
  hidden-tests block for `code`/`fix`. Header row: a toggle button `console.title` ("Console" /
  "Consola") with `aria-expanded` and `aria-controls`, a count badge `console.lines` ("{{count}} lines",
  plural rules in both locales) when there is output, and a `console.clear` ("Clear" / "Limpiar") ghost
  button that empties `lastRun`. Body (`<pre>` in the editor font, `max-h-64 overflow-auto`, same
  block styling as code blocks): the captured console lines in order, then, when the run had tests, one
  line per test: `✓ name` or `✗ name — expected X, got Y` (values through `formatJsValue`), then the
  runtime error or timeout message if any (`status !== 'ok'`) in the danger colour. Empty state
  `console.empty` ("Nothing logged yet. Run the tests to see console output." / "Todavía no hay
  salida. Ejecuta las pruebas para ver la consola."). The panel opens automatically after a Run and
  keeps whatever state the learner set afterwards; it starts collapsed and resets when the question
  changes.
- Nothing changes for predict, sql, choice or open questions.
- Tests: Run executes without recording (progress store untouched, attempts pill unchanged), the panel
  opens with the logged lines and test outcomes, Clear empties it, a runtime error shows its message,
  Submit's run also fills the panel, `Ctrl+Shift+Enter` runs, Run is absent on a single-choice question.

## 12. Hints (added 2026-09-24, Jose's request)

Every question carries an optional `hint` (schema: `z.string().min(1).max(240).optional()` on the base
question and on `QuestionTranslation`; `localizeQuestion` merges the translated hint with an English
fallback). A hint is one or two sentences that name the concept, API or trap to think about, never the
answer: the content test fails a hint that contains any option's text (12+ characters), any predict
output line, or exceeds 240 characters. Hints are authored for every question in both languages.

- Workbench: a ghost **Hint** button (`question.hint` "Hint" / "Pista", tooltip `question.hintHint`
  "Show a nudge; it does not cost an attempt" / "Muestra una pista; no gasta intentos") at the left of
  Run in the action bar, rendered only when the (localized) question has a hint and hidden once revealed.
  Revealing shows the hint in the question pane under the prompt in a muted panel labelled
  `question.hintLabel` ("Hint" / "Pista") with a lightbulb icon (`FiZap` is not a bulb; use `FiSun`?
  no — use `FiHelpCircle`). State is per question (resets on question change), has no effect on
  attempts or score, and is not recorded. Keyboard: `H` (same rules as `N`/`M`: not while typing).
- Content: `hint` on every question in `src/content/**/*.ts` and `hint` in every `.es.ts` entry.
