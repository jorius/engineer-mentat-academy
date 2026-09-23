// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  'redux-reducer-rules': {
    prompt: '¿Cuáles de estos rompen las reglas de un reducer de Redux simple (sin Redux Toolkit)? Selecciona todas las que apliquen.',
    options: {
      d: 'Crear el elemento nuevo con `id: crypto.randomUUID()` dentro del reducer',
      e: '`return state;` para un tipo de acción que el reducer no maneja',
    },
    explanation: 'Un reducer debe ser una función pura de `(state, action)`: sin mutaciones (b), sin efectos secundarios como llamadas de red (c) y sin valores no deterministas como ids aleatorios o `Date.now()` (d), porque reproducir las mismas acciones (time-travel debugging, tests, hidratación en SSR) debe producir el mismo state. Genera los ids en el action creator (el callback `prepare` de Redux Toolkit) y pon los efectos secundarios en thunks, listeners o middleware. Devolver el state existente para acciones desconocidas (e) es obligatorio: mantiene la referencia sin cambios, así los suscriptores saben que nada cambió.',
  },
  'redux-reducer-immutability-fix': {
    prompt: 'Este reducer de todos escrito a mano "funciona" en el test unitario del reducer, pero los componentes conectados nunca vuelven a renderizar después de `todos/added` o `todos/toggled`. `solution(actions)` reproduce las acciones como un store y devuelve cada state junto con si cambió la referencia del state (react-redux compara referencias para decidir si vuelve a renderizar). Corrige `todosReducer` sin cambiar `solution`.',
    explanation: 'Redux y react-redux detectan los cambios por **referencia**: `useSelector` vuelve a renderizar solo cuando el valor seleccionado es `!==` al anterior. Mutar y devolver el mismo objeto significa "nada cambió", así que la UI se queda obsoleta, y cada state del historial es en secreto el mismo objeto (lo que además rompe el time-travel debugging). La versión que muta incluso corrompe el `initialState` a nivel de módulo. Copia cada nivel que cambias (`...state`, `[...state.todos, x]`, `map` con `{ ...t }`) y comparte las ramas que no tocas (structural sharing).\n\nEsta es la clásica pregunta de inmutabilidad llevada a la práctica. En Redux Toolkit, el código original que muta sería válido dentro de `createSlice`, porque Immer registra las mutaciones sobre un draft y produce el nuevo state inmutable por ti.',
  },
  'redux-middleware-order': {
    prompt: 'Esta es una copia reducida de `createStore` y `applyMiddleware` que compone el middleware exactamente como lo hace Redux (`store => next => action`). ¿Qué imprime el `dispatch` final, un valor por línea?',
    explanation: 'El middleware envuelve a `dispatch` como una cebolla: el primer middleware que se pasa es la capa más externa. La acción fluye por A y luego por B hasta el `dispatch` real, que ejecuta el reducer y notifica a los suscriptores de forma **síncrona**, y solo entonces el control regresa por B y A. Por eso un middleware logger puede imprimir el state antes y después de `next(action)`, y por eso funcionan los thunks: un middleware de thunks intercepta las "acciones" que son funciones antes de que lleguen a `next`.',
  },
  'redux-memoized-selector': {
    prompt: '`selectVisibleTodos` filtra los todos en cada llamada, así que `useSelector` recibe un arreglo nuevo cada vez y el componente vuelve a renderizar con **cualquier** cambio del store, incluso al alternar el tema. Implementa `createSelector(selectA, selectB, combiner)` (una versión de dos entradas del de Reselect) para que el combiner se vuelva a ejecutar solo cuando el resultado de una entrada cambia por referencia, y en otro caso devuelva el objeto de resultado anterior.\n\n`solution` reproduce pasos a través de un reducer que usa structural sharing e informa cuántas veces se ejecutó el combiner, si cada paso devolvió la misma referencia de arreglo que el paso anterior y los ids visibles finales.',
    explanation: '`useSelector` ejecuta el selector después de **cada** dispatch y vuelve a renderizar cuando el resultado es `!==` al anterior. Un selector que devuelve `filter(...)` produce un arreglo nuevo cada vez, así que el componente vuelve a renderizar con acciones que no tienen nada que ver. Memoizar sobre las referencias de entrada funciona porque los reducers usan structural sharing: alternar el tema crea un objeto raíz nuevo pero conserva el mismo arreglo `todos`. El `createSelector` de Reselect (que Redux Toolkit vuelve a exportar) hace exactamente esto con un tamaño de caché de 1, y por eso un selector compartido por varios componentes con argumentos distintos necesita una factory (una instancia de selector por componente) o una caché más grande.\n\n**Dilo en voz alta:** "Los selectors que derivan arreglos u objetos deben estar memoizados; si no, `useSelector` ve una referencia nueva en cada dispatch y vuelve a renderizar. La memoización funciona porque las actualizaciones inmutables mantienen referencialmente iguales las ramas que no cambian."',
  },
  'redux-toolkit-immer-reassign': {
    prompt: '```js\nconst cartSlice = createSlice({\n  name: \'cart\',\n  initialState: { items: [], coupon: null },\n  reducers: {\n    added(state, action) { state.items.push(action.payload); },\n    cleared() { return { items: [], coupon: null }; },\n    couponApplied(state, action) { state.coupon = action.payload; },\n    reset(state) { state = { items: [], coupon: null }; },\n  },\n});\n```\n¿Qué case reducer **no** cambia el state del store?',
    options: {
      a: '`added`, porque `push` muta el state',
      b: '`cleared`, porque los reducers de un slice no deben devolver un valor',
      c: '`couponApplied`, porque Immer ignora las asignaciones a campos primitivos',
      d: '`reset`, porque reasignar el parámetro `state` no toca el draft',
    },
    explanation: '`createSlice` ejecuta los case reducers a través de Immer: `state` es un proxy draft, e Immer registra las **mutaciones** de ese draft (a, c) o acepta un valor de reemplazo **devuelto** (b). `state = ...` solo vuelve a enlazar una variable local; el draft no se toca y no se devuelve nada, así que Immer devuelve el state original. Escribe `return initialState` en su lugar. La otra trampa de Immer: puedes mutar el draft **o** devolver un valor nuevo, no las dos cosas; hacer ambas lanza un error.',
  },
  'redux-async-thunk-vs-rtk-query': {
    prompt: 'Un codebase guarda los datos de la API en Redux usando `createAsyncThunk` más banderas `loading`/`error` escritas a mano en cada slice, y varias pantallas muestran datos obsoletos después de una edición. ¿Cómo lo harías evolucionar y qué se queda en Redux?',
    modelAnswer: 'Los slices están implementando a mano una caché del servidor: cada thunk repite el manejo de pending/fulfilled/rejected, y nada sabe qué datos en caché invalida una edición, por eso las pantallas se quedan obsoletas. Movería los datos del servidor a RTK Query, ya que la app ya usa Redux Toolkit (React Query es el equivalente si no lo usara). Defines los endpoints una vez y obtienes hooks generados con estado de carga y de error, deduplicación de peticiones, caché por argumento, polling e invalidación mediante `providesTags`/`invalidatesTags`, para que una mutación vuelva a pedir exactamente las queries que dejó obsoletas. Las actualizaciones optimistas van en `onQueryStarted` con un rollback. Redux conserva el client state genuino: state de UI, flujos de varios pasos y state transversal que no le pertenece al servidor. `createAsyncThunk` se queda para flujos que no son un simple request/response, y `createEntityAdapter` para colecciones normalizadas del lado del cliente. Migraría un endpoint a la vez detrás de los selectors existentes para que el cambio sea seguro.',
    rubric: [
      'Distingue el server state (una caché) del client state',
      'Propone RTK Query (o React Query) y nombra la invalidación basada en tags como la solución a los datos obsoletos',
      'Sabe qué se queda en los slices (state de UI y de flujos, entity adapters, thunks para flujos complejos)',
      'Planea una migración incremental en lugar de reescribir todo',
    ],
    explanation: 'El síntoma de datos obsoletos es un problema de invalidación de caché, por eso la respuesta es una capa de data fetching con invalidación y no más banderas.\n\n**Dilo en voz alta:** "Los datos del servidor son una caché, no state de la aplicación. Dejo que RTK Query se encargue del fetching, la caché y la invalidación con tags, y mantengo los slices de Redux para el client state que el servidor no conoce."',
  },
};
