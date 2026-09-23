// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  'react-lifecycle-mount-unmount-effect': {
    prompt: 'Un componente de clase se suscribe a un store en `componentDidMount` y cancela la suscripción en `componentWillUnmount`. ¿Cuál es el código equivalente en un componente de función?',
    options: {
      c: '`useEffect(() => { subscribe(); return () => unsubscribe(); })` (sin arreglo de dependencias)',
      d: '`useMemo(() => subscribe(), [])` más `useEffect(() => unsubscribe, [])`',
    },
    explanation: 'Un efecto con `[]` se ejecuta después del primer commit, y la función que devuelve es el cleanup que React llama al desmontar. Sin el arreglo (c), el efecto y su cleanup se ejecutan después de **cada** render, así que te vuelves a suscribir en cada render. (b) cancela la suscripción de inmediato. (d) pone un efecto secundario en `useMemo`, que se ejecuta durante el render y puede ejecutarse más de una vez o descartarse.\n\nEl mejor modelo mental no es "ciclo de vida" sino "sincronizar con un sistema externo": si la suscripción dependiera de una prop como `storeId`, iría en el arreglo de dependencias, y ese único efecto también reemplazaría a `componentDidUpdate`.',
  },
  'react-strict-mode-effect-twice': {
    prompt: '```jsx\nfunction Chat({ roomId }) {\n  useEffect(() => {\n    console.log(\'connect \' + roomId);\n    return () => console.log(\'disconnect \' + roomId);\n  }, [roomId]);\n  return null;\n}\n\n// development build, React 18+\nroot.render(<StrictMode><Chat roomId="a" /></StrictMode>);\n```\n¿Qué se imprime justo después del primer montaje?',
    explanation: 'En desarrollo, `StrictMode` monta el componente, ejecuta sus efectos, simula un desmontaje (ejecutando los cleanups) y lo vuelve a montar. Existe para exponer efectos cuyo cleanup no deshace el setup. Si faltara el cleanup, terminarías con dos conexiones abiertas, que es justo el bug que intenta mostrarte. En producción el efecto se ejecuta una sola vez.\n\nLa corrección equivocada es una bandera con `useRef` que se salta la segunda ejecución; la correcta es un cleanup simétrico.',
  },
  'react-error-boundary-scope': {
    prompt: 'Un componente de clase `ErrorBoundary` (con `static getDerivedStateFromError` y `componentDidCatch`) envuelve a `<Dashboard />`. ¿Qué errores atrapa? Selecciona todas las que apliquen.',
    options: {
      a: 'Un error lanzado durante el render de un componente profundo dentro de `Dashboard`',
      b: 'Un error lanzado en `componentDidMount` de un componente de clase dentro de `Dashboard`',
      c: 'Un error lanzado dentro de un handler `onClick` en `Dashboard`',
      d: 'Una promesa rechazada de `fetch(...).then(...)` iniciada en un efecto',
      e: 'Un error lanzado en el propio `render` del `ErrorBoundary`',
    },
    explanation: 'Los error boundaries atrapan errores lanzados mientras React renderiza, en los métodos de ciclo de vida y en los constructores del árbol **debajo** de ellos. No atrapan errores en event handlers (usa `try/catch` y guarda el error en el state), en código asíncrono (una promesa rechazada ocurre fuera del render de React) ni en el propio boundary (de eso se encarga el siguiente boundary hacia arriba).\n\nPara enviar un error asíncrono a un boundary, llama a `setState(() => { throw error; })` o usa `showBoundary` de `react-error-boundary`. Todavía no existe un hook equivalente a `getDerivedStateFromError`, y esa es una de las razones por las que los componentes de clase siguen apareciendo en codebases modernos.',
  },
  'react-hooks-rules-violations': {
    prompt: '¿Cuáles de estos rompen las Reglas de los Hooks? Selecciona todas las que apliquen.',
    options: {
      a: '`if (!user) return null;` colocado antes de `const [tab, setTab] = useState("a");`',
      b: 'Llamar a `useState` dentro de un bucle `for` sobre una prop `fields`',
      c: 'Llamar a `useContext(Theme)` dentro de un custom hook `useThemeColor()` que el componente llama en su nivel superior',
      d: 'Llamar a `useEffect` dentro de un helper común `function track() {}` que se ejecuta desde un handler `onClick`',
      e: 'Llamar a `useMemo` en el nivel superior después de dos llamadas a `useState`',
    },
    explanation: 'React identifica cada hook por su **orden de llamada** dentro de un render, así que cada render debe llamar a los mismos hooks en el mismo orden, y solo desde componentes o custom hooks. Un return temprano antes de un hook (a) vuelve condicional al hook. Un bucle (b) cambia la cantidad cuando `fields` cambia. Un hook en un helper de un event handler (d) se ejecuta completamente fuera del render. Los custom hooks (c) son solo funciones cuyo nombre empieza con `use` y que llaman hooks en su propio nivel superior, que es la forma aprobada de compartir lógica de hooks.\n\n(El `use()` de React 19 es la única excepción que puede llamarse de forma condicional.)',
  },
  'react-usestate-batched-increments': {
    prompt: '```jsx\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  function handleClick() {\n    setCount(count + 1);\n    setCount(count + 1);\n    setCount(count + 1);\n  }\n  return <button onClick={handleClick}>{count}</button>;\n}\n```\n¿Qué muestra el botón después de un clic?',
    options: {
      c: '0, porque las actualizaciones se agrupan en batch y se descartan',
      d: '3 en desarrollo y 1 en producción',
    },
    explanation: '`count` es una instantánea: en este render vale `0`, así que las tres llamadas encolan "poner en 1". React las agrupa en un solo re-render. Para construir sobre el valor anterior, pasa un updater: `setCount((c) => c + 1)` tres veces da 3, porque cada updater recibe el resultado del anterior.',
  },
  'react-usereducer-cart-reducer': {
    prompt: 'Implementa `cartReducer(state, action)` como un reducer **puro** para `useReducer`.\n\n- `add` agrega una línea con `qty: 1`, o incrementa `qty` si el id ya está en el carrito.\n- `remove` elimina la línea.\n- `setQty` fija la cantidad; una cantidad de 0 o menos elimina la línea.\n- `clear` vacía el carrito.\n- Cualquier otra acción devuelve el **mismo** state.\n\n`solution(actions)` reproduce las acciones desde un carrito vacío y devuelve **cada** state intermedio, así que mutar un state anterior aparece como un historial incorrecto.',
    explanation: 'Un reducer se ejecuta durante el render, así que debe ser puro: mismo `(state, action)` de entrada, mismo state de salida, sin mutaciones. `existing.qty++` seguido de `return { ...state }` parece inmutable, pero muta el objeto de línea al que todavía apunta el state anterior; por eso el test registra todo el historial.\n\nPor qué `useReducer` en lugar de varias llamadas a `useState`: el *qué pasó* (acciones desde los event handlers) se separa del *cómo cambia el state* (el reducer), el reducer se puede probar con tests unitarios sin ningún componente, y una sola acción como `clear` puede describir una interacción del usuario aunque cambie muchos campos. Devolver la misma referencia para acciones desconocidas le permite a React evitar el re-render.',
  },
  'react-fetch-effect-race': {
    prompt: '```jsx\nfunction Results({ query }) {\n  const [items, setItems] = useState([]);\n  useEffect(() => {\n    fetch(\'/api/search?q=\' + encodeURIComponent(query))\n      .then((r) => r.json())\n      .then(setItems);\n  }, [query]);\n  return <List items={items} />;\n}\n```\nLos usuarios que escriben rápido a veces ven resultados de una query más vieja que la que está en la caja de búsqueda. Explica el bug, corrígelo y di qué usarías en producción.',
    modelAnswer: 'Cada tecla inicia una petición, y las respuestas pueden llegar fuera de orden: una respuesta lenta para `"re"` puede resolverse después de la respuesta para `"react"` y sobrescribirla. El efecto no tiene cleanup, así que nada marca la petición anterior como obsoleta. Corrígelo creando un `AbortController` en el efecto, pasando `signal` a `fetch` y llamando a `controller.abort()` en el cleanup (ignorando `AbortError` en el catch); una bandera `ignore` que se activa en el cleanup también funciona cuando la petición no se puede cancelar. De paso, revisa `r.ok`, lleva el estado de carga y de error, y aplica debounce a la query para no disparar una petición por tecla. En producción usaría React Query, SWR o RTK Query, que dan caché, deduplicación de peticiones, cancelación, reintentos y stale-while-revalidate, o un loader del router que se encargue del fetch.',
    rubric: [
      'Identifica las respuestas fuera de orden (race condition), no "React es lento"',
      'Usa el cleanup del efecto con `AbortController` o una bandera ignore',
      'Maneja `AbortError`, las respuestas no OK y los estados de carga/error',
      'Menciona el debounce y una librería de data fetching (React Query/SWR/RTK Query) como la respuesta para producción',
    ],
    explanation: 'Cada ejecución del efecto captura su propio `query`. El cleanup se ejecuta antes de la siguiente ejecución del efecto, y ese es el punto para invalidar la petición anterior.\n\n**Dilo en voz alta:** "Los efectos que hacen fetch necesitan un cleanup que cancele o ignore la petición anterior; si no, gana la respuesta más lenta. En producción no escribiría esto a mano; React Query me da cancelación, caché y deduplicación gratis."',
  },
  'react-stale-closure-interval': {
    prompt: '```jsx\nfunction Ticker() {\n  const [count, setCount] = useState(0);\n  useEffect(() => {\n    const id = setInterval(() => setCount(count + 1), 1000);\n    return () => clearInterval(id);\n  }, []);\n  return <p>{count}</p>;\n}\n```\n¿Qué muestra el componente después de 5 segundos?',
    options: {
      d: 'Sigue subiendo, pero se salta un valor de cada dos',
    },
    explanation: 'El efecto se ejecuta una vez, así que el callback del intervalo encierra el `count` del primer render, que es `0`. Cada tick llama a `setCount(1)`; después del primero, React evita el render porque el valor no cambió. Es el clásico stale closure causado por mentir sobre las dependencias (la regla del linter marcaría `count`).\n\nLa mejor corrección es la forma updater `setCount((c) => c + 1)`, que saca `count` del efecto por completo y mantiene honesto el `[]`. Agregar `count` a las dependencias también funciona, pero destruye y recrea el intervalo cada segundo.',
  },
  'react-exhaustive-deps-infinite-loop': {
    prompt: '```jsx\nfunction Profile({ userId }) {\n  const [user, setUser] = useState(null);\n  const options = { include: [\'teams\'] };\n  async function load() {\n    setUser(await api.getUser(userId, options));\n  }\n  useEffect(() => {\n    load();\n  }, [load]);\n  // ...\n}\n```\nLa regla de lint `exhaustive-deps` pidió `load` en el arreglo. Ahora el componente hace fetch en un bucle infinito. Explica por qué y enumera tus correcciones en orden de preferencia.',
    modelAnswer: 'Las dependencias se comparan con `Object.is`. `load` (y `options`) se recrean en cada render, así que el efecto ve una dependencia nueva después de cada render; hace fetch, `setUser` dispara un render, que crea un `load` nuevo, y el bucle nunca termina. Primera opción: mover `load` y `options` dentro del efecto para que la única dependencia real sea `userId`. Si `options` es constante, sácalo fuera del componente. Si la función se tiene que compartir, envuélvela en `useCallback` con `[userId]`. Para lógica que debe leer las props más recientes sin volver a disparar el efecto, usa `useEffectEvent`. Nunca silencies la regla de lint: mentir sobre las dependencias cambia un bucle infinito por stale closures. También agregaría una protección abort/ignore, o movería el fetch a React Query.',
    rubric: [
      'Explica la identidad referencial: función/objeto nuevo en cada render, comparado con `Object.is`',
      'Prefiere mover la función y el objeto dentro del efecto (las deps quedan en `[userId]`)',
      'Conoce `useCallback`/sacar la constante del componente/`useEffectEvent` como alternativas y cuándo conviene cada una',
      'Se niega a desactivar la regla de lint y explica el riesgo de stale closure',
    ],
    explanation: 'Los arreglos de dependencias no son una lista de "cuándo ejecutar"; son una declaración de cada valor reactivo que lee el efecto. Quita dependencias cambiando el código, no el arreglo.\n\n**Dilo en voz alta:** "Las dependencias se comparan por referencia, así que las funciones y objetos creados durante el render invalidan el efecto cada vez. Quito la dependencia moviéndola dentro del efecto o fuera del componente, no mintiéndole al linter."',
  },
  'react-debounced-value-logic': {
    prompt: '`useDebouncedValue(value, delay)` programa un `setTimeout` en un efecto con dependencias `[value, delay]` y lo limpia en el cleanup. Modélalo como una función pura.\n\n`changes` es una línea de tiempo de `{ t, value }` (milisegundos, ordenada por `t`). Devuelve las actualizaciones `{ t, value }` que emitiría el hook. Cada cambio programa una actualización en `t + delay`; el cambio **siguiente** ejecuta el cleanup y la cancela, a menos que el siguiente cambio llegue en `t + delay` o después (el timer ya se disparó).',
    explanation: 'El hook en sí:\n\n```ts\nfunction useDebouncedValue<T>(value: T, delay = 300): T {\n  const [debounced, setDebounced] = useState(value);\n  useEffect(() => {\n    const id = setTimeout(() => setDebounced(value), delay);\n    return () => clearTimeout(id);\n  }, [value, delay]);\n  return debounced;\n}\n```\n\nEl debounce sale por completo del arreglo de dependencias más el cleanup: cuando `value` cambia, React ejecuta el cleanup anterior (cancelando el timer pendiente) antes de volver a ejecutar el efecto. Un valor solo sobrevive si nada cambia durante `delay` ms. Combínalo con un fetch que dependa del valor con debounce para que la red vea una petición por pausa, no una por tecla.',
  },
  'react-rerender-triggers': {
    prompt: '¿Cuáles de estos hacen que `Child` (sin envolver en `React.memo`) vuelva a renderizar? Selecciona todas las que apliquen.',
    options: {
      a: '`Child` llama a su propio setter de state con un valor distinto',
      b: 'El padre vuelve a renderizar, aunque las props que le pasa a `Child` sean idénticas',
      c: 'Cambia un valor de context que `Child` lee con `useContext`',
      d: '`Child` asigna un valor nuevo a `someRef.current`',
      e: 'El padre muta en el lugar una prop de tipo objeto (`user.name = "x"`) sin actualizar ningún state',
    },
    explanation: 'Un componente vuelve a renderizar cuando (1) cambia su propio state, (2) su padre vuelve a renderizar (por defecto los hijos se renderizan junto con su padre, cambien o no las props) o (3) cambia un context que consume. Los refs están fuera de ese sistema a propósito: escribir `ref.current` nunca programa un render. Mutar una prop en el lugar tampoco programa un render; React solo se entera de los cambios a través de los setters de state, y la mutación además va a romper cualquier comparación de `memo` más adelante.\n\nUn render no es una actualización del DOM: React vuelve a ejecutar el componente, compara el resultado y hace commit solo de lo que cambió.',
  },
  'react-memo-inline-callback': {
    prompt: '```jsx\nconst Row = React.memo(function Row({ ticket, onSelect }) {\n  return <tr onClick={() => onSelect(ticket.id)}>{/* ... */}</tr>;\n});\n\nfunction List({ tickets }) {\n  const [selected, setSelected] = useState(null);\n  return tickets.map((t) => (\n    <Row key={t.id} ticket={t} onSelect={(id) => setSelected(id)} />\n  ));\n}\n```\nCuando cambia `selected`, ¿qué filas vuelven a renderizar?',
    options: {
      a: 'Solo la fila en la que se hizo clic, porque `React.memo` se salta las demás',
      b: 'Ninguna; `selected` no se le pasa a ninguna fila',
      c: 'Todas las filas, porque `onSelect` es una función nueva en cada render de `List`',
      d: 'Todas las filas, porque `React.memo` compara las props en profundidad y `tickets` cambió',
    },
    explanation: '`React.memo` hace una comparación **superficial** de las props. La arrow function inline es una función nueva en cada render de `List`, así que `onSelect` nunca es igual y memo nunca se salta nada; pagas por la comparación y no obtienes nada. Corrección: pasa un handler estable, por ejemplo `const handleSelect = useCallback((id) => setSelected(id), [])`, o pasa `setSelected` directamente (los setters de state ya son estables). La misma trampa aplica a objetos inline como `style={{...}}`. El React Compiler, donde está habilitado, inserta esta memoización automáticamente.',
  },
  'react-keys-index-state-fix': {
    prompt: 'React asocia el state de cada fila (aquí, un borrador escrito en el input de cada fila) a las filas por `key`. `solution(prev, drafts, next)` simula eso: guarda el borrador de cada fila anterior bajo su key y devuelve el borrador con el que termina cada fila de `next`. La lista actualmente usa el índice del arreglo como key, así que borrar o insertar una fila hace que los borradores salten a la fila equivocada. Corrige `keyFor` para que los borradores sigan a sus filas.',
    explanation: 'Durante la reconciliación, React empareja los hijos viejos y nuevos por `key`; una key que coincide conserva la instancia del componente, su state y su nodo del DOM. Con keys por índice, eliminar la fila 0 hace que la antigua fila 1 "se convierta" en la key 0, así que su state cae en el elemento equivocado. Usa un id estable y único que venga de los datos. Las keys por índice solo son aceptables en listas estáticas que nunca se filtran, ordenan ni editan y cuyas filas no tienen state. Nunca generes keys durante el render (`Math.random()`, `crypto.randomUUID()`): cada render volvería a montar cada fila. Si los datos no tienen id, asígnale uno al elemento cuando se **crea**.',
  },
  'react-derived-state-anti-pattern': {
    prompt: 'Estás revisando este pull request. ¿Qué está mal y qué le pides al autor que escriba en su lugar?\n```jsx\nfunction TicketList({ tickets }) {\n  const [query, setQuery] = useState(\'\');\n  const [filtered, setFiltered] = useState(tickets);\n  useEffect(() => {\n    setFiltered(tickets.filter((t) => t.title.includes(query)));\n  }, [tickets, query]);\n  // renders <input> for query and the filtered list\n}\n```',
    modelAnswer: '`filtered` es state derivado: siempre se puede calcular a partir de `tickets` y `query`, así que guardarlo crea una segunda fuente de verdad que hay que mantener sincronizada. El efecto se ejecuta después del paint, así que cada cambio renderiza una vez con datos obsoletos y luego vuelve a renderizar. También es frágil: si olvidas una dependencia, la lista se queda obsoleta sin avisar, y `useState(tickets)` solo usa `tickets` como valor inicial. Reemplaza el state y el efecto con un valor calculado durante el render: `const filtered = tickets.filter(...)`, envuelto en `useMemo(..., [tickets, query])` solo si el filtro es mediblemente costoso. La regla es state mínimo (datos crudos más la intención del usuario) y derivar todo lo demás. El mismo razonamiento aplica a "reiniciar el state cuando cambia una prop": usa una `key` en lugar de un efecto. Copiar una prop al state solo es correcto cuando el usuario edita un borrador a propósito, y en ese caso la prop debería llamarse `initialX`.',
    rubric: [
      'Lo nombra como state derivado/duplicado y señala el problema de la fuente única de verdad',
      'Explica el render extra con datos obsoletos que provoca sincronizar en un efecto',
      'Lo reemplaza con un cálculo durante el render, agregando `useMemo` solo cuando es costoso',
      'Conoce la excepción legítima (un borrador editable inicializado desde una prop) o el patrón de reinicio con `key`',
    ],
    explanation: '"Quizás no necesitas un efecto" es la idea que se evalúa: los efectos son para sincronizar con sistemas fuera de React, no para transformar datos que React ya tiene.\n\n**Dilo en voz alta:** "No guardes lo que puedes calcular. Mantengo en el state los datos crudos y la intención del usuario, derivo el resto durante el render y memoizo solo cuando la derivación es realmente costosa."',
  },
  'react-state-management-choice': {
    prompt: 'Estás diseñando una nueva app de React de tamaño mediano. Tiene: el usuario con sesión iniciada y el tema, un catálogo de productos cargado desde una API, un wizard de checkout de cuatro pasos, filtros de lista que deben sobrevivir a una recarga de la página y poder compartirse, y un tablero de pedidos en vivo que se actualiza varias veces por segundo. ¿Dónde vive cada pieza de state y por qué?',
    modelAnswer: 'Empieza por la colocación: el state vive en el componente más bajo que lo necesita y se sube al padre común más cercano solo cuando los hermanos lo comparten. El usuario y el tema son transversales y cambian poco, así que Context encaja, con un `value` memoizado (o contexts separados para el state y los setters), porque un cambio de context vuelve a renderizar a todos los consumidores. El catálogo es server state: va en React Query, SWR o RTK Query, que lo tratan como una caché con invalidación, deduplicación y refetch, no como client state que copio a un store. El wizard de checkout es state local de varios campos con transiciones, así que un `useReducer` en la raíz del wizard funciona, con el paso actual en la URL si atrás/adelante debe funcionar. Los filtros van en los search params de la URL, lo que los hace compartibles y les permite sobrevivir a las recargas. El tablero en vivo es state global de alta frecuencia: un store externo (Redux Toolkit o Zustand) con selectors, para que cada componente se suscriba solo a la porción que renderiza en lugar de volver a renderizar todo un árbol de context.',
    rubric: [
      'Coloca el state junto a quien lo usa por defecto y lo sube solo lo necesario',
      'Usa Context para valores transversales de baja frecuencia y nombra el costo de "todos los consumidores vuelven a renderizar"',
      'Separa el server state (React Query/SWR/RTK Query) del client state',
      'Pone los filtros compartibles en la URL',
      'Elige un store basado en selectors (Redux Toolkit/Zustand) para state compartido de alta frecuencia',
    ],
    explanation: 'No hay una única respuesta de "librería de state"; los entrevistadores buscan una tabla de decisión basada en quién lee el state, con qué frecuencia cambia y si el servidor es su dueño.\n\n**Dilo en voz alta:** "Elijo dónde vive el state según su dueño y su frecuencia de actualización: primero state local, la URL para state compartible, una caché de servidor para datos del servidor, Context para valores globales poco frecuentes y un store basado en selectors solo para state compartido muy activo."',
  },
  'react-reset-state-with-key': {
    prompt: '`<CommentBox userId={userId} />` guarda un `draft` en `useState`. Cuando la página cambia del usuario 1 al usuario 2, el borrador a medio escribir del usuario 1 sigue en la caja. ¿Cuál es la corrección más limpia?',
    options: {
      a: 'Renderizar `<CommentBox key={userId} userId={userId} />`',
      b: 'Agregar `useEffect(() => setDraft(""), [userId])` dentro de `CommentBox`',
      c: 'Usar `useState(() => loadDraft(userId))`; el inicializador se vuelve a ejecutar cuando cambia `userId`',
      d: 'Envolver `CommentBox` en `React.memo` para que se vuelva a montar cuando cambian sus props',
    },
    explanation: 'React conserva el state del mismo tipo de componente en la misma posición del árbol. Cambiar la `key` le dice a React que es una instancia distinta, así que desmonta la vieja y monta una nueva con state nuevo (incluido el state de cada hijo). El efecto (b) funciona, pero renderiza una vez con el borrador obsoleto y solo reinicia el campo que recordaste. El inicializador lazy (c) se ejecuta solo al montar. `React.memo` (d) nunca vuelve a montar nada; solo se salta renders.',
  },
  'react-controlled-input-no-onchange': {
    prompt: 'Los entrevistadores preguntan sobre data binding. En React, `const [name, setName] = useState("Ada")` y el JSX renderiza `<input value={name} />` sin `onChange`. ¿Qué pasa cuando el usuario escribe?',
    options: {
      a: 'El input y `name` se actualizan los dos (two-way binding)',
      b: 'El input sigue mostrando "Ada", y React advierte que se proporcionó `value` sin `onChange`',
      c: 'El input se actualiza, pero `name` se queda en "Ada"',
      d: 'React lanza un error y desmonta el componente',
    },
    explanation: 'React tiene un flujo de datos **unidireccional**: `value={name}` hace que el input sea controlado, así que en cada render React fuerza el valor del DOM de vuelta a `name`. Las teclas no cambian nada hasta que un `onChange` llama a `setName(e.target.value)`, que es como React hace lo que otros frameworks llaman two-way binding. Para un input no controlado, usa `defaultValue` y lee el valor con un ref o con `FormData` al enviar. Si la intención es que sea de solo lectura, agrega `readOnly` para silenciar la advertencia.',
  },
  'react-large-form-performance': {
    prompt: 'Un formulario de seguros de 60 campos guarda todos los valores en un solo objeto de `useState` en la raíz del formulario, usa inputs controlados y valida el objeto completo en cada cambio. Escribir tiene un retraso de unos 150 ms por tecla en laptops de gama media. Diagnostícalo y describe tu rediseño.',
    modelAnswer: 'Cada tecla actualiza el state en la raíz, así que todo el formulario, los 60 campos, vuelve a renderizar, y encima se ejecuta la validación completa. Lo confirmaría con el React Profiler antes de cambiar nada. Después hay dos direcciones. Una es usar inputs no controlados con React Hook Form: los campos se registran mediante refs, el DOM guarda el valor y solo vuelven a renderizar los campos que se suscriben a un valor o a un error; la validación se ejecuta en blur o en submit con un schema resolver (Zod). La otra, si se queda controlado: dividir el state por sección, memoizar los componentes de campo con `React.memo` y pasar handlers estables (el `dispatch` de un `useReducer` es estable), para que una tecla vuelva a renderizar un solo campo. En cualquier caso, valida por campo en blur, aplica debounce a las validaciones asíncronas como "el email ya está en uso" y pon las vistas previas costosas detrás de `useDeferredValue`. Mantén inputs controlados donde necesites formato instantáneo, como las máscaras.',
    rubric: [
      'Identifica el state en la raíz que provoca re-renders de todo el formulario más la validación en cada cambio',
      'Mide primero (React Profiler) en lugar de adivinar',
      'Propone inputs no controlados / React Hook Form, o dividir el state con campos memoizados y handlers estables',
      'Mueve la validación a blur/submit y aplica debounce a la validación asíncrona',
    ],
    explanation: 'Controlado versus no controlado es una decisión de rendimiento además de una de API: los inputs controlados hacen pasar cada tecla por el state de React.\n\n**Dilo en voz alta:** "El lag en un formulario casi siempre es el alcance del render de una tecla. Lo reduzco, ya sea dejando que el DOM sea dueño del valor con React Hook Form o haciendo que cada tecla vuelva a renderizar un solo campo memoizado, y saco la validación del camino de cada tecla."',
  },
  'react-memoization-trio': {
    prompt: 'Explica `React.memo`, `useCallback` y `useMemo`: qué hace cada uno, cómo funcionan juntos y cuándo son un desperdicio.',
    modelAnswer: '`React.memo(Component)` se salta el re-render de un componente cuando sus props son superficialmente iguales a las de la vez anterior. `useCallback(fn, deps)` mantiene estable la identidad de una función entre renders, y `useMemo(calc, deps)` guarda en caché un valor calculado (una lista filtrada u ordenada, o un objeto que se pasa como prop) hasta que cambian sus dependencias. Funcionan como conjunto: `memo` en un componente de fila no sirve si el padre pasa una función u objeto inline nuevo en cada render, así que lo combinas con `useCallback` o `useMemo` para esas props. `useMemo` también tiene un uso de corrección: mantener estable un objeto cuando es dependencia de un efecto o valor de un context. Son un desperdicio en componentes baratos, en props que cambian en cada render de todos modos y cuando se esparcen por todas partes, porque cada memo cuesta memoria y una comparación de dependencias, y un arreglo de dependencias incorrecto causa bugs de datos obsoletos. Primero perfilo y memoizo donde los renders realmente son costosos; con el React Compiler habilitado, casi todo esto se vuelve automático.',
    rubric: [
      'Define cada herramienta correctamente (comparación superficial de props, identidad de función estable, valor en caché)',
      'Explica que memo sin props de callback/objeto estables queda anulado',
      'Menciona la estabilidad referencial para dependencias de efectos o valores de context',
      'Expone el costo de memoizar de más y perfila primero; punto extra: React Compiler',
    ],
    explanation: 'La lista clásica de nivel senior pregunta por la memoización en general; en una entrevista de React se convierte en esta pregunta. El matiz que buscan es la interacción: `useCallback` por sí solo no hace nada por el rendimiento a menos que quien lo recibe esté memoizado o use la función como dependencia.\n\n**Dilo en voz alta:** "`React.memo` solo ayuda si las props son realmente estables, así que lo combino con `useCallback` y `useMemo` para las props de función y de objeto, y solo lo hago donde el Profiler muestra renders costosos, porque la memoización tiene su propio costo."',
  },
  'react-transition-vs-deferred': {
    prompt: 'Un componente padre que no es tuyo pasa `query` (actualizado en cada tecla) a tu `<BigList query={query} />`, que filtra y renderiza 20,000 filas. Escribir en la caja de búsqueda tiene lag. Solo puedes cambiar `BigList`. ¿Cuál es la herramienta correcta?',
    options: {
      a: '`const deferred = useDeferredValue(query)` y filtrar con `deferred` dentro de `useMemo`',
      b: '`useTransition`, envolviendo `setQuery` en `startTransition`',
      c: 'Envolver `BigList` en `React.memo`',
      d: 'Filtrar dentro de `useLayoutEffect` para que el trabajo ocurra antes del paint',
    },
    explanation: 'Los dos hooks concurrentes marcan trabajo como no urgente para que React pueda interrumpirlo y mantener la escritura fluida. `useTransition` envuelve la **actualización de state**, así que necesitas ser dueño del setter (b es imposible aquí). `useDeferredValue` envuelve un **valor que recibes**: React primero vuelve a renderizar con el valor diferido anterior, luego renderiza el nuevo en segundo plano y lo abandona si llega otra tecla. El `useMemo` importa: sin él, el render urgente vuelve a filtrar igual. `React.memo` (c) no puede ayudar porque `query` realmente cambia en cada tecla, y `useLayoutEffect` (d) bloquea el paint todavía más. A diferencia de un debounce, no hay un retraso fijo: los dispositivos rápidos se actualizan casi de inmediato. Para peticiones de red sigues aplicando debounce. Muestra `query !== deferred` como una pista de "obsoleto".\n\n**Dilo en voz alta:** "`useTransition` cuando soy dueño de la actualización de state, `useDeferredValue` cuando solo recibo el valor; los dos mantienen urgente el input y dejan que el render costoso se interrumpa, algo que un debounce no puede hacer."',
  },
};
