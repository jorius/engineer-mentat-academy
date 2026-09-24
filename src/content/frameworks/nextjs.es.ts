// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  'nextjs-server-component-uses-state': {
    prompt:
      "```tsx\n// app/products/[id]/like-button.tsx\nimport { useState } from 'react';\n\nexport function LikeButton() {\n  const [liked, setLiked] = useState(false);\n  return <button onClick={() => setLiked(!liked)}>{liked ? 'Liked' : 'Like'}</button>;\n}\n```\n`app/products/[id]/page.tsx` renderiza `<LikeButton />` y el build falla indicando que `useState` solo funciona en un Client Component. ¿Cuál es la solución correcta?",
    options: {
      a: "Agrega `'use client'` al inicio de `app/layout.tsx` para que toda la app se ejecute en el cliente",
      b: "Agrega `'use client'` al inicio de `like-button.tsx` y mantén la página como Server Component",
      c: 'Mueve el archivo a una carpeta `components/client/`; Next.js infiere los client components a partir de la ruta',
      d: 'Reemplaza `useState` por `useRef`, que sí está permitido en los Server Components',
    },
    explanation:
      "En el App Router, todo componente es un **Server Component** por defecto: se ejecuta solo en el servidor y no envía JavaScript, así que no puede usar estado, efectos, event handlers ni APIs del navegador. `'use client'` marca una **frontera**: ese módulo y todo lo que importa pasan a formar parte del bundle del cliente. Coloca la frontera lo más abajo posible (lo más cerca de las hojas). Marcar `app/layout.tsx` ni siquiera arreglaría este build: el router le pasa cada página a su layout como `children`, así que `page.tsx` sigue siendo un Server Component y su import de `LikeButton` sigue fallando; solo convertiría el propio layout (y todo lo que importa) en código cliente y le impediría exportar `metadata`. Los hooks con estado o efectos (`useState`, `useReducer`, `useEffect`, `useRef`, `useContext`) no están disponibles en los Server Components; solo se permiten algunos sin estado, como `use`, `useId` y `useMemo`.",
    hint:
      'Recuerda cómo decide Next.js que un componente es un Client Component, y hasta dónde llega esa decisión.',
  },
  'nextjs-route-handler-basics': {
    prompt: 'En el App Router, ¿cómo expones `GET /api/users` para que devuelva JSON?',
    options: {
      a: 'Crea `app/api/users/route.ts` que exporte un handler por defecto:\n\n```ts\nexport default function handler(req, res) {\n  res.json(users);\n}\n```',
      b: 'Crea `app/api/users/route.ts` que exporte una función con nombre `GET` que devuelva un `Response` (por ejemplo `Response.json(users)`)',
      c: 'Crea `app/api/users/page.tsx` que devuelva el objeto JSON en lugar de JSX',
      d: 'Crea `app/api/users.ts` con un export default; los archivos bajo `app/api` son rutas de API automáticamente',
    },
    explanation:
      "Los Route Handlers viven en un archivo `route.ts` dentro del directorio `app` y exportan una función por método HTTP (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`). Usan las APIs Web `Request`/`Response` (y los helpers `NextRequest`/`NextResponse`), no los `req`/`res` de Node. El export default `handler(req, res)` es la ruta de API del **Pages Router** en `pages/api`. Un segmento no puede contener a la vez `route.ts` y `page.tsx`. En Next.js 15, los handlers `GET` **no** se cachean por defecto; actívalo con `export const dynamic = 'force-static'`. El nombre de carpeta `api/` es una convención, no un requisito.",
    hint:
      'Recuerda la convención de archivos del App Router para endpoints HTTP, y qué reciben y devuelven sus handlers.',
  },
  'nextjs-client-boundary-rules': {
    prompt: "¿Qué afirmaciones sobre la frontera `'use client'` en el App Router son verdaderas? Selecciona todas las que apliquen.",
    options: {
      a: "`'use client'` marca una frontera de módulo: ese archivo y todos los módulos que importa se incluyen en el bundle del navegador",
      b: 'Los Client Components se renderizan solo en el navegador; nunca se renderizan a HTML en el servidor',
      c: 'Un Server Component se puede pasar a un Client Component como `children` (u otra prop) y sigue siendo un Server Component',
      d: 'Puedes pasarle cualquier prop a un Client Component, incluida una función callback definida en el Server Component padre',
      e: "Cada archivo de componente renderizado dentro de un Client Component necesita su propia directiva `'use client'`",
    },
    explanation:
      "Los Client Components igual se **prerenderizan a HTML en el servidor** y luego se hidratan, así que `'use client'` significa \"esto también se envía al navegador y se ejecuta ahí\", no \"solo en el navegador\". Todo lo que importa un módulo cliente ya es código cliente, así que los archivos anidados no necesitan la directiva. Las props que cruzan la frontera de servidor a cliente deben ser **serializables** por React: los datos planos, Dates, Maps, promesas y JSX están bien, pero las funciones comunes no. La excepción es una **Server Action** (`'use server'`), que cruza como una referencia. El patrón de composición (`<ClientShell><ServerList /></ClientShell>`) es la forma de mantener wrappers interactivos sin arrastrar hijos cargados de datos al bundle. Usa el paquete `server-only` para que un import accidental de código de servidor desde el cliente haga fallar el build.",
    hint:
      "Recuerda dónde se renderizan los Client Components en la primera carga, qué puede cruzar la frontera de servidor a cliente como props y hasta dónde llega una directiva `'use client'` a través de los imports.",
  },
  'nextjs-dynamic-api-opts-out-of-static': {
    prompt:
      "```tsx\n// app/products/page.tsx (Next.js 15)\nimport { cookies } from 'next/headers';\n\nexport default async function ProductsPage() {\n  const currency = (await cookies()).get('currency')?.value ?? 'USD';\n  const products = await getProducts(); // same for every user\n  return <ProductGrid products={products} currency={currency} />;\n}\n```\nAntes, esta página se prerenderizaba de forma estática en tiempo de build. Después de agregar la lectura de `cookies()`, `next build` la reporta como **dinámica**. ¿Por qué?",
    options: {
      a: '`cookies()` solo está disponible en Client Components, así que Next.js recurre a renderizar en el cliente',
      b: 'Todo Server Component `async` se renderiza de forma dinámica',
      c: '`cookies()` es una API de tiempo de petición (Dynamic API); su valor no se puede conocer en tiempo de build, así que toda la ruta pasa a renderizarse en el servidor en cada petición',
      d: 'A la página le falta `generateStaticParams`, que el renderizado estático requiere',
    },
    explanation:
      "`cookies()`, `headers()`, `draftMode()`, `connection()` y la prop de página `searchParams` dependen de la petición entrante. Usar cualquiera de ellas (o `fetch` con `cache: 'no-store'`, o `export const dynamic = 'force-dynamic'`) hace que la ruta se renderice en cada petición. En Next.js 15 estas APIs son **async** (`await cookies()`; `params` y `searchParams` son promesas), y el acceso síncrono solo funciona mediante un shim de compatibilidad temporal que registra una advertencia. Para mantener estática la página, convierte la moneda en el cliente. Con Partial Prerendering (experimental en Next.js 15) puedes en cambio leer la cookie dentro de un componente pequeño envuelto en `<Suspense>`, que se convierte en un hueco dinámico dentro de un shell estático; sin PPR, `<Suspense>` solo hace streaming y toda la ruta se sigue renderizando en cada petición. Los componentes `async` por sí solos se pueden prerenderizar sin problema, y `generateStaticParams` solo hace falta para segmentos dinámicos como `[id]`.",
    hint:
      'Recuerda qué hace que Next.js renderice una ruta en cada petición en vez de en el build.',
  },
  'nextjs-isr-stale-while-revalidate': {
    prompt:
      "Modela **ISR** (`export const revalidate = N`) como una función pura. La versión `1` de una página se genera en el instante `0`. Para cada instante de petición (en segundos, en orden ascendente), devuelve el número de versión que recibe esa petición.\n\nReglas (coinciden con el comportamiento stale-while-revalidate de Next.js):\n- Una petición **nunca se bloquea**: siempre recibe la versión que está en caché en ese momento.\n- Si la versión en caché tiene **estrictamente más** de `revalidate` segundos de antigüedad y no hay ninguna regeneración en curso, la petición dispara **una** regeneración en segundo plano que termina `regenSeconds` después.\n- Mientras hay una regeneración en curso, las demás peticiones reciben la versión anterior y no inician otra.\n- Una regeneración que ya terminó en el momento de una petición (`finishedAt <= t`) reemplaza la caché con la siguiente versión, cuya antigüedad se mide desde `finishedAt`.",
    explanation:
      "ISR es **stale-while-revalidate**, no un cron job. `revalidate = 60` no reconstruye la página cada minuto. Significa que la primera petición que llega **después** de que la página tiene más de 60 s de antigüedad sigue recibiendo la página obsoleta y dispara una regeneración en segundo plano. Solo las peticiones posteriores ven la nueva versión. Sin tráfico, no se regenera nada (el test de los 1000 segundos). Si la regeneración lanza un error, Next.js sigue sirviendo la última versión buena. Compara los modos: **SSG** genera una sola vez en `next build`; **ISR** es SSG más actualización en segundo plano (por tiempo con `revalidate`, o bajo demanda con `revalidatePath`/`revalidateTag`); **SSR** (renderizado dinámico) renderiza en cada petición; **CSR** obtiene los datos en el navegador después de la hidratación.",
    hint:
      'Lleva el estado de la caché de una petición a la siguiente, y vuelve a leer las reglas sobre el orden en que ocurren las cosas en un mismo instante de petición.',
  },
  'nextjs-caching-defaults-15': {
    prompt: '¿Qué afirmaciones sobre el caching y la revalidación en el App Router de **Next.js 15** son verdaderas? Selecciona todas las que apliquen.',
    options: {
      a: "Los resultados de `fetch` ya no se guardan en el Data Cache por defecto; actívalo por petición con la opción `cache: 'force-cache'` o `next.revalidate` de `fetch`",
      b: 'Una ruta que no usa Dynamic APIs se sigue prerenderizando en tiempo de build, así que un `fetch` sin opción de caché dentro de ella se ejecuta una vez durante `next build` y su resultado queda congelado en la salida estática hasta la revalidación o el siguiente deploy',
      c: "Llamar a `revalidateTag('products')` desde una Server Action o un Route Handler invalida todos los `fetch` en caché etiquetados con `products` (mediante su opción `next.tags`), en todas las rutas que los usaron",
      d: 'Puedes llamar a `revalidatePath` directamente desde un event handler de un Client Component para refrescar los datos del servidor',
      e: '`export const revalidate = 60` renderiza la página en cada petición y agrega una cabecera `Cache-Control` de CDN de 60 segundos',
    },
    explanation:
      "Next.js 14 cacheaba `fetch` por defecto, lo que sorprendió a muchos equipos. Next.js 15 invirtió los valores por defecto: no hay Data Cache para `fetch` ni caché para los Route Handlers `GET`, y el Router Cache del cliente ya no reutiliza segmentos de página (`staleTime` 0 para páginas). La trampa es la afirmación sobre el prerenderizado en build: \"sin caché\" **no** significa \"fresco en cada petición\". Una ruta sin APIs de tiempo de petición se sigue prerenderizando de forma estática, así que los datos quedan fijados en tiempo de build. Agrega una Dynamic API, `cache: 'no-store'`, `connection()` o `dynamic = 'force-dynamic'` cuando de verdad necesites datos por petición. `revalidatePath`/`revalidateTag` son solo de servidor; el cliente llama a una Server Action que los llama (y `router.refresh()` solo vuelve a obtener el payload RSC de la ruta actual). `revalidate = 60` es ISR (stale-while-revalidate), no renderizado por petición. Los Cache Components de Next.js 16 (`'use cache'`, `cacheLife`, `cacheTag`) vuelven a hacer el caching explícitamente opt-in, así que en una entrevista menciona la versión que estás describiendo.\n\n**Dilo en voz alta:** \"En Next 15, un fetch sin opción de caché no se cachea, pero eso no vuelve dinámica la ruta. Si una ruta no tiene APIs de tiempo de petición, se sigue prerenderizando en tiempo de build, así que decido entre estático y dinámico por ruta e invalido con tags desde Server Actions.\"",
    hint:
      'Recuerda qué valores por defecto de caché cambiaron entre Next.js 14 y 15, y qué controla realmente cada API u opción.',
  },
  'nextjs-server-action-authorization': {
    prompt:
      "```tsx\n// app/posts/actions.ts\n'use server';\nexport async function deletePost(id: string) {\n  await db.post.delete({ where: { id } });\n  revalidatePath('/posts');\n}\n\n// app/posts/page.tsx (Server Component)\nconst session = await auth();\nreturn posts.map((p) => (\n  <article key={p.id}>\n    {p.title}\n    {session?.user.role === 'admin' && <DeleteButton action={deletePost} id={p.id} />}\n  </article>\n));\n```\nUna revisión de seguridad marca `deletePost` como crítico. ¿Por qué?",
    options: {
      a: 'Es seguro: una Server Action solo la pueden invocar los usuarios cuya página renderizada la contenía',
      b: 'Una Server Action es un endpoint POST público: cualquiera que obtenga su action id puede llamarla con argumentos arbitrarios. Ocultar el botón no es autorización, así que la propia action debe verificar la sesión, el rol o la propiedad del recurso, y validar `id`',
      c: 'Las Server Actions no tienen protección CSRF, así que la única solución es mover la lógica a un Route Handler',
      d: 'Las Server Actions no pueden leer cookies, así que `auth()` siempre sería `null` dentro de la action',
    },
    explanation:
      "Toda función `'use server'` exportada se convierte en un endpoint accesible por red. La página solo decide si **renderiza un botón**; nada impide que alguien que no es admin (o un script) envíe el POST que invoca la action. Trata cada Server Action como una ruta de API pública: autentica (`await auth()`), autoriza (rol o propiedad de ese post en concreto), valida la entrada con un esquema (por ejemplo zod) y aplica rate limiting donde importe. Next.js sí mitiga el CSRF (las actions son solo POST y la cabecera `Origin` se compara con `Host`), y en Next.js 15 los action ids no se pueden adivinar y las actions sin usar se eliminan del build. Eso es defensa en profundidad, **no** control de acceso. El middleware tampoco es una verificación suficiente; haz la autorización cerca de los datos (en una capa de acceso a datos).\n\n**Dilo en voz alta:** \"Una Server Action es un endpoint POST público con una convención de llamada más cómoda, así que la autenticación, la autorización y la validación de la entrada van dentro de la action, no en el componente que renderiza el botón.\"",
    hint:
      "Pregúntate quién puede llegar realmente a una función `'use server'` por la red, y qué puede enviarle.",
  },
  'nextjs-when-not-to-use': {
    prompt:
      'Tu equipo usa Next.js por defecto en cada front end nuevo. Da casos concretos en los que **no** elegirías Next.js, qué elegirías en su lugar y qué trade-offs sopesas.',
    modelAnswer:
      "Next.js compensa cuando necesitas renderizado en el servidor por SEO o por rendimiento en la primera carga, contenido que mezcla datos estáticos y dinámicos, y un solo desplegable que contenga tanto la UI como un BFF delgado. No lo usaría para un dashboard interno autenticado o una SPA de back-office sin necesidades de SEO. Ahí, una SPA con Vite + React Router (o TanStack Router) servida desde S3/CloudFront es más simple, más barata y no tiene un servidor que operar ni un modelo de caching que aprender. Para un sitio mayormente estático de contenido o documentación, Astro o un generador estático envía menos JavaScript con menos maquinaria. No metería un backend real dentro de Next: los jobs de larga duración, los WebSockets, el trabajo pesado de CPU, los consumidores de colas y las APIs públicas para múltiples clientes van en un servicio dedicado (NestJS, Express o Fastify en ECS o Lambda), con Next a lo sumo como BFF. También sopeso la operación. Funcionalidades como ISR, la optimización de imágenes y el middleware funcionan mejor en Vercel, mientras que el self-hosting o AWS requieren `output: 'standalone'`, un cache handler compartido entre réplicas o adaptadores como OpenNext. La semántica de caching del App Router cambió entre las versiones 13, 14, 15 y 16, así que la familiaridad del equipo y el costo de actualizar cuentan. La decisión depende de las necesidades de renderizado, de dónde vive la lógica de backend, de las restricciones de hosting y de las habilidades del equipo, no de \"React significa Next\".",
    rubric: [
      'Menciona una SPA/dashboard autenticado sin SEO como caso para una SPA simple con Vite',
      'Separa las responsabilidades de backend (jobs de larga duración, WebSockets, APIs públicas para múltiples clientes) en un servicio dedicado',
      'Menciona sitios estáticos o de contenido donde Astro o un generador estático es más liviano',
      'Discute el hosting y el costo operativo: funcionalidades optimizadas para Vercel, caches compartidas entre réplicas al hacer self-hosting, OpenNext/standalone',
      'Plantea la decisión en torno a los requisitos de renderizado y la familiaridad del equipo con el modelo de caching',
    ],
    explanation:
      "El entrevistador quiere oír que eliges un framework a partir de los requisitos, no por costumbre. Las mejores respuestas atan cada \"no\" a un costo específico: un servidor que no necesitabas, un modelo de caching que el equipo tiene que aprender, lógica de negocio atrapada en el deploy de la UI o funcionalidades que se comportan distinto fuera de Vercel.\n\n**Dilo en voz alta:** \"Next.js justifica su complejidad cuando necesito renderizado en el servidor o SEO. Para un dashboard autenticado entregaría una SPA con Vite, y el trabajo real de backend va en un servicio aparte, con Next a lo sumo como BFF.\"",
    hint:
      'Ata cada "no" a un costo concreto: un servidor que no necesitas, el modelo de caché, lógica acoplada al deploy de la UI o diferencias de hosting fuera de Vercel; nombra una alternativa para cada caso.',
  },
};
