// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  {
    id: 'react-testing-library-query-priority',
    domain: 'libraries',
    subject: 'react-testing-library',
    topic: 'rtl',
    level: 'junior',
    kind: 'single',
    prompt: 'A form has a `<button type="submit">Save changes</button>`. Which query does React Testing Library recommend for finding it?',
    options: [
      { id: 'a', text: "`screen.getByRole('button', { name: /save changes/i })`" },
      { id: 'b', text: "`screen.getByTestId('save-button')`" },
      { id: 'c', text: "`container.querySelector('.btn-primary')`" },
      { id: 'd', text: "`screen.getByText('Save changes')`" },
    ],
    answer: 'a',
    tags: ['queries', 'accessibility'],
    source: 'topic-list',
    explanation:
      'The guiding principle is "the more your tests resemble the way your software is used, the more confidence they give you". Users and assistive technology find controls by role and accessible name, so `getByRole` both finds the button and checks that it is exposed correctly (a `<div onClick>` would fail). The priority is roughly: role, label, placeholder, text, display value, alt text, title, and `getByTestId` only as a last resort. `getByText` works but does not prove it is a button; CSS selectors couple the test to styling.',
  },
  {
    id: 'react-testing-library-get-query-find',
    domain: 'libraries',
    subject: 'react-testing-library',
    topic: 'rtl',
    level: 'mid',
    kind: 'multi',
    prompt: 'Which statements about `getBy*`, `queryBy*` and `findBy*` are true? Select all that apply.',
    options: [
      { id: 'a', text: '`getBy*` throws when there is no match, or when there is more than one' },
      { id: 'b', text: '`queryBy*` returns `null` when there is no match, which makes it the right choice for asserting that something is absent' },
      { id: 'c', text: '`findBy*` returns a promise and retries until the element appears or the timeout (1000 ms by default) expires' },
      { id: 'd', text: '`queryBy*` retries for a short time before returning `null`' },
      { id: 'e', text: '`getAllBy*` returns an empty array when there is no match' },
    ],
    answer: ['a', 'b', 'c'],
    tags: ['queries', 'async'],
    source: 'topic-list',
    explanation:
      '`get` = must exist now (throws with a helpful DOM dump). `query` = may not exist, returns `null`, no retry: use it for `expect(screen.queryByRole("alert")).not.toBeInTheDocument()`. `find` = will exist soon: it is `getBy` wrapped in `waitFor`, so you `await` it. The `*All*` variants follow the same rules for "none found": `getAllBy` throws, `queryAllBy` returns `[]`.',
  },
  {
    id: 'react-testing-library-user-event',
    domain: 'libraries',
    subject: 'react-testing-library',
    topic: 'rtl',
    level: 'mid',
    kind: 'single',
    prompt:
      'A phone input blocks letters in an `onKeyDown` handler. The test `fireEvent.change(input, { target: { value: "abc" } })` followed by an assertion that the value is empty **fails**, although the component works in the browser. Which change makes the test exercise the real interaction?',
    options: [
      { id: 'a', text: "`const user = userEvent.setup();` then `await user.type(input, 'abc')`" },
      { id: 'b', text: "`fireEvent.input(input, { target: { value: 'abc' } })`" },
      { id: 'c', text: "`userEvent.type(input, 'abc')` without `await` (user-event v14)" },
      { id: 'd', text: "`act(() => { input.value = 'abc'; })`" },
    ],
    answer: 'a',
    tags: ['user-event', 'fireEvent'],
    source: 'topic-list',
    explanation:
      '`fireEvent.change` dispatches one synthetic `change` event with the value already set, skipping `keydown`, `keypress`, `input` and `keyup`, so the handler that blocks letters never runs. `user.type` simulates what the browser does for each character (focus, key events, input events, respecting `preventDefault`). In user-event v14 every API returns a promise; forgetting `await` on `userEvent.type` means the assertion runs before the events finish. Create the `user` with `userEvent.setup()` before rendering.',
  },
  {
    id: 'react-testing-library-async-findby',
    domain: 'libraries',
    subject: 'react-testing-library',
    topic: 'rtl',
    level: 'mid',
    kind: 'single',
    prompt: `\`\`\`jsx
test('shows the user name', () => {
  render(<UserCard id="1" />); // fetches the user in an effect (mocked with MSW)
  expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
});
\`\`\`
The test fails with "Unable to find an element with the text: Ada Lovelace". What is the correct fix?`,
    options: [
      { id: 'a', text: "Make the test `async` and use `expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()`" },
      { id: 'b', text: 'Wrap `render(...)` in `act(...)`' },
      { id: 'c', text: 'Add `await new Promise((r) => setTimeout(r, 100))` before `getByText`' },
      { id: 'd', text: 'Use `screen.queryByText` instead of `getByText`' },
    ],
    answer: 'a',
    tags: ['async', 'findBy', 'msw'],
    source: 'topic-list',
    explanation:
      'On the first render the component shows its loading state; the name appears only after the mocked request resolves and state updates. `findBy*` polls until the element appears (or times out), and RTL already wraps `render`, user-event and `waitFor` in `act`, so wrapping `render` in `act` again changes nothing. A fixed sleep is slow and flaky. `queryByText` just returns `null` and the assertion still fails. If you also see "not wrapped in act(...)" warnings, it usually means an update happened after the test stopped waiting, and the fix is the same: await the UI state you expect.',
  },
  {
    id: 'react-testing-library-waitfor-pitfalls',
    domain: 'libraries',
    subject: 'react-testing-library',
    topic: 'rtl',
    level: 'senior',
    kind: 'multi',
    prompt: 'You are reviewing a test suite. Which of these are anti-patterns? Select all that apply.',
    options: [
      { id: 'a', text: "`await waitFor(() => { user.click(saveButton); expect(screen.getByText('Saved')).toBeInTheDocument(); })`" },
      { id: 'b', text: '`await waitFor(() => { expect(fetchMock).toHaveBeenCalledTimes(1); expect(screen.getByText("3 results")).toBeInTheDocument(); })`' },
      { id: 'c', text: "`expect(screen.queryByRole('alert')).not.toBeInTheDocument()`" },
      { id: 'd', text: '`await waitFor(() => {})` to "let pending updates flush"' },
      { id: 'e', text: '`const user = userEvent.setup()` before `render`, then `await user.click(...)`' },
    ],
    answer: ['a', 'b', 'd'],
    tags: ['waitFor', 'flaky-tests', 'code-review'],
    source: 'topic-list',
    explanation:
      '`waitFor` re-runs its callback until it stops throwing, so side effects inside it, such as `user.click(saveButton)`, may run many times (several clicks, several submissions). Put the action before `waitFor` and only assertions inside. Several assertions in one callback, like the `fetchMock` and results pair, make it wait for all of them and hide which one failed; wait for one condition, then assert the rest synchronously. An empty callback resolves on the first tick and only works by timing luck; wait for a concrete UI change instead. The synchronous `queryByRole(\'alert\')` absence check and `userEvent.setup()` before `render` are the recommended patterns.\n\n**Say this out loud:** "`waitFor` is a retry loop for assertions, so it must be free of side effects and wait for one observable condition; for elements appearing I just use `findBy`."',
  },
  {
    id: 'react-testing-library-debounced-search-strategy',
    domain: 'libraries',
    subject: 'react-testing-library',
    topic: 'rtl',
    level: 'senior',
    kind: 'open',
    prompt:
      'How would you test a `<TicketSearch>` component that debounces input by 300 ms, calls `/api/tickets?q=...`, shows a spinner while loading, renders results, and shows an error message when the API fails?',
    modelAnswer:
      'I test it the way a user uses it and mock at the network boundary, not the component internals. Mock Service Worker (MSW) handles `/api/tickets`, so the real fetch code runs; tests override the handler per case to return results, an empty list or a 500. For the debounce I use fake timers with `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })` (or `jest.advanceTimersByTime`), type the query, and assert that no request went out before 300 ms and exactly one after, which also proves intermediate keystrokes were dropped. Then `await screen.findByRole("status")` or the spinner\'s label, followed by `await screen.findByText(...)` for results, and `findByRole("alert")` for the error path. I query by role and accessible name, assert only on what the user sees, and never on state, hook calls or class names. I add one case for a race (slow first response, fast second) if the component claims to handle it. The pure debounce logic can also have a small unit test on its own.',
    rubric: [
      'Mocks the network (MSW) instead of mocking hooks or internal modules',
      'Uses fake timers wired into user-event to test the debounce deterministically',
      'Uses `findBy*` for loading, results and error states and role-based queries',
      'Covers the error and empty paths, and avoids implementation-detail assertions',
    ],
    tags: ['msw', 'fake-timers', 'user-event', 'testing-strategy'],
    source: 'topic-list',
    explanation:
      'The hard parts interviewers probe are time (the debounce) and the network. Fake timers make time deterministic, and MSW keeps the component\'s real data-fetching code under test.\n\n**Say this out loud:** "I mock at the network boundary with MSW, control time with fake timers wired into user-event, and assert only on what the user can see, using `findBy` for anything asynchronous."',
  },
];
