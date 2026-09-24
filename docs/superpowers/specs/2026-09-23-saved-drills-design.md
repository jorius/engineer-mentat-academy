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
