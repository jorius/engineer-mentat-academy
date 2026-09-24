# Saved Drills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Drills become saved, resumable objects listed on the Drill page.

**Architecture:** A localStorage-backed `DrillsStore` (mirror of the progress store) plus a pure `drillStatus` derived from progress timestamps; the Drill page gains a creator redirect, a `/drill/:drillId` route and a list.

**Spec:** `docs/superpowers/specs/2026-09-23-saved-drills-design.md` (binding).

## Global Constraints

TypeScript strict, explicit return types, labeled import groups, no barrel files, no commented-out code, no eslint-disable, React Compiler lint rules on; new strings via i18next in both `en.json` and `es.json`; commit subjects start with a verb from the commit-msg hook allowlist (Add|Fix|Update|Create|Remove|Improve|Refactor|Move|Rename|Configure|Enable|Extract|Simplify|Implement|Replace|Support|Use|Set|Reduce|Test|Seed|Wire), no trailing period; every commit ends with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`; never push; never touch `.superpowers/`; branch `feature/academy-v1`; gate `npm run lint && npx vitest run && npm run build` (3 pre-existing react-refresh warnings ok, 0 errors).

---

### Task 1: Drills store, hook and derived status

**Files:** `src/engine/drills.ts` (+ `drills.test.ts`), `src/hooks/useDrills.ts`, `src/utils/drillProgress.ts` (+ test), `src/App.tsx` (provider), every test file that renders `routes` with the provider stack (add `DrillsProvider`; grep for `ProgressProvider`), `src/pages/Settings.tsx` (+ test: both danger actions call `drillsStore.reset()`).

- [ ] Implement spec §2 exactly (types, key, store API, validation on load, newest-first `all()`, `subscribe`), `useDrills` mirroring `useProgress`, `drillStatus` and `describeDrill` per §2/§4 with tests in both locales.
- [ ] Wire `DrillsProvider` in `App.tsx` inside `ProgressProvider`; add it to the provider stacks in tests so nothing breaks.
- [ ] Settings danger actions reset drills too.
- [ ] Commit: `Add a saved drills store with derived progress`.

### Task 6: Skip button in every mode (runs right after Task 1, before Task 2)

**Files:** `src/components/question/ActionBar.tsx`, `QuestionView.tsx` (+ test), `src/pages/Mock.tsx` (+ test), `src/pages/Review.tsx` (+ test), `src/engine/drills.ts` (+ test: `skip(id, questionId)` rotates the id to the end and persists; no-op for unknown ids), locales.

- [ ] Implement spec §8 for the component, Mock and Review, plus the store method. The saved-drill page wiring (`onSkip` → `store.skip`, hide when one unanswered remains) is done in Task 2, which must read §8.
- [ ] Tests: Skip visible only before resolution and only with `onSkip`; clicking records nothing and calls `onSkip`; Mock skip advances and the result lists it as skipped; Review skip advances; store rotation.
- [ ] Commit: `Add a skip button to drills, mocks and review`.

### Task 2: Creator redirect, `/drill/:drillId` route and resume

**Files:** `src/App.tsx` (route), `src/pages/Drill.tsx` (+ `Drill.test.tsx`), `src/hooks/useDrillQueue.ts` (delete if unused), locales.

- [ ] Implement spec §3 and the saved-drill part of §8 (Skip wired to `store.skip`, hidden when a single unanswered question remains): `DrillCreator` for `/drill?…` (compute matched + shuffled list as today, `store.create`, `navigate(…, { replace: true })`; zero matches → existing no-match screen), `SavedDrillPage` for `/drill/:drillId` (derive `nextIndex` from `drillStatus`, position `{ index: done, total }`, unknown id message `drill.missing`, skip ids not in the bank), completion screen with Restart (`drill.restart`) and "My drills" link (`drill.myDrills`).
- [ ] Keys: `drill.missing` ("This drill no longer exists." / "Esta práctica ya no existe."), `drill.restart` ("Restart" / "Reiniciar"), `drill.myDrills` ("My drills" / "Mis prácticas").
- [ ] Tests per spec §6 (creator creates exactly one drill and redirects; reload after one answer resumes at 2 / N; finished → completion + Restart resets `startedAt`).
- [ ] Commit: `Resume drills from a saved id`.

### Task 3: The list and the Home continue link

**Files:** `src/pages/Drill.tsx` (+ test), `src/pages/Home.tsx` (+ test), locales, `README.md`.

- [ ] Implement spec §4: "My drills" section under the setup card with rows (name, scope line, ProgressBar "done / total", Resume/Rename/Restart/Delete per the rules), empty state; Home "Continue" link to the most recent unfinished drill.
- [ ] Keys: `drill.resume` ("Resume"/"Continuar"), `drill.rename` ("Rename"/"Renombrar"), `drill.delete` ("Delete"/"Eliminar"), `drill.noDrills` ("Drills you start show up here." / "Las prácticas que empieces aparecen aquí."), `drill.progressLabel` ("{{done}} / {{total}}"), `drill.nameLabel` ("Drill name"/"Nombre de la práctica"), `home.continueDrill` ("Continue: {{name}} · {{done}} / {{total}}" / "Continuar: {{name}} · {{done}} / {{total}}"), `drill.allSubjects` ("All subjects"/"Todos los temas"), `drill.allLevels` ("all levels"/"todos los niveles"), `drill.allKinds` ("all kinds"/"todos los tipos") if `describeDrill` needs them (Task 1 may add these first; keep the same names).
- [ ] README: Modes → Drill paragraph mentions saved drills and resume.
- [ ] Commit: `Add the saved drills list and a Home continue link`.

### Task 4: Theme families that follow the app theme

**Files:** `src/engine/editorThemes.ts` (+ test), `src/engine/preferences.ts` (+ test), `src/pages/Settings.tsx` (+ test), `package.json`/`package-lock.json` (remove the seven `@uiw/codemirror-theme-*` packages with `npm uninstall`), locales.

- [ ] Implement `docs/superpowers/specs/2026-09-23-editor-themes-and-fonts-design.md` §1 exactly (families, resolution rule, migration, optgroups, hint). Import themes only from `@uiw/codemirror-themes-all` (named imports).
- [ ] Tests per spec §4 (themes part).
- [ ] Commit: `Use editor theme families that follow the app theme`.

### Task 5: More fonts and a richer preview

**Files:** `src/engine/preferences.ts` (+ test), `src/components/common/CodeEditor.tsx`, `src/main.tsx`, `src/index.css`, `src/hooks/usePreferences.ts` (CSS variable), `src/pages/Settings.tsx` (+ test), locales.

- [ ] Implement spec §2 (fonts, stacks, fontsource CSS imports, font names rendered in their own face, `--editor-font` variable used by the editor and Markdown code) and §3 (the preview snippet).
- [ ] Tests per spec §4 (fonts part) and a snapshot-free assertion that the preview contains `interface`, `async` and a regex literal.
- [ ] Commit: `Add twelve monospace fonts and a richer editor preview`.

### Task 7: Block code inside options (independent of Tasks 2–6; runs any time after Task 6 commits)

**Files:** `src/components/question/OptionButton.tsx` (+ test), `src/components/common/Markdown.tsx` (+ test), `src/index.css`, `src/components/question/SingleChoice.tsx`/`MultiChoice.tsx` only if the role/keyboard change needs it.

- [ ] Implement spec §9 (component part only; no content changes): div with role, tabIndex, Space/Enter handling, compact `pre` styling inside options, grammars and aliases.
- [ ] Tests: an option whose text is a fenced ```js block renders a `<pre><code class="language-js hljs">` inside the option with highlighted tokens (`hljs-keyword` present); Space and Enter toggle; locked option ignores both; existing OptionButton tests still pass (role/aria unchanged); Markdown test for `csharp`, `java`, `tsx` fences.
- [ ] Commit: `Support fenced code blocks inside choice options`.

### Task 8: Confirmation dialog for destructive actions

**Files:** `src/components/primitives/ConfirmDialog.tsx` (+ test), `src/pages/Drill.tsx` (+ test), `src/pages/Settings.tsx` (+ test), locales, README (Settings/Drill sentences).

- [ ] Implement spec §10 exactly. Keys under `confirm.*` in both locale files; reuse `common.cancel`, `drill.delete`, `drill.restart`, `settings.importProgress`, `settings.clearProgress`, `settings.resetEverything`, `settings.typeToConfirm`.
- [ ] Tests per spec §10; update existing Settings tests that typed RESET into the inline field to type it inside the dialog.
- [ ] Commit: `Add a confirmation dialog for destructive actions`.

### Task 9: Run and the debug console

**Files:** `src/components/question/ConsolePanel.tsx` (+ test), `src/components/question/QuestionView.tsx` (+ test), `src/components/question/ActionBar.tsx`, `src/components/question/CodeExercise.tsx` (only if the panel is placed there), locales, README (Question kinds or Modes paragraph: one sentence on Run and the console).

- [ ] Implement spec §11 exactly; reuse `formatJsValue` from `src/engine/format.ts`; use the `runJs` worker runner (not `executeSource` on the main thread).
- [ ] Tests per spec §11.
- [ ] Commit: `Add a run button and a debug console to code exercises`.

## Self-review notes
- Task 1 defines `describeDrill` and may already need `drill.allSubjects/allLevels/allKinds`; Task 3 must reuse them, not redefine.
- `Home` "Drill unseen" keeps pointing at `/drill?unseen=1`; it creates a drill each click by design.
