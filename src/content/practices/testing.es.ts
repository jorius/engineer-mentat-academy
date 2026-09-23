// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  'testing-strategies-pyramid-vs-trophy': {
    prompt:
      'Te unes a un equipo cuyo producto en React + Node tiene 2000 tests unitarios, casi ningún test de integración y una suite de Cypress flaky de 40 minutos. Los bugs de producción se siguen colando en las costuras entre módulos. **Pirámide de tests o trofeo de testing: ¿hacia qué forma orientas al equipo y cómo llegas ahí?**',
    modelAnswer:
      'La pirámide (muchos tests unitarios, menos de integración, pocos E2E) optimiza la velocidad y el aislamiento; el trofeo (análisis estático en la base, una franja media gruesa de tests de integración, menos tests unitarios y E2E) optimiza la confianza por test, que es justo lo que le falta a este equipo. Que los bugs aparezcan en las costuras significa que los tests unitarios hacen mock exactamente de los límites que se están rompiendo, así que movería el peso hacia los tests de integración: componentes renderizados con React Testing Library contra una capa de red con mocks (MSW), y tests de API que llaman a rutas reales con una base de datos real en un contenedor. El modo strict de TypeScript y ESLint forman la base estática y atrapan toda una clase de bugs sin costo. La suite E2E se reduce a un puñado de recorridos críticos (registro, checkout) y su inestabilidad se corrige o se pone en cuarentena, no se reintenta. Los tests unitarios se quedan donde la lógica es densa y pura: reglas de precios, parsers, reducers. Mediría el cambio por defectos escapados y tiempo de la suite, no por porcentaje de cobertura. La forma es un medio; el objetivo es la mayor confianza por minuto de CI.',
    rubric: [
      'Explica ambas formas y qué optimiza cada una (velocidad y aislamiento vs confianza)',
      'Diagnostica que los tests unitarios con exceso de mocks no detectan los bugs de integración en las costuras',
      'Propone herramientas de integración concretas (RTL + MSW, tests de API con una base de datos real o contenedores)',
      'Reduce los E2E a los caminos críticos y trata la inestabilidad como un bug en lugar de reintentar',
      'Mide el resultado por defectos escapados o por confianza, no por cobertura bruta',
    ],
    explanation:
      'Ninguna de las dos formas es un dogma. La pirámide viene de una época de tests de UI lentos; el trofeo (Kent C. Dodds) refleja que los tests de integración modernos son lo bastante baratos como para ser el grueso de la suite. La jugada senior es diagnosticar dónde falta confianza y mover el esfuerzo de testing hacia ahí.\n\n**Dilo en voz alta:** "Optimizo la confianza por minuto de CI: tipos estáticos en la base, tests de integración como el grueso porque ahí viven nuestros bugs, tests unitarios para la lógica pura y densa, y una capa delgada de E2E para los recorridos que generan dinero."',
  },
  'testing-strategies-what-to-mock': {
    prompt:
      'Estás escribiendo tests unitarios para `OrderService.placeOrder()`. Llama a un helper puro `calculateTax()` del mismo módulo, a un método privado `#buildLineItems()`, a `Date.now()` para ponerle fecha a la orden y a un `StripeClient` de terceros para cobrar la tarjeta. ¿Qué colaboradores son buenos candidatos para un test double? Selecciona todas las que apliquen.',
    options: {
      a: 'El `StripeClient` de terceros',
      b: 'El reloj (`Date.now()`), mediante un reloj inyectado o fake timers',
      c: 'El helper puro `calculateTax()`',
      d: 'El método privado `#buildLineItems()`, espiándolo',
    },
    explanation:
      'Haz mock de lo que es **lento, no determinista o está fuera de tu control**: las llamadas de red a terceros y el reloj. No hagas mock del código puro que es tuyo: `calculateTax()` es rápido y determinista, y hacerle mock significa que el test ya no comprueba que el impuesto realmente se aplique. Espiar métodos privados acopla el test a la estructura interna, así que un refactor inofensivo lo rompe. Una regla útil: haz mock en los límites del sistema (red, tiempo, aleatoriedad, sistema de archivos), no entre tus propias unidades.',
  },
  'testing-unit-test-doubles': {
    prompt:
      '```ts\nconst send = vi.fn().mockResolvedValue({ ok: true });\nawait notifyUser(user, { send });\nexpect(send).toHaveBeenCalledWith(user.email, expect.stringContaining(\'Welcome\'));\n```\n¿Qué tipo de test double es `send` y qué está verificando el test?',
    options: {
      a: 'Un stub: solo devuelve datos predefinidos, y el test comprueba el valor de retorno de `notifyUser`',
      b: 'Un mock: devuelve datos predefinidos **y** registra las llamadas, y el test verifica la interacción (a quién se llamó y con qué)',
      c: 'Un fake: una implementación ligera que funciona, como un servidor de correo en memoria',
      d: 'Un spy sobre el cliente de correo real: el correo real se sigue enviando',
    },
    explanation:
      'Los stubs dan respuestas predefinidas para que el código bajo prueba pueda ejecutarse; los mocks además registran las llamadas para que puedas hacer aserciones sobre la **interacción**; los fakes son implementaciones simplificadas que funcionan (un repositorio en memoria); los spies envuelven una función real y registran las llamadas mientras (por defecto) siguen llamando a la función real. `vi.fn()` / `jest.fn()` con una aserción sobre sus llamadas es un mock. Las aserciones de interacción son correctas cuando el efecto secundario *es* el comportamiento (hay que enviar un correo); en los demás casos, prefiere aserciones sobre el estado.',
  },
  'testing-unit-fix-deep-equal': {
    prompt:
      'Un compañero escribió un comparador casero `expectDeepEqual` para una biblioteca de helpers de tests. Devuelve `true` para cosas que son obviamente distintas, así que las aserciones pasan cuando deberían fallar. Corrige `solution(a, b)` para que tenga una semántica tipo `toStrictEqual` para objetos planos, arrays y primitivos:\n\n- ambos lados deben tener exactamente las mismas claves propias (una clave extra en cualquiera de los dos lados es una diferencia);\n- un array nunca es igual a un objeto plano;\n- `NaN` es igual a `NaN`.',
    explanation:
      'El código inicial tiene cuatro bugs. (1) Solo recorre las claves de `a`, así que ignora las claves extra de `b` (incluidos los elementos extra de un array): la comparación es una verificación de *subconjunto*. (2) `===` dice que `NaN !== NaN`; `Object.is` los trata como iguales. (3) `[]` y `{}` tienen cero claves, así que se comparan como iguales a menos que revises `Array.isArray` en ambos lados. (4) Que coincida la **cantidad** de claves no basta: `{ a: 1, b: undefined }` y `{ a: 1, c: undefined }` leen `undefined` en la clave que falta, así que tienes que comprobar que cada clave realmente exista en el otro lado.\n\nEsta es exactamente la diferencia entre `toEqual` de Jest/Vitest (que ignora las propiedades `undefined`) y `toStrictEqual` (que no las ignora). Un helper así de simple todavía no contempla `Date`, `Map`, `Set` ni instancias de clases, y por eso deberías usar el matcher del framework en lugar de escribir el tuyo.',
  },
  'testing-unit-fix-fake-timers': {
    prompt:
      'Este es un scheduler mínimo de fake timers, del tipo que te da `vi.useFakeTimers()`. `solution(plan, tickMs)` programa un temporizador por paso (un paso puede programar un temporizador de seguimiento desde dentro de su callback), avanza el reloj falso `tickMs` y devuelve las etiquetas disparadas como `"label@time"`.\n\nLa implementación de `tick` está mal. Corrígela para que, como los fake timers reales:\n\n- los temporizadores vencidos se disparen en orden de vencimiento (los empates mantienen el orden en que se programaron);\n- dentro de un callback, `clock.now()` sea igual al tiempo de vencimiento de ese temporizador;\n- los temporizadores programados *durante* el tick se disparen en el mismo tick si caen dentro de la ventana.',
    explanation:
      'El `tick` con bugs toma una **instantánea** de los temporizadores vencidos una sola vez, los ejecuta en orden de inserción y solo mueve `now` al final. Eso rompe tres garantías: el orden por tiempo de vencimiento, que `now` sea igual al tiempo de vencimiento dentro del callback (así que un `setTimeout(fn, 50)` anidado se programa respecto a la base equivocada), y que se tomen en cuenta los temporizadores creados durante el tick. La corrección es un bucle: elegir repetidamente el temporizador vencido más temprano (el `<` estricto mantiene los empates en orden de programación), avanzar `now` hasta su tiempo de vencimiento, quitarlo, ejecutarlo y volver a buscar, porque el callback pudo haber agregado temporizadores.\n\nAsí es como `@sinonjs/fake-timers` (detrás de `vi.useFakeTimers()` y de los modern timers de Jest) implementa `tick`, y por eso `vi.advanceTimersByTime(200)` ejecuta un reintento programado a +50 ms desde dentro de un temporizador de +100 ms.\n\n**Dilo en voz alta:** "Los fake timers convierten el tiempo en una entrada del test: yo controlo el reloj, lo avanzo de forma determinista y verifico lo que se disparó, en lugar de dormir y cruzar los dedos. La invariante clave es que el tiempo avanza temporizador por temporizador, no de un salto."',
  },
  'testing-integration-flaky-suite': {
    prompt:
      'Tu suite de integración de la API falla más o menos en una de cada cinco ejecuciones de CI, siempre en tests distintos, y siempre pasa en local. ¿Cuáles de estas opciones son soluciones reales y no formas de esconder el problema? Selecciona todas las que apliquen.',
    options: {
      a: 'Aislar el estado de la base de datos por test: envolver cada test en una transacción a la que se le hace rollback, o truncar las tablas en `beforeEach`',
      b: 'Poner `retry: 3` en la configuración de CI para que el pipeline quede en verde',
      c: 'Reemplazar `await sleep(2000)` por un sondeo (polling) de la condición esperada con un timeout',
      d: 'Inyectar un reloj y congelar el tiempo en lugar de depender de `new Date()` y de la zona horaria de la máquina de CI',
      e: 'Subir el timeout de cada test a 60 segundos',
    },
    explanation:
      'La inestabilidad tiene causas: **estado compartido** entre tests (datos que dependen del orden, workers paralelos escribiendo las mismas filas), **suposiciones de tiempo** (sleeps fijos que alcanzan en una laptop pero no en un runner de CI cargado) y **dependencia del entorno** (reloj, zona horaria, locale, semillas aleatorias). Aislar el estado, esperar condiciones en lugar de duraciones e inyectar el reloj eliminan esas causas. Los reintentos y los timeouts enormes ponen el pipeline en verde mientras el no determinismo (que puede ser una condición de carrera real en el código de producción) sigue ahí. Si de verdad tienes que poner en cuarentena un test flaky, regístralo como un bug con un responsable.',
  },
  'testing-backend-testcontainers': {
    prompt:
      'Los tests unitarios de tu capa de repositorio hacen mock del driver de la base de datos y todos pasan. En producción, una consulta falla porque una migración renombró `customer_id` a `client_id`, y otro bug se cuela porque SQLite (usado en los tests) y Postgres (usado en producción) ordenan `NULL` de forma distinta. ¿Cuál es el test más barato que habría detectado **ambos**?',
    options: {
      a: 'Más tests unitarios con mocks más estrictos que verifiquen la cadena SQL exacta',
      b: 'Tests de integración que levanten un Postgres real de la versión de producción con Testcontainers, ejecuten las migraciones y ejerciten el repositorio',
      c: 'Un test E2E en el navegador de todo el flujo de checkout contra staging',
      d: 'Cambiar la base de datos de tests en memoria de SQLite a un mock en memoria del ORM',
    },
    explanation:
      'Los mocks solo verifican lo que tú *crees* que hace la base de datos. Verificar cadenas SQL repite la implementación y aun así nunca ejecuta la migración. Un motor sustituto (SQLite, H2, un mock del ORM) se aparta de la semántica de producción (orden de NULL, operadores JSON, bloqueos, collations). Testcontainers levanta un contenedor Docker desechable del **mismo motor y versión** por suite, así que las migraciones y las consultas se ejecutan de verdad, en segundos y en CI. Un E2E también lo detectaría, pero más lento, más tarde y con una señal de falla mucho peor.',
  },
  'testing-backend-contract-tests': {
    prompt:
      'El BFF web y tres microservicios (orders, payments, inventory) pertenecen a equipos distintos. Los cambios de API que rompen compatibilidad siguen llegando a staging, y el entorno end-to-end compartido siempre está roto. **¿Cómo usarías contract testing aquí y qué reemplaza?**',
    modelAnswer:
      'Introduciría tests de contrato dirigidos por el consumidor (consumer-driven), por ejemplo con Pact. Cada consumidor (el BFF) escribe tests contra un proveedor simulado que registran las solicitudes exactas que hace y los campos de respuesta de los que depende; esas interacciones se convierten en un contrato que se publica en un broker. Cada proveedor ejecuta la verificación del contrato en su propio CI contra el servicio real, con provider states para sembrar datos, así que orders no puede publicar un cambio que rompa un campo que el BFF lee. Un chequeo `can-i-deploy` contra el broker controla los despliegues por entorno. Esto reemplaza la mayoría de los tests E2E entre equipos para la compatibilidad de APIs, que son lentos, inestables y fallan lejos del cambio; queda una capa delgada de smoke tests E2E para los recorridos críticos. Los contratos verifican la forma y la semántica de las interacciones, no la lógica de negocio, así que cada servicio igual necesita sus propios tests de integración. En las partes orientadas a eventos, la misma idea se aplica a los esquemas de mensajes, a menudo con un schema registry.',
    rubric: [
      'Explica los contratos dirigidos por el consumidor: el consumidor define las expectativas y el proveedor las verifica en su propio pipeline',
      'Menciona un broker y una compuerta de despliegue (`can-i-deploy` o equivalente) para desacoplar los ciclos de release de los equipos',
      'Lo contrasta con los entornos E2E compartidos (lentos, inestables, feedback tardío) y conserva solo una capa delgada de E2E',
      'Señala los límites: los contratos no prueban la lógica de negocio; los servicios igual necesitan sus propios tests de integración',
      'Extiende la idea a la mensajería asíncrona o a los schema registries',
    ],
    explanation:
      'Los tests de contrato llevan el feedback de integración al pipeline del equipo que causó la rotura. En el contrato solo están los campos que el consumidor usa de verdad, así que los proveedores pueden evolucionar todo lo demás libremente.\n\n**Dilo en voz alta:** "Los contratos dirigidos por el consumidor le permiten a cada equipo verificar la compatibilidad en su propio CI en minutos, así que un entorno end-to-end compartido deja de ser el único lugar donde descubrimos que dos servicios no están de acuerdo."',
  },
  'testing-frontend-rtl-query-priority': {
    prompt: 'En un test de React Testing Library, ¿qué query deberías usar **primero** para encontrar el botón de envío del formulario?',
    explanation:
      'El principio rector de RTL es "cuanto más se parezcan tus tests a la forma en que se usa tu software, más confianza te pueden dar". Los usuarios (y las tecnologías de asistencia) encuentran un botón por su rol y su nombre accesible, así que `getByRole` va primero en la prioridad recomendada, seguido de `getByLabelText`, `getByPlaceholderText` y `getByText`. `getByTestId` es una vía de escape para cuando no existe nada semántico, y los selectores CSS acoplan el test a los estilos. Un bonus: si `getByRole` no encuentra tu botón, muchas veces es un bug de accesibilidad.',
  },
  'testing-frontend-implementation-details': {
    prompt:
      'Un componente `SignupForm` muestra un error cuando el email está vacío y abre un diálogo de confirmación cuando el envío sale bien. ¿Cuáles de estas aserciones prueban **detalles de implementación** y se romperían con un refactor inofensivo (por ejemplo, mover el estado a `useReducer` o dividir un componente hijo)? Selecciona todas las que apliquen.',
    options: {
      a: 'Hacer mock de `React.useState` y verificar que se llamó a `setIsOpen` con `true`',
      b: 'Después de `await user.click(submit)`, verificar que `screen.getByRole(\'dialog\')` es visible',
      c: 'Hacer shallow rendering del formulario y verificar que el hijo `<EmailField>` recibió `error="Email is required"` como prop',
      d: 'Verificar que `screen.getByRole(\'alert\')` tiene el texto "Email is required"',
      e: 'Leer el estado de la instancia del componente: `wrapper.state(\'isOpen\')` es igual a `true`',
    },
    explanation:
      'Los detalles de implementación son cosas que el usuario no puede observar: el estado interno, qué hook lo guarda, qué hijo recibe qué prop. Los tests que hacen aserciones sobre ellos dan **falsos negativos** (fallan con un refactor correcto) y **falsos positivos** (el estado puede ser `true` mientras el diálogo no se renderiza). Las dos aserciones con `getByRole` verifican lo que el usuario ve y con lo que interactúa, mediante roles, así que sobreviven a los refactors y solo fallan cuando el comportamiento se rompe. Este es el argumento central a favor de React Testing Library frente al shallow rendering al estilo de Enzyme.',
  },
};
