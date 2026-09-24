// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  'react-router-link-vs-anchor': {
    prompt: '¿Por qué renderizas `<Link to="/orders">` en lugar de `<a href="/orders">` para la navegación dentro de una app con React Router?',
    options: {
      a: '`<Link>` actualiza la URL con la History API y vuelve a renderizar las rutas que coinciden sin recargar toda la página',
      b: 'Las etiquetas `<a>` no están permitidas en JSX',
      c: '`<Link>` precarga todas las rutas de la app al montarse',
      d: 'Los motores de búsqueda no pueden rastrear `<a href>`, mientras que `<Link>` sí',
    },
    explanation: '`<Link>` igual renderiza un `<a href>` real (así sigue siendo accesible, rastreable y permite abrir en una pestaña nueva), pero intercepta el clic, llama a `history.pushState` y deja que el router renderice la nueva coincidencia. Un `<a>` simple dispara una carga completa del documento: el bundle de JS se vuelve a evaluar y se pierde todo el state en memoria (state de React, store de Redux, cachés). Usa `<NavLink>` cuando necesites un estilo de enlace activo.',
    hint: 'Compara lo que hace el navegador con un clic en un enlace común con lo que hace un router del lado del cliente cuando maneja la navegación por su cuenta.',
  },
  'react-router-params-are-strings': {
    prompt: '```jsx\n<Route path="/orders/:orderId" element={<OrderPage />} />\n\nfunction OrderPage() {\n  const { orderId } = useParams();\n  const order = orders.find((o) => o.id === orderId); // o.id is a number\n  // ...\n}\n```\nEn `/orders/42`, `order` es `undefined` aunque existe un pedido con `id: 42`. ¿Por qué?',
    options: {
      a: 'Los params de la URL siempre son strings, así que `42 === "42"` es false',
      b: '`useParams` solo funciona dentro de un loader',
      c: 'El path debe declarar un param numérico, por ejemplo `:orderId(\\d+)`',
      d: 'El `<Route>` necesita la prop `exact`',
    },
    explanation: 'Todo en una URL es texto, así que `useParams` devuelve `{ orderId: "42" }`. Parsea y valida en el borde (`Number(orderId)` con una verificación de `NaN`, o un schema de Zod) y maneja el caso inválido, porque los usuarios pueden escribir cualquier URL. React Router v6+ eliminó las restricciones de params con regex y la prop `exact`; el ranking de rutas elige la mejor coincidencia por su cuenta.',
    hint: 'Recuerda cómo extrae React Router los params de la URL, y qué compara la igualdad estricta.',
  },
  'react-router-loaders-timing': {
    prompt: 'Con `createBrowserRouter`, una ruta padre `/projects/:id` tiene el loader A y su hija `/projects/:id/tasks` tiene el loader B. El usuario está en la página de inicio `/` y hace clic en un enlace a `/projects/7/tasks`. ¿Cuándo se ejecutan los loaders?',
    options: {
      a: 'A y B arrancan en paralelo antes de que se rendericen las nuevas rutas; la página anterior sigue visible con `useNavigation().state === "loading"`',
      b: 'A se ejecuta, el padre se renderiza y luego B se ejecuta cuando se monta la hija',
      c: 'Las rutas se renderizan primero y los loaders se ejecutan después, como un `useEffect`',
      d: 'Solo se ejecuta B, porque los loaders pertenecen a las rutas hoja',
    },
    explanation: 'Los data routers conocen todas las rutas que coinciden antes de renderizar, así que llaman a todos los loaders coincidentes en paralelo en cuanto empieza la navegación, y renderizan cuando los datos están listos. (Si el usuario ya hubiera estado en `/projects/7`, solo se ejecutaría B: en una navegación normal el router omite los loaders de las rutas que siguen renderizadas con los mismos params, salvo que `shouldRevalidate` diga lo contrario.) Hacer fetch en `useEffect` dentro de componentes anidados crea una cascada: el padre hace fetch, renderiza y luego la hija empieza su fetch. Lee los datos con `useLoaderData`; muestra la UI pendiente con `useNavigation`; transmite en streaming los datos lentos y no críticos devolviendo una promesa y renderizándola con `<Await>` dentro de `<Suspense>`. Después de una `action` (envío de un formulario), el router revalida los loaders automáticamente.',
    hint: 'Recuerda cómo decide un data router como `createBrowserRouter` cuándo cargar datos, en comparación con cargarlos dentro de los componentes.',
  },
  'react-router-navigate-replace': {
    prompt: 'Después de un login exitoso en `/login`, envías al usuario a la página que pidió originalmente. Presionar después el botón Atrás del navegador **no** debe regresar al formulario de login. ¿Qué llamada usas?',
    explanation: '`replace: true` reemplaza la entrada actual del historial (`/login`) en lugar de agregar una nueva, así que Atrás se salta el formulario de login. `navigate` sin `replace` agrega una entrada, así que Atrás vuelve a caer en `/login`. Asignar `window.location.href` provoca una recarga completa y además agrega una entrada. `navigate(-1)` regresa a donde sea que viniera el usuario, que puede no ser la página que pidió. `from` normalmente viene del guard que redirigió al login: `<Navigate to="/login" replace state={{ from: location }} />`, y se lee con `useLocation().state`.',
    hint: 'Imagina la pila del historial del navegador después de la redirección, y qué hace con ella el botón Atrás.',
  },
  'react-router-protected-routes': {
    prompt: 'Diseña la autenticación y el acceso basado en roles para una app con React Router que tiene un área pública de marketing, un área de la app para usuarios con sesión iniciada y una sección de administración. Cubre dónde viven las verificaciones, cómo se comportan las redirecciones y qué es lo que el guard del lado del cliente **no** protege.',
    modelAnswer: 'Agrupo las rutas bajo layout routes: un layout público, un layout autenticado y un layout de admin anidado dentro de este, cada uno renderizando un `<Outlet />`. Con un data router, la verificación va en el `middleware` de la layout route (una propiedad estable de la ruta desde React Router 7.9 que no necesita flag en un data router; en v7 el Framework Mode la habilita con `future.v8_middleware`, y v8 siempre la habilita): si no hay sesión, `throw redirect("/login?from=" + encodeURIComponent(path))`, y si el rol es incorrecto, lanza una respuesta 403 que maneja el `errorElement` de la ruta. El middleware se ejecuta antes que cualquier loader, así que una sola verificación cubre todas las rutas hijas y la UI protegida nunca aparece por un instante. Un redirect lanzado solo desde el loader del padre no alcanza, porque los loaders coincidentes se ejecutan en paralelo y los loaders hijos se ejecutarían igual. Sin un data router, un componente de layout `<RequireAuth>` muestra un spinner mientras la verificación de la sesión está pendiente y luego renderiza `<Navigate to="/login" replace state={{ from: location }} />` si no hay sesión. Después del login navego a `from` con `replace`, siguiéndolo solo si es una ruta del mismo origen (sin open redirect), para que Atrás no regrese al formulario. Las rutas de admin se dividen con code splitting usando `lazy` para que el bundle de admin no se envíe a todos. Lo más importante: los guards del cliente son UX, no seguridad; cada endpoint de la API debe aplicar la autenticación y la autorización en el servidor, porque cualquiera puede llamar a la API o modificar el JavaScript.',
    rubric: [
      'Usa layout routes anidadas con `<Outlet />` para que una sola verificación cubra un subárbol',
      'Pone la verificación en el middleware de la layout route (o en cada loader, sabiendo que los loaders coincidentes se ejecutan en paralelo) o en un componente guard con `<Navigate replace>`, y conserva la ubicación original',
      'Maneja el estado de carga y evita que el contenido protegido aparezca por un instante',
      'Deja claro que el servidor debe aplicar la autorización; los guards del cliente son solo UX',
    ],
    explanation: 'La respuesta trampa es "envolver cada página en `if (!user) return <Navigate />`": duplica verificaciones, muestra contenido por un instante e implica que el cliente es una frontera de seguridad.\n\n**Dilo en voz alta:** "Protejo subárboles completos con una layout route y verifico la autenticación en su middleware para que nada se cargue ni se renderice antes de la decisión, pero lo trato como UX; la API aplica la autorización en cada petición."',
    hint: 'Cubre dónde puede ir un solo guard para todo un subárbol, cómo el redirect recuerda la página de destino y por qué el servidor igual debe autorizar cada request.',
  },
};
