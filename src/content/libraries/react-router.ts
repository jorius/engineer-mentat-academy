// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  {
    id: 'react-router-link-vs-anchor',
    domain: 'libraries',
    subject: 'react-router',
    topic: 'routing',
    level: 'junior',
    kind: 'single',
    prompt: 'Why do you render `<Link to="/orders">` instead of `<a href="/orders">` for in-app navigation in a React Router app?',
    options: [
      { id: 'a', text: '`<Link>` updates the URL with the History API and re-renders the matching routes without a full page reload' },
      { id: 'b', text: '`<a>` tags are not allowed in JSX' },
      { id: 'c', text: '`<Link>` prefetches every route in the app on mount' },
      { id: 'd', text: '`<a href>` cannot be crawled by search engines, while `<Link>` can' },
    ],
    answer: 'a',
    tags: ['navigation', 'spa', 'history-api'],
    source: 'topic-list',
    explanation:
      '`<Link>` still renders a real `<a href>` (so it stays accessible, crawlable and supports open-in-new-tab), but it intercepts the click, calls `history.pushState` and lets the router render the new match. A plain `<a>` triggers a full document load: the JS bundle is re-evaluated and all in-memory state (React state, Redux store, caches) is lost. Use `<NavLink>` when you need an active style.',
  },
  {
    id: 'react-router-params-are-strings',
    domain: 'libraries',
    subject: 'react-router',
    topic: 'routing',
    level: 'junior',
    kind: 'single',
    prompt: `\`\`\`jsx
<Route path="/orders/:orderId" element={<OrderPage />} />

function OrderPage() {
  const { orderId } = useParams();
  const order = orders.find((o) => o.id === orderId); // o.id is a number
  // ...
}
\`\`\`
At \`/orders/42\`, \`order\` is \`undefined\` even though an order with \`id: 42\` exists. Why?`,
    options: [
      { id: 'a', text: 'URL params are always strings, so `42 === "42"` is false' },
      { id: 'b', text: '`useParams` only works inside a loader' },
      { id: 'c', text: 'The path must declare a numeric param, e.g. `:orderId(\\d+)`' },
      { id: 'd', text: 'The `<Route>` needs the `exact` prop' },
    ],
    answer: 'a',
    tags: ['useParams', 'url-params'],
    source: 'topic-list',
    explanation:
      'Everything in a URL is text, so `useParams` returns `{ orderId: "42" }`. Parse and validate at the boundary (`Number(orderId)` with a `NaN` check, or a Zod schema) and handle the invalid case, since users can type any URL. React Router v6+ removed regex param constraints and the `exact` prop; route ranking chooses the best match on its own.',
  },
  {
    id: 'react-router-loaders-timing',
    domain: 'libraries',
    subject: 'react-router',
    topic: 'routing',
    level: 'mid',
    kind: 'single',
    prompt:
      'With `createBrowserRouter`, a parent route `/projects/:id` has loader A and its child `/projects/:id/tasks` has loader B. The user clicks a link to `/projects/7/tasks`. When do the loaders run?',
    options: [
      { id: 'a', text: 'A and B start in parallel before the new routes render; the old page stays visible with `useNavigation().state === "loading"`' },
      { id: 'b', text: 'A runs, the parent renders, then B runs when the child mounts' },
      { id: 'c', text: 'The routes render first and the loaders run afterwards, like a `useEffect`' },
      { id: 'd', text: 'Only B runs, because loaders belong to leaf routes' },
    ],
    answer: 'a',
    tags: ['loaders', 'data-router', 'waterfalls'],
    source: 'topic-list',
    explanation:
      'Data routers know every matched route before rendering, so they call all matched loaders in parallel as soon as navigation starts, and render when the data is ready. Fetching in `useEffect` inside nested components creates a waterfall: the parent fetches, renders, then the child starts fetching. Read the data with `useLoaderData`; show pending UI with `useNavigation`; stream slow, non-critical data by returning a promise and rendering it with `<Await>` inside `<Suspense>`. After an `action` (form submission) the router revalidates the loaders automatically.',
  },
  {
    id: 'react-router-navigate-replace',
    domain: 'libraries',
    subject: 'react-router',
    topic: 'routing',
    level: 'mid',
    kind: 'single',
    prompt:
      'After a successful login on `/login`, you send the user to the page they originally requested. Pressing the browser Back button afterwards must **not** return to the login form. Which call do you use?',
    options: [
      { id: 'a', text: '`navigate(from ?? "/dashboard", { replace: true })`' },
      { id: 'b', text: '`navigate(from ?? "/dashboard")`' },
      { id: 'c', text: '`window.location.href = from ?? "/dashboard"`' },
      { id: 'd', text: '`navigate(-1)`' },
    ],
    answer: 'a',
    tags: ['useNavigate', 'history', 'auth-redirect'],
    source: 'topic-list',
    explanation:
      '`replace: true` replaces the current history entry (`/login`) instead of pushing a new one, so Back skips the login form. `navigate` without `replace` pushes, so Back lands on `/login` again. Setting `window.location.href` causes a full reload and also pushes an entry. `navigate(-1)` goes back to wherever the user came from, which may not be the page they requested. `from` usually comes from the guard that redirected to login: `<Navigate to="/login" replace state={{ from: location }} />`, read with `useLocation().state`.',
  },
  {
    id: 'react-router-protected-routes',
    domain: 'libraries',
    subject: 'react-router',
    topic: 'routing',
    level: 'senior',
    kind: 'open',
    prompt:
      'Design authentication and role-based access for a React Router app with a public marketing area, a signed-in app area, and an admin section. Cover where the checks live, how redirects behave, and what the client-side guard does **not** protect.',
    modelAnswer:
      'I group routes under layout routes: a public layout, an authenticated layout and an admin layout nested inside it, each rendering an `<Outlet />`. With a data router, the check goes in the layout route\'s loader: if there is no session, `throw redirect("/login?from=" + encodeURIComponent(path))`, and if the role is wrong, throw a 403 response handled by the route\'s `errorElement`. Because loaders run before rendering, protected UI never flashes, and one check covers every child route. Without loaders, a `<RequireAuth>` layout component renders `<Navigate replace state={{ from: location }} />` while showing a spinner during the session check. After login I navigate to `from` with `replace` so Back does not return to the form. Admin routes are code-split with `lazy` so the admin bundle is not shipped to everyone. Most important: client guards are UX, not security; every API endpoint must enforce authentication and authorization on the server, because anyone can call the API or change the JavaScript.',
    rubric: [
      'Uses nested layout routes with `<Outlet />` so one check covers a subtree',
      'Puts the check in a loader (`redirect`) or a guard component with `<Navigate replace>` and preserves the original location',
      'Handles the loading state and avoids flashing protected content',
      'States clearly that the server must enforce authorization; client guards are UX only',
    ],
    tags: ['auth', 'layout-routes', 'loaders', 'security'],
    source: 'topic-list',
    explanation:
      'The trap answer is "wrap each page in `if (!user) return <Navigate />`": it duplicates checks, flashes content, and implies the client is a security boundary.\n\n**Say this out loud:** "I guard whole subtrees with a layout route and check auth in its loader so nothing renders before the decision, but I treat that as UX; the API enforces authorization on every request."',
  },
];
