// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  'react-testing-library-query-priority': {
    prompt: 'Un formulario tiene un `<button type="submit">Save changes</button>`. ¿Qué query recomienda React Testing Library para encontrarlo?',
    explanation: 'El principio guía es "cuanto más se parezcan tus tests a la forma en que se usa tu software, más confianza te dan". Los usuarios y las tecnologías de asistencia encuentran los controles por rol y nombre accesible, así que `getByRole` encuentra el botón y a la vez verifica que esté expuesto correctamente (un `<div onClick>` fallaría). La prioridad es aproximadamente: rol, label, placeholder, texto, valor mostrado, texto alternativo, title, y `getByTestId` solo como último recurso. `getByText` funciona, pero no prueba que sea un botón; los selectores CSS acoplan el test a los estilos.',
  },
  'react-testing-library-get-query-find': {
    prompt: '¿Qué afirmaciones sobre `getBy*`, `queryBy*` y `findBy*` son verdaderas? Selecciona todas las que apliquen.',
    options: {
      a: '`getBy*` lanza un error cuando no hay coincidencias, o cuando hay más de una',
      b: '`queryBy*` devuelve `null` cuando no hay coincidencias, lo que lo convierte en la opción correcta para afirmar que algo no está',
      c: '`findBy*` devuelve una promesa y reintenta hasta que el elemento aparece o vence el timeout (1000 ms por defecto)',
      d: '`queryBy*` reintenta durante un tiempo corto antes de devolver `null`',
      e: '`getAllBy*` devuelve un arreglo vacío cuando no hay coincidencias',
    },
    explanation: '`get` = debe existir ahora (lanza un error con un volcado útil del DOM). `query` = puede no existir, devuelve `null`, sin reintentos: úsalo para `expect(screen.queryByRole("alert")).not.toBeInTheDocument()`. `find` = va a existir pronto: es `getBy` envuelto en `waitFor`, así que le haces `await`. Las variantes `*All*` siguen las mismas reglas para "no se encontró nada": `getAllBy` lanza un error, `queryAllBy` devuelve `[]`.',
  },
  'react-testing-library-user-event': {
    prompt: 'Un input de teléfono bloquea las letras en un handler `onKeyDown`. El test `fireEvent.change(input, { target: { value: "abc" } })` seguido de una aserción de que el valor está vacío **falla**, aunque el componente funciona en el navegador. ¿Qué cambio hace que el test ejercite la interacción real?',
    options: {
      a: '`const user = userEvent.setup();` y luego `await user.type(input, \'abc\')`',
      c: '`userEvent.type(input, \'abc\')` sin `await` (user-event v14)',
    },
    explanation: '`fireEvent.change` despacha un único evento sintético `change` con el valor ya asignado, saltándose `keydown`, `keypress`, `input` y `keyup`, así que el handler que bloquea las letras nunca se ejecuta. `user.type` simula lo que hace el navegador con cada carácter (foco, eventos de teclado, eventos de input, respetando `preventDefault`). En user-event v14 cada API devuelve una promesa; olvidar el `await` en `userEvent.type` significa que la aserción se ejecuta antes de que terminen los eventos. Crea el `user` con `userEvent.setup()` antes de renderizar.',
  },
  'react-testing-library-async-findby': {
    prompt: '```jsx\ntest(\'shows the user name\', () => {\n  render(<UserCard id="1" />); // fetches the user in an effect (mocked with MSW)\n  expect(screen.getByText(\'Ada Lovelace\')).toBeInTheDocument();\n});\n```\nEl test falla con "Unable to find an element with the text: Ada Lovelace". ¿Cuál es la corrección correcta?',
    options: {
      a: 'Hacer el test `async` y usar `expect(await screen.findByText(\'Ada Lovelace\')).toBeInTheDocument()`',
      b: 'Envolver `render(...)` en `act(...)`',
      c: 'Agregar `await new Promise((r) => setTimeout(r, 100))` antes de `getByText`',
      d: 'Usar `screen.queryByText` en lugar de `getByText`',
    },
    explanation: 'En el primer render el componente muestra su estado de carga; el nombre aparece solo después de que la petición mockeada se resuelve y el state se actualiza. `findBy*` consulta repetidamente hasta que el elemento aparece (o vence el timeout), y RTL ya envuelve `render`, user-event y `waitFor` en `act`, así que volver a envolver `render` en `act` no cambia nada. Una espera fija es lenta e inestable. `queryByText` solo devuelve `null` y la aserción igual falla. Si además ves advertencias de "not wrapped in act(...)", normalmente significa que ocurrió una actualización después de que el test dejó de esperar, y la corrección es la misma: espera con await el estado de la UI que esperas.',
  },
  'react-testing-library-waitfor-pitfalls': {
    prompt: 'Estás revisando una suite de tests. ¿Cuáles de estos son anti-patrones? Selecciona todas las que apliquen.',
    options: {
      d: '`await waitFor(() => {})` para "dejar que se vacíen las actualizaciones pendientes"',
      e: '`const user = userEvent.setup()` antes de `render`, y luego `await user.click(...)`',
    },
    explanation: '`waitFor` vuelve a ejecutar su callback hasta que deja de lanzar errores, así que los efectos secundarios dentro de él, como `user.click(saveButton)`, pueden ejecutarse muchas veces (varios clics, varios envíos). Pon la acción antes de `waitFor` y solo aserciones dentro. Varias aserciones en un mismo callback, como el par de `fetchMock` y los resultados, lo hacen esperar a todas y ocultan cuál falló; espera una condición y luego afirma el resto de forma síncrona. Un callback vacío se resuelve en el primer tick y solo funciona por suerte con los tiempos; en su lugar, espera un cambio concreto en la UI. La comprobación síncrona de ausencia con `queryByRole(\'alert\')` y `userEvent.setup()` antes de `render` son los patrones recomendados.\n\n**Dilo en voz alta:** "`waitFor` es un bucle de reintentos para aserciones, así que no debe tener efectos secundarios y debe esperar una sola condición observable; para elementos que aparecen, simplemente uso `findBy`."',
  },
  'react-testing-library-debounced-search-strategy': {
    prompt: '¿Cómo probarías un componente `<TicketSearch>` que aplica un debounce de 300 ms al input, llama a `/api/tickets?q=...`, muestra un spinner mientras carga, renderiza los resultados y muestra un mensaje de error cuando la API falla?',
    modelAnswer: 'Lo pruebo como lo usa un usuario y mockeo en la frontera de la red, no los detalles internos del componente. Mock Service Worker (MSW) maneja `/api/tickets`, así que se ejecuta el código de fetch real; los tests sobrescriben el handler en cada caso para devolver resultados, una lista vacía o un 500. Para el debounce uso fake timers con `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })` (o `jest.advanceTimersByTime`), escribo la query y afirmo que no salió ninguna petición antes de los 300 ms y exactamente una después, lo que además prueba que se descartaron las teclas intermedias. Luego `await screen.findByRole("status")` o el label del spinner, seguido de `await screen.findByText(...)` para los resultados, y `findByRole("alert")` para el camino de error. Hago queries por rol y nombre accesible, afirmo solo sobre lo que ve el usuario y nunca sobre state, llamadas a hooks o nombres de clases. Agrego un caso para una race condition (primera respuesta lenta, segunda rápida) si el componente dice manejarla. La lógica pura del debounce también puede tener su propio test unitario pequeño.',
    rubric: [
      'Mockea la red (MSW) en lugar de mockear hooks o módulos internos',
      'Usa fake timers conectados a user-event para probar el debounce de forma determinista',
      'Usa `findBy*` para los estados de carga, resultados y error, y queries basadas en rol',
      'Cubre los caminos de error y de lista vacía, y evita aserciones sobre detalles de implementación',
    ],
    explanation: 'Las partes difíciles que exploran los entrevistadores son el tiempo (el debounce) y la red. Los fake timers hacen que el tiempo sea determinista, y MSW mantiene bajo prueba el código real de data fetching del componente.\n\n**Dilo en voz alta:** "Mockeo en la frontera de la red con MSW, controlo el tiempo con fake timers conectados a user-event y afirmo solo sobre lo que el usuario puede ver, usando `findBy` para todo lo asíncrono."',
  },
};
