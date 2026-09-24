// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  {
    id: 'redux-reducer-rules',
    domain: 'libraries',
    subject: 'redux',
    topic: 'core',
    level: 'junior',
    kind: 'multi',
    prompt: 'Which of these break the rules for a plain Redux reducer (no Redux Toolkit)? Select all that apply.',
    options: [
      { id: 'a', text: '```js\nreturn {\n  ...state,\n  items: [...state.items, action.item],\n};\n```' },
      { id: 'b', text: '```js\nstate.count++;\nreturn state;\n```' },
      { id: 'c', text: "```js\nfetch('/api/audit', {\n  method: 'POST',\n  body: JSON.stringify(action),\n});\n```" },
      { id: 'd', text: 'Creating the new item with `id: crypto.randomUUID()` inside the reducer' },
      { id: 'e', text: '```js\nreturn state;\n```\n(for an action type the reducer does not handle)' },
    ],
    answer: ['b', 'c', 'd'],
    tags: ['reducers', 'pure-functions', 'immutability'],
    source: 'topic-list',
    explanation:
      'A reducer must be a pure function of `(state, action)`: no mutation (`state.count++`), no side effects such as network calls (`fetch`), and no non-deterministic values such as random ids or `Date.now()`, because replaying the same actions (time-travel debugging, tests, replaying a recorded action log) must produce the same state. Generate ids in the action creator (Redux Toolkit\'s `prepare` callback) and put side effects in thunks, listeners or middleware. Returning the existing state for unknown actions is required: it keeps the reference unchanged, so subscribers know nothing changed.',
  },
  {
    id: 'redux-reducer-immutability-fix',
    domain: 'libraries',
    subject: 'redux',
    topic: 'core',
    level: 'mid',
    kind: 'fix',
    language: 'javascript',
    prompt:
      'This hand-written todos reducer "works" in the reducer unit test, but connected components never re-render after `todos/added` or `todos/toggled`. `solution(actions)` replays the actions like a store and returns every state plus whether the state reference changed (react-redux compares references to decide whether to re-render). Fix `todosReducer` without changing `solution`.',
    starter: `const initialState = { todos: [], nextId: 1 };

function todosReducer(state = initialState, action) {
  switch (action.type) {
    case 'todos/added':
      state.todos.push({ id: state.nextId, text: action.text, done: false });
      state.nextId += 1;
      return state;
    case 'todos/toggled': {
      const todo = state.todos.find((t) => t.id === action.id);
      todo.done = !todo.done;
      return state;
    }
    default:
      return state;
  }
}

export function solution(actions) {
  let state = todosReducer(undefined, { type: '@@init' });
  const history = [state];
  const changed = [];
  for (const action of actions) {
    const next = todosReducer(state, action);
    changed.push(next !== state);
    history.push(next);
    state = next;
  }
  return { history, changed };
}`,
    tests: [
      {
        name: 'adding creates new states',
        args: [[{ type: 'todos/added', text: 'a' }, { type: 'todos/added', text: 'b' }]],
        expected: {
          history: [
            { todos: [], nextId: 1 },
            { todos: [{ id: 1, text: 'a', done: false }], nextId: 2 },
            { todos: [{ id: 1, text: 'a', done: false }, { id: 2, text: 'b', done: false }], nextId: 3 },
          ],
          changed: [true, true],
        },
      },
      {
        name: 'toggling creates a new state',
        args: [[{ type: 'todos/added', text: 'a' }, { type: 'todos/toggled', id: 1 }]],
        expected: {
          history: [
            { todos: [], nextId: 1 },
            { todos: [{ id: 1, text: 'a', done: false }], nextId: 2 },
            { todos: [{ id: 1, text: 'a', done: true }], nextId: 2 },
          ],
          changed: [true, true],
        },
      },
      {
        name: 'unknown actions keep the reference',
        args: [[{ type: 'todos/added', text: 'a' }, { type: 'other' }]],
        expected: {
          history: [
            { todos: [], nextId: 1 },
            { todos: [{ id: 1, text: 'a', done: false }], nextId: 2 },
            { todos: [{ id: 1, text: 'a', done: false }], nextId: 2 },
          ],
          changed: [true, false],
        },
      },
    ],
    solution: `const initialState = { todos: [], nextId: 1 };

function todosReducer(state = initialState, action) {
  switch (action.type) {
    case 'todos/added':
      return {
        ...state,
        todos: [...state.todos, { id: state.nextId, text: action.text, done: false }],
        nextId: state.nextId + 1,
      };
    case 'todos/toggled':
      return {
        ...state,
        todos: state.todos.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t)),
      };
    default:
      return state;
  }
}

export function solution(actions) {
  let state = todosReducer(undefined, { type: '@@init' });
  const history = [state];
  const changed = [];
  for (const action of actions) {
    const next = todosReducer(state, action);
    changed.push(next !== state);
    history.push(next);
    state = next;
  }
  return { history, changed };
}`,
    tags: ['immutability', 'reducers', 'react-redux', 'core-25'],
    source: 'core-list',
    explanation:
      'Redux and react-redux detect change by **reference**: `useSelector` re-renders only when the selected value is `!==` the previous one. Mutating and returning the same object means "nothing changed", so the UI goes stale, and every state in the history is secretly the same object (which also breaks time-travel debugging). The mutating version even corrupts the module-level `initialState`. Copy every level you change (`...state`, `[...state.todos, x]`, `map` with `{ ...t }`) and share untouched branches (structural sharing).\n\nThis is the classic immutability question in practice. In Redux Toolkit, the original mutating code would be legal inside `createSlice`, because Immer records the mutations on a draft and produces the new immutable state for you.',
  },
  {
    id: 'redux-middleware-order',
    domain: 'libraries',
    subject: 'redux',
    topic: 'core',
    level: 'mid',
    kind: 'predict',
    language: 'javascript',
    prompt:
      'This is a stripped-down copy of `createStore` and `applyMiddleware` that composes middleware exactly the way Redux does (`store => next => action`). What does the final `dispatch` print, one value per line?',
    code: `function createStore(reducer) {
  let state = reducer(undefined, { type: '@@init' });
  const listeners = [];
  return {
    getState: () => state,
    dispatch(action) {
      state = reducer(state, action);
      listeners.forEach((l) => l());
      return action;
    },
    subscribe: (l) => listeners.push(l),
  };
}

function applyMiddleware(store, ...middlewares) {
  let dispatch = store.dispatch;
  const api = { getState: store.getState, dispatch: (a) => dispatch(a) };
  const chain = middlewares.map((m) => m(api));
  dispatch = chain.reduceRight((next, m) => m(next), store.dispatch);
  return { ...store, dispatch };
}

const logger = (name) => () => (next) => (action) => {
  console.log(name + ' before');
  const result = next(action);
  console.log(name + ' after');
  return result;
};

const reducer = (state = 0, action) => {
  if (action.type === 'inc') {
    console.log('reducer');
    return state + 1;
  }
  return state;
};

const store = applyMiddleware(createStore(reducer), logger('A'), logger('B'));
store.subscribe(() => console.log('listener ' + store.getState()));
store.dispatch({ type: 'inc' });`,
    answer: 'A before\nB before\nreducer\nlistener 1\nB after\nA after',
    tags: ['middleware', 'data-flow'],
    source: 'topic-list',
    explanation:
      'Middleware wraps `dispatch` like an onion: the first middleware passed is the outermost layer. The action flows A then B into the real `dispatch`, which runs the reducer and **synchronously** notifies subscribers, and only then does control unwind back through B and A. That is why a logger middleware can print the state both before and after `next(action)`, and why thunks work: a thunk middleware intercepts function "actions" before they reach `next`.',
  },
  {
    id: 'redux-memoized-selector',
    domain: 'libraries',
    subject: 'redux',
    topic: 'core',
    level: 'senior',
    kind: 'code',
    language: 'typescript',
    prompt:
      "`selectVisibleTodos` filters todos on every call, so `useSelector` gets a new array each time and the component re-renders on **any** store change, even a theme toggle. Implement `createSelector(selectA, selectB, combiner)` (a two-input version of Reselect's) so the combiner re-runs only when an input result changes by reference, and otherwise returns the previous result object.\n\n`solution` replays steps through a reducer that uses structural sharing and reports how many times the combiner ran, whether each step returned the same array reference as the previous step, and the final visible ids.",
    starter: `type Todo = { id: number; done: boolean };
type Filter = 'all' | 'done' | 'open';
type State = { todos: Todo[]; filter: Filter; theme: string };
type Step = { type: 'theme' } | { type: 'filter'; filter: Filter } | { type: 'toggle'; id: number };

function createSelector<S, A, B, R>(selectA: (s: S) => A, selectB: (s: S) => B, combiner: (a: A, b: B) => R): (s: S) => R {
  // TODO: memoize on the identity of the input results
  return (state) => combiner(selectA(state), selectB(state));
}

function reducer(state: State, step: Step): State {
  switch (step.type) {
    case 'theme':
      return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' };
    case 'filter':
      return { ...state, filter: step.filter };
    case 'toggle':
      return { ...state, todos: state.todos.map((t) => (t.id === step.id ? { ...t, done: !t.done } : t)) };
  }
}

export function solution(todos: Todo[], steps: Step[]) {
  let computations = 0;
  const selectVisibleTodos = createSelector(
    (s: State) => s.todos,
    (s: State) => s.filter,
    (list, filter) => {
      computations += 1;
      return list.filter((t) => filter === 'all' || (filter === 'done' ? t.done : !t.done));
    },
  );
  let state: State = { todos, filter: 'open', theme: 'light' };
  let previous = selectVisibleTodos(state);
  const sameReference: boolean[] = [];
  for (const step of steps) {
    state = reducer(state, step);
    const next = selectVisibleTodos(state);
    sameReference.push(next === previous);
    previous = next;
  }
  return { computations, sameReference, visibleIds: previous.map((t) => t.id) };
}`,
    tests: [
      {
        name: 'theme toggles do not recompute',
        args: [[{ id: 1, done: false }, { id: 2, done: true }], [{ type: 'theme' }, { type: 'theme' }]],
        expected: { computations: 1, sameReference: [true, true], visibleIds: [1] },
      },
      {
        name: 'a filter change recomputes once',
        args: [[{ id: 1, done: false }, { id: 2, done: true }], [{ type: 'filter', filter: 'done' }, { type: 'theme' }]],
        expected: { computations: 2, sameReference: [false, true], visibleIds: [2] },
      },
      {
        name: 'setting the same filter value does not recompute',
        args: [[{ id: 1, done: false }], [{ type: 'filter', filter: 'open' }]],
        expected: { computations: 1, sameReference: [true], visibleIds: [1] },
      },
      {
        name: 'toggling a todo recomputes',
        args: [[{ id: 1, done: false }, { id: 2, done: true }], [{ type: 'toggle', id: 1 }]],
        expected: { computations: 2, sameReference: [false], visibleIds: [] },
      },
    ],
    solution: `type Todo = { id: number; done: boolean };
type Filter = 'all' | 'done' | 'open';
type State = { todos: Todo[]; filter: Filter; theme: string };
type Step = { type: 'theme' } | { type: 'filter'; filter: Filter } | { type: 'toggle'; id: number };

function createSelector<S, A, B, R>(selectA: (s: S) => A, selectB: (s: S) => B, combiner: (a: A, b: B) => R): (s: S) => R {
  let initialized = false;
  let lastA: A;
  let lastB: B;
  let lastResult: R;
  return (state) => {
    const a = selectA(state);
    const b = selectB(state);
    if (initialized && Object.is(a, lastA) && Object.is(b, lastB)) {
      return lastResult;
    }
    initialized = true;
    lastA = a;
    lastB = b;
    lastResult = combiner(a, b);
    return lastResult;
  };
}

function reducer(state: State, step: Step): State {
  switch (step.type) {
    case 'theme':
      return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' };
    case 'filter':
      return { ...state, filter: step.filter };
    case 'toggle':
      return { ...state, todos: state.todos.map((t) => (t.id === step.id ? { ...t, done: !t.done } : t)) };
  }
}

export function solution(todos: Todo[], steps: Step[]) {
  let computations = 0;
  const selectVisibleTodos = createSelector(
    (s: State) => s.todos,
    (s: State) => s.filter,
    (list, filter) => {
      computations += 1;
      return list.filter((t) => filter === 'all' || (filter === 'done' ? t.done : !t.done));
    },
  );
  let state: State = { todos, filter: 'open', theme: 'light' };
  let previous = selectVisibleTodos(state);
  const sameReference: boolean[] = [];
  for (const step of steps) {
    state = reducer(state, step);
    const next = selectVisibleTodos(state);
    sameReference.push(next === previous);
    previous = next;
  }
  return { computations, sameReference, visibleIds: previous.map((t) => t.id) };
}`,
    tags: ['selectors', 'reselect', 'memoization', 'useSelector', 'core-25'],
    source: 'topic-list',
    explanation:
      "`useSelector` runs the selector after **every** dispatch and re-renders when the result is `!==` the previous one. A selector that returns `filter(...)` produces a new array every time, so the component re-renders on unrelated actions. Memoizing on the input references works because reducers use structural sharing: a theme toggle creates a new root object but keeps the same `todos` array. This exercise builds the classic cache-of-one version, which is what Reselect 4 did (`defaultMemoize`, now `lruMemoize`) and why selectors shared by components with different arguments used to need a factory. Reselect 5, re-exported by Redux Toolkit 2, defaults to `weakMapMemoize`, which keeps one result per distinct set of arguments, so per-component factories are rarely needed now.\n\n**Say this out loud:** \"Selectors that derive arrays or objects must be memoized, otherwise `useSelector` sees a new reference on every dispatch and re-renders. Memoization works because immutable updates keep unchanged branches referentially equal.\"",
  },
  {
    id: 'redux-toolkit-immer-reassign',
    domain: 'libraries',
    subject: 'redux',
    topic: 'redux-toolkit',
    level: 'mid',
    kind: 'single',
    prompt: `\`\`\`js
const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [], coupon: null },
  reducers: {
    added(state, action) { state.items.push(action.payload); },
    cleared() { return { items: [], coupon: null }; },
    couponApplied(state, action) { state.coupon = action.payload; },
    reset(state) { state = { items: [], coupon: null }; },
  },
});
\`\`\`
Which case reducer does **not** change the store state?`,
    options: [
      { id: 'a', text: '`added`, because `push` mutates state' },
      { id: 'b', text: '`cleared`, because slice reducers must not return a value' },
      { id: 'c', text: '`couponApplied`, because Immer ignores assignments to primitive fields' },
      { id: 'd', text: '`reset`, because reassigning the `state` parameter does not touch the draft' },
    ],
    answer: 'd',
    tags: ['immer', 'createSlice'],
    source: 'topic-list',
    explanation:
      '`createSlice` runs case reducers through Immer: `state` is a draft proxy, and Immer records **mutations** of that draft (the `push` in `added`, the assignment in `couponApplied`) or accepts a **returned** replacement value (as in `cleared`). `state = ...` only rebinds a local variable; the draft is untouched and nothing is returned, so Immer returns the original state. Write `return { items: [], coupon: null };` instead (or hoist that object into a named `initialState` constant and return it). The other Immer trap: you may mutate the draft **or** return a new value, not both; doing both throws.',
  },
  {
    id: 'redux-async-thunk-vs-rtk-query',
    domain: 'libraries',
    subject: 'redux',
    topic: 'redux-toolkit',
    level: 'senior',
    kind: 'open',
    prompt:
      'A codebase stores API data in Redux using `createAsyncThunk` plus hand-written `loading`/`error` flags in every slice, and several screens show stale data after edits. How would you evolve it, and what stays in Redux?',
    modelAnswer:
      'The slices are hand-rolling a server cache: every thunk repeats pending/fulfilled/rejected handling, and nothing knows which cached data an edit invalidates, which is why screens go stale. I would move server data to RTK Query, since the app already uses Redux Toolkit (React Query is the equivalent if it didn\'t). You define endpoints once and get generated hooks with loading and error state, request de-duplication, caching per argument, polling, and invalidation through `providesTags`/`invalidatesTags`, so a mutation refetches exactly the queries it made stale. Optimistic updates go in `onQueryStarted` with a rollback. Redux keeps genuine client state: UI state, multi-step workflows, and cross-cutting state that is not owned by the server. `createAsyncThunk` stays for workflows that are not simple request/response, and `createEntityAdapter` for normalized client-side collections. I would migrate one endpoint at a time behind the existing selectors to keep the change safe.',
    rubric: [
      'Distinguishes server state (a cache) from client state',
      'Proposes RTK Query (or React Query) and names tag-based invalidation as the fix for stale data',
      'Knows what remains in slices (UI and workflow state, entity adapters, thunks for complex flows)',
      'Plans an incremental migration rather than a rewrite',
    ],
    tags: ['rtk-query', 'createAsyncThunk', 'server-state', 'caching'],
    source: 'topic-list',
    explanation:
      'The stale-data symptom is a cache-invalidation problem, which is why a data-fetching layer with invalidation is the answer instead of more flags.\n\n**Say this out loud:** "Server data is a cache, not application state. I let RTK Query own fetching, caching and invalidation with tags, and keep Redux slices for the client state the server does not know about."',
  },
];
