// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  {
    id: 'react-lifecycle-mount-unmount-effect',
    domain: 'libraries',
    subject: 'react',
    topic: 'components-and-lifecycle',
    level: 'junior',
    kind: 'single',
    prompt:
      'A class component subscribes to a store in `componentDidMount` and unsubscribes in `componentWillUnmount`. Which function-component code is the equivalent?',
    options: [
      { id: 'a', text: '`useEffect(() => { subscribe(); return () => unsubscribe(); }, [])`' },
      { id: 'b', text: '`useEffect(() => { subscribe(); unsubscribe(); }, [])`' },
      { id: 'c', text: '`useEffect(() => { subscribe(); return () => unsubscribe(); })` (no dependency array)' },
      { id: 'd', text: '`useMemo(() => subscribe(), [])` plus `useEffect(() => unsubscribe, [])`' },
    ],
    answer: 'a',
    tags: ['useEffect', 'cleanup', 'class-components'],
    source: 'notion',
    explanation:
      'An effect with `[]` runs after the first commit, and the function it returns is the cleanup React calls on unmount. Without the array the effect and its cleanup run after **every** render, so you resubscribe on each render. Calling `unsubscribe()` right after `subscribe()` unsubscribes immediately. The `useMemo` variant puts a side effect in `useMemo`, which runs during render and may run more than once or be thrown away.\n\nThe better mental model is not "lifecycle" but "synchronize with an external system": if the subscription depended on a prop such as `storeId`, it would go in the dependency array, and that single effect would also replace `componentDidUpdate`.',
  },
  {
    id: 'react-strict-mode-effect-twice',
    domain: 'libraries',
    subject: 'react',
    topic: 'components-and-lifecycle',
    level: 'mid',
    kind: 'single',
    prompt: `\`\`\`jsx
function Chat({ roomId }) {
  useEffect(() => {
    console.log('connect ' + roomId);
    return () => console.log('disconnect ' + roomId);
  }, [roomId]);
  return null;
}

// development build, React 18+
root.render(<StrictMode><Chat roomId="a" /></StrictMode>);
\`\`\`
What is logged right after the first mount?`,
    options: [
      { id: 'a', text: '`connect a`' },
      { id: 'b', text: '`connect a`, `disconnect a`, `connect a`' },
      { id: 'c', text: '`connect a`, `connect a`' },
      { id: 'd', text: '`connect a`, `disconnect a`' },
    ],
    answer: 'b',
    tags: ['strict-mode', 'useEffect', 'cleanup'],
    source: 'topic-list',
    explanation:
      'In development, `StrictMode` mounts the component, runs its effects, simulates an unmount (running cleanups) and mounts it again. It exists to expose effects whose cleanup does not undo the setup. If the cleanup were missing you would end up with two open connections, which is exactly the bug it is trying to show you. Production runs the effect once.\n\nThe wrong fix is a `useRef` flag that skips the second run; the right fix is a symmetric cleanup.',
  },
  {
    id: 'react-error-boundary-scope',
    domain: 'libraries',
    subject: 'react',
    topic: 'components-and-lifecycle',
    level: 'mid',
    kind: 'multi',
    prompt:
      'An `ErrorBoundary` class component (with `static getDerivedStateFromError` and `componentDidCatch`) wraps `<Dashboard />`. Which errors does it catch? Select all that apply.',
    options: [
      { id: 'a', text: 'An error thrown while rendering a component deep inside `Dashboard`' },
      { id: 'b', text: 'An error thrown in `componentDidMount` of a class component inside `Dashboard`' },
      { id: 'c', text: 'An error thrown inside an `onClick` handler in `Dashboard`' },
      { id: 'd', text: 'A rejected promise from `fetch(...).then(...)` started in an effect' },
      { id: 'e', text: "An error thrown in the `ErrorBoundary`'s own `render`" },
    ],
    answer: ['a', 'b'],
    tags: ['error-boundaries', 'class-components'],
    source: 'topic-list',
    explanation:
      'Error boundaries catch errors thrown while React is rendering, in lifecycle methods and in constructors of the tree **below** them. They do not catch errors in event handlers (use `try/catch` and put the error in state), in asynchronous code (a rejected promise happens outside React\'s render), or in the boundary itself (the next boundary up handles that).\n\nTo route an async error into a boundary, call `setState(() => { throw error; })` or use `showBoundary` from `react-error-boundary`. There is still no hook equivalent of `getDerivedStateFromError`, which is one reason class components still show up in modern codebases.',
  },
  {
    id: 'react-hooks-rules-violations',
    domain: 'libraries',
    subject: 'react',
    topic: 'hooks',
    level: 'junior',
    kind: 'multi',
    prompt: 'Which of these break the Rules of Hooks? Select all that apply.',
    options: [
      { id: 'a', text: '`if (!user) return null;` placed before `const [tab, setTab] = useState("a");`' },
      { id: 'b', text: 'Calling `useState` inside a `for` loop over a `fields` prop' },
      { id: 'c', text: 'Calling `useContext(Theme)` inside a custom hook `useThemeColor()` that the component calls at its top level' },
      { id: 'd', text: 'Calling `useEffect` inside a plain helper `function track() {}` that runs from an `onClick` handler' },
      { id: 'e', text: 'Calling `useMemo` at the top level after two `useState` calls' },
    ],
    answer: ['a', 'b', 'd'],
    tags: ['rules-of-hooks'],
    source: 'topic-list',
    explanation:
      'React identifies each hook by its **call order** within a render, so every render must call the same hooks in the same order, and only from components or custom hooks. An early return before a hook makes the hook conditional. A loop changes the count when `fields` changes. A hook in an event-handler helper runs outside rendering entirely. Custom hooks like `useThemeColor()` are just functions whose name starts with `use` and that call hooks at their own top level, which is the approved way to share hook logic.\n\n(React 19\'s `use()` is the one exception that may be called conditionally.)',
  },
  {
    id: 'react-usestate-batched-increments',
    domain: 'libraries',
    subject: 'react',
    topic: 'hooks',
    level: 'junior',
    kind: 'single',
    prompt: `\`\`\`jsx
function Counter() {
  const [count, setCount] = useState(0);
  function handleClick() {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
  }
  return <button onClick={handleClick}>{count}</button>;
}
\`\`\`
What does the button show after one click?`,
    options: [
      { id: 'a', text: '3' },
      { id: 'b', text: '1' },
      { id: 'c', text: '0, because the updates are batched and discarded' },
      { id: 'd', text: '3 in development and 1 in production' },
    ],
    answer: 'b',
    tags: ['useState', 'batching', 'snapshots'],
    source: 'topic-list',
    explanation:
      '`count` is a snapshot: in this render it is `0`, so all three calls queue "set to 1". React batches them into one re-render. To build on the previous value, pass an updater: `setCount((c) => c + 1)` three times gives 3, because each updater receives the result of the previous one.',
  },
  {
    id: 'react-usereducer-cart-reducer',
    domain: 'libraries',
    subject: 'react',
    topic: 'hooks',
    level: 'mid',
    kind: 'code',
    language: 'typescript',
    prompt:
      'Implement `cartReducer(state, action)` as a **pure** reducer for `useReducer`.\n\n- `add` adds a line with `qty: 1`, or increments `qty` if the id is already in the cart.\n- `remove` removes the line.\n- `setQty` sets the quantity; a quantity of 0 or less removes the line.\n- `clear` empties the cart.\n- Any other action returns the **same** state.\n\n`solution(actions)` replays the actions from an empty cart and returns **every** intermediate state, so mutating a previous state shows up as a wrong history.',
    starter: `type Line = { id: string; price: number; qty: number };
type State = { lines: Line[] };
type Action =
  | { type: 'add'; id: string; price: number }
  | { type: 'remove'; id: string }
  | { type: 'setQty'; id: string; qty: number }
  | { type: 'clear' };

function cartReducer(state: State, action: Action): State {
  // TODO
  return state;
}

export function solution(actions: Action[]): State[] {
  const history: State[] = [{ lines: [] }];
  for (const action of actions) {
    history.push(cartReducer(history[history.length - 1], action));
  }
  return history;
}`,
    tests: [
      {
        name: 'adding the same id twice increments qty',
        args: [[{ type: 'add', id: 'a', price: 5 }, { type: 'add', id: 'a', price: 5 }]],
        expected: [{ lines: [] }, { lines: [{ id: 'a', price: 5, qty: 1 }] }, { lines: [{ id: 'a', price: 5, qty: 2 }] }],
      },
      {
        name: 'setQty to zero removes the line',
        args: [[{ type: 'add', id: 'a', price: 5 }, { type: 'add', id: 'b', price: 3 }, { type: 'setQty', id: 'a', qty: 0 }]],
        expected: [
          { lines: [] },
          { lines: [{ id: 'a', price: 5, qty: 1 }] },
          { lines: [{ id: 'a', price: 5, qty: 1 }, { id: 'b', price: 3, qty: 1 }] },
          { lines: [{ id: 'b', price: 3, qty: 1 }] },
        ],
      },
      {
        name: 'setQty sets the quantity',
        args: [[{ type: 'add', id: 'a', price: 4 }, { type: 'setQty', id: 'a', qty: 3 }]],
        expected: [{ lines: [] }, { lines: [{ id: 'a', price: 4, qty: 1 }] }, { lines: [{ id: 'a', price: 4, qty: 3 }] }],
      },
      {
        name: 'remove and clear',
        args: [[{ type: 'add', id: 'a', price: 2 }, { type: 'add', id: 'b', price: 1 }, { type: 'remove', id: 'a' }, { type: 'clear' }]],
        expected: [
          { lines: [] },
          { lines: [{ id: 'a', price: 2, qty: 1 }] },
          { lines: [{ id: 'a', price: 2, qty: 1 }, { id: 'b', price: 1, qty: 1 }] },
          { lines: [{ id: 'b', price: 1, qty: 1 }] },
          { lines: [] },
        ],
      },
      { name: 'unknown action keeps state', args: [[{ type: 'noop' }]], expected: [{ lines: [] }, { lines: [] }] },
    ],
    solution: `type Line = { id: string; price: number; qty: number };
type State = { lines: Line[] };
type Action =
  | { type: 'add'; id: string; price: number }
  | { type: 'remove'; id: string }
  | { type: 'setQty'; id: string; qty: number }
  | { type: 'clear' };

function cartReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'add': {
      const exists = state.lines.some((line) => line.id === action.id);
      if (exists) {
        return { lines: state.lines.map((line) => (line.id === action.id ? { ...line, qty: line.qty + 1 } : line)) };
      }
      return { lines: [...state.lines, { id: action.id, price: action.price, qty: 1 }] };
    }
    case 'remove':
      return { lines: state.lines.filter((line) => line.id !== action.id) };
    case 'setQty':
      if (action.qty <= 0) {
        return { lines: state.lines.filter((line) => line.id !== action.id) };
      }
      return { lines: state.lines.map((line) => (line.id === action.id ? { ...line, qty: action.qty } : line)) };
    case 'clear':
      return { lines: [] };
    default:
      return state;
  }
}

export function solution(actions: Action[]): State[] {
  const history: State[] = [{ lines: [] }];
  for (const action of actions) {
    history.push(cartReducer(history[history.length - 1], action));
  }
  return history;
}`,
    tags: ['useReducer', 'immutability', 'pure-functions'],
    source: 'notion',
    explanation:
      'A reducer runs during rendering, so it must be pure: same `(state, action)` in, same state out, no mutation. `existing.qty++` followed by `return { ...state }` looks immutable but mutates the line object the previous state still points to, which is why the test records the whole history.\n\nWhy `useReducer` over several `useState` calls: the *what happened* (actions from event handlers) is separated from the *how state changes* (the reducer), the reducer can be unit-tested with no component, and one action like `clear` can describe one user interaction even when it changes many fields. Returning the same reference for unknown actions lets React bail out of the re-render.',
  },
  {
    id: 'react-fetch-effect-race',
    domain: 'libraries',
    subject: 'react',
    topic: 'hooks',
    level: 'senior',
    kind: 'open',
    prompt: `\`\`\`jsx
function Results({ query }) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    fetch('/api/search?q=' + encodeURIComponent(query))
      .then((r) => r.json())
      .then(setItems);
  }, [query]);
  return <List items={items} />;
}
\`\`\`
Users who type fast sometimes see results for an older query than the one in the search box. Explain the bug, fix it, and say what you would use in production.`,
    modelAnswer:
      'Every keystroke starts a request, and responses can arrive out of order: a slow response for `"re"` can resolve after the response for `"react"` and overwrite it. The effect has no cleanup, so nothing marks the older request as stale. Fix it by creating an `AbortController` in the effect, passing `signal` to `fetch`, and calling `controller.abort()` in the cleanup (ignoring `AbortError` in the catch); an `ignore` flag set in the cleanup works too when the request cannot be cancelled. While there, check `r.ok`, track loading and error state, and debounce the query so you do not fire a request per keystroke. In production I would use React Query, SWR or RTK Query, which give caching, request de-duplication, cancellation, retries and stale-while-revalidate, or a router loader that owns the fetch.',
    rubric: [
      'Identifies out-of-order responses (race condition), not "React is slow"',
      'Uses effect cleanup with `AbortController` or an ignore flag',
      'Handles `AbortError`, non-OK responses and loading/error states',
      'Mentions debouncing and a data-fetching library (React Query/SWR/RTK Query) as the production answer',
    ],
    tags: ['useEffect', 'data-fetching', 'race-conditions', 'abort-controller'],
    source: 'notion',
    explanation:
      'Each effect run captures its own `query`. Cleanup runs before the next effect run, which is the hook for invalidating the previous request.\n\n**Say this out loud:** "Effects that fetch need a cleanup that cancels or ignores the previous request, otherwise the slowest response wins. In production I would not hand-roll this; React Query gives me cancellation, caching and de-duplication for free."',
  },
  {
    id: 'react-stale-closure-interval',
    domain: 'libraries',
    subject: 'react',
    topic: 'dependency-arrays',
    level: 'mid',
    kind: 'single',
    prompt: `\`\`\`jsx
function Ticker() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setCount(count + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return <p>{count}</p>;
}
\`\`\`
What does the component show after 5 seconds?`,
    options: [
      { id: 'a', text: '5' },
      { id: 'b', text: '1' },
      { id: 'c', text: '0' },
      { id: 'd', text: 'It keeps climbing, but skips every other value' },
    ],
    answer: 'b',
    tags: ['stale-closure', 'useEffect', 'setInterval'],
    source: 'topic-list',
    explanation:
      'The effect runs once, so the interval callback closes over the `count` of the first render, which is `0`. Every tick calls `setCount(1)`; after the first one React bails out because the value did not change. This is the classic stale closure caused by lying about dependencies (the lint rule would flag `count`).\n\nThe best fix is the updater form `setCount((c) => c + 1)`, which removes `count` from the effect entirely and keeps `[]` honest. Adding `count` to the dependencies also works, but tears down and recreates the interval every second.',
  },
  {
    id: 'react-exhaustive-deps-infinite-loop',
    domain: 'libraries',
    subject: 'react',
    topic: 'dependency-arrays',
    level: 'senior',
    kind: 'open',
    prompt: `\`\`\`jsx
function Profile({ userId }) {
  const [user, setUser] = useState(null);
  const options = { include: ['teams'] };
  async function load() {
    setUser(await api.getUser(userId, options));
  }
  useEffect(() => {
    load();
  }, [load]);
  // ...
}
\`\`\`
The \`exhaustive-deps\` lint rule asked for \`load\` in the array. Now the component fetches in an infinite loop. Explain why, and list your fixes in order of preference.`,
    modelAnswer:
      'Dependencies are compared with `Object.is`. `load` (and `options`) are recreated on every render, so the effect sees a new dependency after every render; it fetches, `setUser` triggers a render, which creates a new `load`, and the loop never ends. First choice: move `load` and `options` inside the effect so the only real dependency is `userId`. If `options` is constant, hoist it outside the component. If the function must be shared, wrap it in `useCallback` with `[userId]`. For logic that must read the latest props without re-triggering the effect, use `useEffectEvent`. Never silence the lint rule: lying about dependencies trades an infinite loop for stale closures. I would also add an abort/ignore guard, or move the fetch into React Query.',
    rubric: [
      'Explains referential identity: new function/object every render, compared with `Object.is`',
      'Prefers moving the function and object inside the effect (deps become `[userId]`)',
      'Knows `useCallback`/hoisting/`useEffectEvent` as alternatives and when each fits',
      'Refuses to disable the lint rule and explains the stale-closure risk',
    ],
    tags: ['exhaustive-deps', 'useCallback', 'referential-equality'],
    source: 'topic-list',
    explanation:
      'Dependency arrays are not a list of "when to run"; they are a declaration of every reactive value the effect reads. Remove dependencies by changing the code, not the array.\n\n**Say this out loud:** "Dependencies are compared by reference, so functions and objects created during render invalidate the effect every time. I remove the dependency by moving it into the effect or out of the component, not by lying to the linter."',
  },
  {
    id: 'react-debounced-value-logic',
    domain: 'libraries',
    subject: 'react',
    topic: 'dependency-arrays',
    level: 'mid',
    kind: 'code',
    language: 'typescript',
    prompt:
      "`useDebouncedValue(value, delay)` sets a `setTimeout` in an effect with dependencies `[value, delay]` and clears it in the cleanup. Model it as a pure function.\n\n`changes` is a timeline of `{ t, value }` (milliseconds, sorted by `t`). Return the updates `{ t, value }` the hook would emit. Each change schedules an update at `t + delay`; the **next** change runs the cleanup and cancels it, unless the next change arrives at or after `t + delay` (the timer already fired).",
    starter: `type Change = { t: number; value: string };

export function solution(changes: Change[], delay: number): Change[] {
  return [];
}`,
    tests: [
      {
        name: 'a typing burst emits only the last value',
        args: [[{ t: 0, value: 'r' }, { t: 100, value: 're' }, { t: 200, value: 'rea' }, { t: 250, value: 'reac' }, { t: 300, value: 'react' }], 300],
        expected: [{ t: 600, value: 'react' }],
      },
      {
        name: 'a pause lets the pending value through',
        args: [[{ t: 0, value: 'a' }, { t: 100, value: 'ab' }, { t: 500, value: 'abc' }], 300],
        expected: [{ t: 400, value: 'ab' }, { t: 800, value: 'abc' }],
      },
      {
        name: 'a change exactly at the deadline is too late to cancel',
        args: [[{ t: 0, value: 'x' }, { t: 300, value: 'xy' }], 300],
        expected: [{ t: 300, value: 'x' }, { t: 600, value: 'xy' }],
      },
      { name: 'no changes emit nothing', args: [[], 300], expected: [] },
    ],
    solution: `type Change = { t: number; value: string };

export function solution(changes: Change[], delay: number): Change[] {
  const emitted: Change[] = [];
  changes.forEach((change, i) => {
    const next = changes[i + 1];
    const firesAt = change.t + delay;
    if (next === undefined || next.t >= firesAt) {
      emitted.push({ t: firesAt, value: change.value });
    }
  });
  return emitted;
}`,
    tags: ['custom-hooks', 'debounce', 'effect-cleanup'],
    source: 'notion',
    explanation:
      'The hook itself:\n\n```ts\nfunction useDebouncedValue<T>(value: T, delay = 300): T {\n  const [debounced, setDebounced] = useState(value);\n  useEffect(() => {\n    const id = setTimeout(() => setDebounced(value), delay);\n    return () => clearTimeout(id);\n  }, [value, delay]);\n  return debounced;\n}\n```\n\nThe debounce comes entirely from the dependency array plus cleanup: when `value` changes, React runs the previous cleanup (cancelling the pending timer) before running the effect again. A value survives only if nothing changes for `delay` ms. Pair it with a fetch keyed on the debounced value so the network sees one request per pause, not one per keystroke.',
  },
  {
    id: 'react-rerender-triggers',
    domain: 'libraries',
    subject: 'react',
    topic: 're-rendering',
    level: 'junior',
    kind: 'multi',
    prompt: 'Which of these cause `Child` (not wrapped in `React.memo`) to re-render? Select all that apply.',
    options: [
      { id: 'a', text: '`Child` calls its own state setter with a different value' },
      { id: 'b', text: 'The parent re-renders, even though the props it passes to `Child` are identical' },
      { id: 'c', text: 'A context value that `Child` reads with `useContext` changes' },
      { id: 'd', text: '`Child` assigns a new value to `someRef.current`' },
      { id: 'e', text: 'The parent mutates an object prop in place (`user.name = "x"`) without setting any state' },
    ],
    answer: ['a', 'b', 'c'],
    tags: ['rendering', 'context', 'refs'],
    source: 'notion',
    explanation:
      'A component re-renders when (1) its own state changes, (2) its parent re-renders (by default children re-render with their parent, whether or not props changed), or (3) a context it consumes changes. Refs are deliberately outside that system: writing `ref.current` never schedules a render. Mutating a prop in place does not schedule a render either; React only learns about changes through state setters, and the mutation will also defeat any `memo` comparison later.\n\nA render is not a DOM update: React re-runs the component, diffs the result and commits only what changed.',
  },
  {
    id: 'react-memo-inline-callback',
    domain: 'libraries',
    subject: 'react',
    topic: 're-rendering',
    level: 'mid',
    kind: 'single',
    prompt: `\`\`\`jsx
const Row = React.memo(function Row({ ticket, onSelect }) {
  return <tr onClick={() => onSelect(ticket.id)}>{/* ... */}</tr>;
});

function List({ tickets }) {
  const [selected, setSelected] = useState(null);
  return tickets.map((t) => (
    <Row key={t.id} ticket={t} onSelect={(id) => setSelected(id)} />
  ));
}
\`\`\`
When \`selected\` changes, which rows re-render?`,
    options: [
      { id: 'a', text: 'Only the clicked row, because `React.memo` skips the others' },
      { id: 'b', text: 'None; `selected` is not passed to any row' },
      { id: 'c', text: 'All rows, because `onSelect` is a new function on every render of `List`' },
      { id: 'd', text: 'All rows, because `React.memo` compares props deeply and `tickets` changed' },
    ],
    answer: 'c',
    tags: ['React.memo', 'useCallback', 'referential-equality'],
    source: 'notion',
    explanation:
      '`React.memo` does a **shallow** comparison of props. The inline arrow is a new function on each render of `List`, so `onSelect` is never equal and memo never skips anything; you pay for the comparison and get nothing. Fix: pass a stable handler, e.g. `const handleSelect = useCallback((id) => setSelected(id), [])`, or pass `setSelected` directly (state setters are already stable). The same trap applies to inline objects like `style={{...}}`. The React Compiler, where enabled, inserts this memoization automatically.',
  },
  {
    id: 'react-keys-index-state-fix',
    domain: 'libraries',
    subject: 'react',
    topic: 're-rendering',
    level: 'mid',
    kind: 'fix',
    language: 'typescript',
    prompt:
      "React matches per-row state (here, a draft typed into each row's input) to rows by `key`. `solution(prev, drafts, next)` simulates that: it stores each previous row's draft under its key and returns the draft each row of `next` ends up with. The list currently keys rows by array index, so deleting or inserting a row makes drafts jump to the wrong row. Fix `keyFor` so drafts follow their rows.",
    starter: `type Row = { id: string; label: string };

function keyFor(row: Row, index: number): string {
  return String(index);
}

export function solution(prev: Row[], drafts: string[], next: Row[]): string[] {
  const draftByKey = new Map(prev.map((row, i) => [keyFor(row, i), drafts[i]]));
  return next.map((row, i) => draftByKey.get(keyFor(row, i)) ?? '');
}`,
    tests: [
      {
        name: 'deleting the first row keeps drafts on their rows',
        args: [
          [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }],
          ['draft a', 'draft b', 'draft c'],
          [{ id: 'b', label: 'B' }, { id: 'c', label: 'C' }],
        ],
        expected: ['draft b', 'draft c'],
      },
      {
        name: 'inserting at the top gives the new row an empty draft',
        args: [[{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], ['draft a', 'draft b'], [{ id: 'z', label: 'Z' }, { id: 'a', label: 'A' }, { id: 'b', label: 'B' }]],
        expected: ['', 'draft a', 'draft b'],
      },
      {
        name: 'reordering moves drafts with the rows',
        args: [[{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], ['draft a', 'draft b'], [{ id: 'b', label: 'B' }, { id: 'a', label: 'A' }]],
        expected: ['draft b', 'draft a'],
      },
    ],
    solution: `type Row = { id: string; label: string };

function keyFor(row: Row, index: number): string {
  return row.id;
}

export function solution(prev: Row[], drafts: string[], next: Row[]): string[] {
  const draftByKey = new Map(prev.map((row, i) => [keyFor(row, i), drafts[i]]));
  return next.map((row, i) => draftByKey.get(keyFor(row, i)) ?? '');
}`,
    tags: ['keys', 'reconciliation', 'lists'],
    source: 'notion',
    explanation:
      'During reconciliation React pairs old and new children by `key`; a matching key keeps the component instance, its state and its DOM node. With index keys, removing row 0 makes the old row 1 "become" key 0, so its state lands on the wrong item. Use a stable, unique id from the data. Index keys are acceptable only for static lists that are never filtered, sorted or edited and whose rows hold no state. Never generate keys during render (`Math.random()`, `crypto.randomUUID()`): every render would remount every row. If the data has no id, assign one when the item is **created**.',
  },
  {
    id: 'react-derived-state-anti-pattern',
    domain: 'libraries',
    subject: 'react',
    topic: 'props-and-state',
    level: 'senior',
    kind: 'open',
    prompt: `You are reviewing this pull request. What is wrong, and what do you ask the author to write instead?
\`\`\`jsx
function TicketList({ tickets }) {
  const [query, setQuery] = useState('');
  const [filtered, setFiltered] = useState(tickets);
  useEffect(() => {
    setFiltered(tickets.filter((t) => t.title.includes(query)));
  }, [tickets, query]);
  // renders <input> for query and the filtered list
}
\`\`\``,
    modelAnswer:
      '`filtered` is derived state: it can always be computed from `tickets` and `query`, so storing it creates a second source of truth that must be kept in sync. The effect runs after paint, so every change renders once with stale data and then renders again. It is also fragile: forget a dependency and the list silently goes stale, and `useState(tickets)` only uses `tickets` for the initial value. Replace the state and the effect with a value computed during render: `const filtered = tickets.filter(...)`, wrapped in `useMemo(..., [tickets, query])` only if the filter is measurably expensive. The rule is minimal state (raw data plus user intent) and derive everything else. The same thinking applies to "reset state when a prop changes": use a `key` instead of an effect. Copying a prop into state is only right when the user edits a draft on purpose, and then the prop should be named `initialX`.',
    rubric: [
      'Names it derived/duplicated state and the single-source-of-truth problem',
      'Explains the extra render with stale data caused by syncing in an effect',
      'Replaces it with computation during render, adding `useMemo` only when expensive',
      'Knows the legitimate exception (an editable draft seeded from a prop) or the `key` reset pattern',
    ],
    tags: ['derived-state', 'useMemo', 'useEffect', 'code-review'],
    source: 'notion',
    explanation:
      '"You might not need an effect" is the idea being tested: effects are for synchronizing with systems outside React, not for transforming data React already has.\n\n**Say this out loud:** "Don\'t store what you can compute. I keep the raw data and the user\'s intent in state and derive the rest during render, memoizing only when the derivation is actually expensive."',
  },
  {
    id: 'react-state-management-choice',
    domain: 'libraries',
    subject: 'react',
    topic: 'props-and-state',
    level: 'senior',
    kind: 'open',
    prompt:
      'You are laying out a new mid-size React app. It has: the signed-in user and theme, a product catalogue loaded from an API, a four-step checkout wizard, list filters that should survive a page reload and be shareable, and a live order board that updates several times per second. Where does each piece of state live, and why?',
    modelAnswer:
      'Start from colocation: state lives in the lowest component that needs it and is lifted to the nearest common parent only when siblings share it. The user and theme are cross-cutting and change rarely, so Context fits, with a memoized `value` (or separate contexts for state and setters), because a context change re-renders every consumer. The catalogue is server state: it belongs in React Query, SWR or RTK Query, which treat it as a cache with invalidation, de-duplication and refetching, not as client state I copy into a store. The checkout wizard is local, multi-field state with transitions, so a `useReducer` at the wizard root works, with the current step in the URL if back/forward should work. Filters go in the URL search params, which makes them shareable and survive reloads. The live board is high-frequency global state: an external store (Redux Toolkit or Zustand) with selectors, so each component subscribes only to the slice it renders instead of re-rendering a whole context tree.',
    rubric: [
      'Colocates by default and lifts state only as far as needed',
      'Uses Context for low-frequency cross-cutting values and names the "all consumers re-render" cost',
      'Separates server state (React Query/SWR/RTK Query) from client state',
      'Puts shareable filters in the URL',
      'Picks a selector-based store (Redux Toolkit/Zustand) for high-frequency shared state',
    ],
    tags: ['state-management', 'context', 'redux', 'react-query', 'architecture'],
    source: 'notion',
    explanation:
      'There is no single "state library" answer; interviewers listen for a decision table driven by who reads the state, how often it changes and whether the server owns it.\n\n**Say this out loud:** "I pick the home for state by its owner and update frequency: local state first, the URL for shareable state, a server cache for server data, Context for rare global values, and a selector-based store only for hot shared state."',
  },
  {
    id: 'react-reset-state-with-key',
    domain: 'libraries',
    subject: 'react',
    topic: 'props-and-state',
    level: 'mid',
    kind: 'single',
    prompt:
      '`<CommentBox userId={userId} />` keeps a `draft` in `useState`. When the page switches from user 1 to user 2, the half-typed draft for user 1 is still in the box. What is the cleanest fix?',
    options: [
      { id: 'a', text: 'Render `<CommentBox key={userId} userId={userId} />`' },
      { id: 'b', text: 'Add `useEffect(() => setDraft(""), [userId])` inside `CommentBox`' },
      { id: 'c', text: 'Use `useState(() => loadDraft(userId))`; the initializer re-runs when `userId` changes' },
      { id: 'd', text: 'Wrap `CommentBox` in `React.memo` so it remounts when its props change' },
    ],
    answer: 'a',
    tags: ['keys', 'state-reset', 'useState'],
    source: 'topic-list',
    explanation:
      'React keeps state for the same component type at the same position in the tree. Changing `key` tells React it is a different instance, so it unmounts the old one and mounts a fresh one with fresh state (including every child\'s state). The `useEffect` reset works but renders once with the stale draft and only resets the one field you remembered. The lazy initializer runs only on mount. `React.memo` never remounts anything; it only skips renders.',
  },
  {
    id: 'react-controlled-input-no-onchange',
    domain: 'libraries',
    subject: 'react',
    topic: 'forms',
    level: 'junior',
    kind: 'single',
    prompt:
      'Interviewers ask about data binding. In React, `const [name, setName] = useState("Ada")` and the JSX renders `<input value={name} />` with no `onChange`. What happens when the user types?',
    options: [
      { id: 'a', text: 'The input and `name` both update (two-way binding)' },
      { id: 'b', text: 'The input keeps showing "Ada", and React warns that `value` was provided without `onChange`' },
      { id: 'c', text: 'The input updates, but `name` stays "Ada"' },
      { id: 'd', text: 'React throws and unmounts the component' },
    ],
    answer: 'b',
    tags: ['controlled-components', 'data-binding', 'core-25'],
    source: 'core-list',
    explanation:
      'React has **one-way** data flow: `value={name}` makes the input controlled, so on every render React forces the DOM value back to `name`. Keystrokes change nothing until an `onChange` calls `setName(e.target.value)`, which is how React does what other frameworks call two-way binding. For an uncontrolled input, use `defaultValue` and read the value through a ref or `FormData` on submit. If read-only is intended, add `readOnly` to silence the warning.',
  },
  {
    id: 'react-large-form-performance',
    domain: 'libraries',
    subject: 'react',
    topic: 'forms',
    level: 'senior',
    kind: 'open',
    prompt:
      'A 60-field insurance form keeps every value in one `useState` object at the form root, uses controlled inputs, and validates the whole object on each change. Typing lags by about 150 ms per keystroke on mid-range laptops. Diagnose it and describe your redesign.',
    modelAnswer:
      'Every keystroke sets state at the root, so the whole form, all 60 fields, re-renders, and the full validation runs on top of that. I would confirm it with the React Profiler before changing anything. Then there are two directions. One is uncontrolled inputs with React Hook Form: fields register through refs, the DOM holds the value, and only fields that subscribe to a value or an error re-render; validation runs on blur or submit through a schema resolver (Zod). The other, if it stays controlled: split state by section, memoize field components with `React.memo`, and pass stable handlers (a `useReducer` `dispatch` is stable), so a keystroke re-renders one field. Either way, validate per field on blur, debounce async checks such as "email already taken", and put expensive previews behind `useDeferredValue`. Keep controlled inputs where you need instant formatting, such as masks.',
    rubric: [
      'Identifies root-level state causing whole-form re-renders plus validation on every change',
      'Measures first (React Profiler) instead of guessing',
      'Proposes uncontrolled inputs / React Hook Form, or splitting state with memoized fields and stable handlers',
      'Moves validation to blur/submit and debounces async validation',
    ],
    tags: ['forms', 'react-hook-form', 'controlled-components', 'performance'],
    source: 'topic-list',
    explanation:
      'Controlled versus uncontrolled is a performance decision as well as an API one: controlled inputs put every keystroke through React state.\n\n**Say this out loud:** "Form lag is almost always the render scope of a keystroke. I shrink it, either by letting the DOM own the value with React Hook Form or by making each keystroke re-render one memoized field, and I move validation off the keystroke path."',
  },
  {
    id: 'react-memoization-trio',
    domain: 'libraries',
    subject: 'react',
    topic: 'performance',
    level: 'senior',
    kind: 'open',
    prompt:
      'Explain `React.memo`, `useCallback` and `useMemo`: what each one does, how they work together, and when they are a waste.',
    modelAnswer:
      '`React.memo(Component)` skips re-rendering a component when its props are shallow-equal to last time. `useCallback(fn, deps)` keeps a function\'s identity stable across renders, and `useMemo(calc, deps)` caches a computed value (a filtered or sorted list, or an object passed as a prop) until its dependencies change. They work as a set: `memo` on a row component is useless if the parent passes a new inline function or object every render, so you pair it with `useCallback` or `useMemo` for those props. `useMemo` also has a correctness use: keeping an object stable when it is an effect dependency or a context value. They are a waste on cheap components, on props that change every render anyway, and when sprinkled everywhere, because every memo costs memory and a dependency comparison, and a wrong dependency array causes stale bugs. I profile first and memoize where renders are actually hot; with the React Compiler enabled most of this becomes automatic.',
    rubric: [
      'Defines each tool correctly (shallow prop compare, stable function identity, cached value)',
      'Explains that memo without stable callback/object props is defeated',
      'Mentions referential stability for effect dependencies or context values',
      'States the cost of over-memoizing and profiles first; bonus: React Compiler',
    ],
    tags: ['React.memo', 'useCallback', 'useMemo', 'memoization', 'core-25'],
    source: 'notion',
    explanation:
      'The classic senior list asks about memoization in general; in a React interview it becomes this question. The nuance they probe is the interaction: `useCallback` alone does nothing for performance unless the receiver is memoized or uses the function as a dependency.\n\n**Say this out loud:** "`React.memo` only helps if the props are actually stable, so I pair it with `useCallback` and `useMemo` for function and object props, and I only do that where the Profiler shows hot renders, because memoization has its own cost."',
  },
  {
    id: 'react-transition-vs-deferred',
    domain: 'libraries',
    subject: 'react',
    topic: 'performance',
    level: 'senior',
    kind: 'single',
    prompt:
      'A parent component you do not own passes `query` (updated on every keystroke) to your `<BigList query={query} />`, which filters and renders 20,000 rows. Typing in the search box lags. You may change only `BigList`. Which is the right tool?',
    options: [
      { id: 'a', text: '`const deferred = useDeferredValue(query)` and filter with `deferred` inside `useMemo`' },
      { id: 'b', text: '`useTransition`, wrapping `setQuery` in `startTransition`' },
      { id: 'c', text: 'Wrap `BigList` in `React.memo`' },
      { id: 'd', text: 'Filter inside `useLayoutEffect` so the work happens before paint' },
    ],
    answer: 'a',
    tags: ['useDeferredValue', 'useTransition', 'concurrent-rendering'],
    source: 'notion',
    explanation:
      'Both concurrent hooks mark work as non-urgent so React can interrupt it to keep typing responsive. `useTransition` wraps the **state update**, so you need to own the setter (wrapping `setQuery` in `startTransition` is impossible here). `useDeferredValue` wraps a **value you receive**: React first re-renders with the old deferred value, then renders the new one in the background and abandons it if another keystroke arrives. The `useMemo` matters: without it the urgent render still re-filters. `React.memo` cannot help because `query` really changes on each keystroke, and `useLayoutEffect` blocks paint even harder. Unlike a debounce there is no fixed delay: fast devices update almost immediately. For network requests you still debounce. Show `query !== deferred` as a "stale" hint.\n\n**Say this out loud:** "`useTransition` when I own the state update, `useDeferredValue` when I only receive the value; both keep input urgent and let the expensive render be interrupted, which a debounce cannot do."',
  },
];
