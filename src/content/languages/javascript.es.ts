// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  'javascript-event-loop-order-basic': {
    prompt: '¿Qué imprime esto, un valor por línea?',
    explanation:
      'Los `console.log` síncronos se ejecutan primero (1, 4). La cola de microtareas se vacía por completo antes de la siguiente macrotarea, así que el callback de la promesa (3) se adelanta al temporizador (2).\n\n**Dilo en voz alta:** "Las microtareas siempre se ejecutan antes de la siguiente macrotarea, así que una avalancha de callbacks de promesas puede dejar sin turno a los temporizadores."',
  },
  'javascript-this-spread-greet': {
    prompt:
      'Una copia con spread comparte la función `greet`, pero `this` se sigue resolviendo en el momento de la llamada. Cambia **solo el cuerpo de `solution`** para que devuelva el saludo del objeto copiado con `name: "Daniel"` usando el `greet` original, sin editar `greet`.',
    explanation:
      '`this` lo decide el punto de llamada, no el lugar donde se definió la función. Funcionan tanto `secondSubject.greet()` como `firstSubject.greet.call(secondSubject)`; `bind` devuelve una función nueva. Una función flecha ignoraría todo esto porque captura `this` de forma léxica.\n\n**Dilo en voz alta:** "`this` lo decide el punto de llamada, no el lugar donde se definió la función; una copia con spread comparte la función, pero igual tengo que invocarla con el receptor correcto, con una llamada de método o con `call`."',
  },
  'javascript-closure-counter-independence': {
    prompt:
      '```js\nfunction outer() {\n  let n = 0;\n  return () => ++n;\n}\nconst a = outer();\nconst b = outer();\na(); a();\nconsole.log(b());\n```\n¿Qué se imprime?',
    explanation:
      'Cada llamada a `outer` crea un `n` nuevo. `a` y `b` encierran variables distintas, así que `b` empieza desde 0.',
  },
  'javascript-shallow-copy-nested': {
    prompt:
      '```js\nconst obj = {\n  a: { b: [1, 2] },\n  d: new Date(),\n};\n```\n¿Cuáles de estas opciones producen una copia **profunda** de `obj` que conserve el `Date`? Selecciona todas las que correspondan.',
    explanation:
      'Spread y `Object.assign` copian un solo nivel. Pasar por `JSON` convierte un `Date` en string y descarta funciones y `undefined`. `structuredClone` maneja objetos anidados, Dates, Maps y Sets, pero lanza un `DataCloneError` con funciones y pierde los prototipos de clase (las instancias vuelven como objetos planos).',
  },
  'javascript-array-methods-some-every': {
    prompt:
      'Implementa `solution(orders)` para que devuelva `true` cuando **todas** las órdenes tengan un `total` positivo y **alguna** esté marcada como `priority`.',
    explanation:
      '`every` sobre un array vacío es `true` (verdad vacua), mientras que `some` es `false`; la prueba con la lista vacía existe para que lo notes.',
  },
  'javascript-promise-combinators-choice': {
    prompt:
      'Para un dashboard haces fan-out a cinco servicios downstream y debes renderizar lo que haya respondido con éxito dentro de 800 ms. ¿Qué combinadores de promesas usas y cómo manejas el timeout?',
    explanation:
      'Señal de seniority: elegir el combinador según su semántica de fallo y luego agregar timeouts para que la dependencia más lenta no defina la latencia.\n\n**Dilo en voz alta:** "Elijo el combinador según su semántica de fallo: `all` falla rápido, `allSettled` espera todos los resultados, `any` toma el primer éxito y `race` el primero en resolverse, y agrego un timeout para que una sola dependencia lenta no fije mi latencia."',
    modelAnswer:
      'Envuelve cada llamada en `Promise.race([call, rejectAfter(800)])` (o usa `AbortSignal.timeout(800)` en fetch) y luego aplica `Promise.allSettled` sobre las cinco, para que un fallo nunca rechace todo el render. Mapea los resultados resueltos a dato-o-error por widget. `Promise.all` fallaría rápido; `Promise.any` solo te da el primer éxito.',
    rubric: [
      'Nombra `Promise.allSettled` para tolerar fallos parciales',
      'Explica por qué `Promise.all` es incorrecto aquí (falla rápido)',
      'Aplica un timeout por llamada con `race` o `AbortSignal.timeout`',
      'Menciona mostrar errores por widget en lugar de un único fallo global',
    ],
  },
  'javascript-equality-coercion-core': {
    prompt: '¿Qué imprime esto, un valor por línea?',
    explanation:
      '`==` aplica coerción (`""` se convierte en 0; `null`/`undefined` solo son laxamente iguales entre sí). `[] + {}` convierte ambos lados a string. `NaN` nunca es igual a nada; usa `Number.isNaN` u `Object.is`.',
  },
  'javascript-hoisting-tdz-core': {
    prompt:
      '```js\nconsole.log(a);\nconsole.log(typeof f);\nlet a = 1;\nfunction f() {}\n```\n¿Qué pasa al ejecutar esto?',
    explanation:
      '`let` tiene hoisting, pero queda sin inicializar hasta que se ejecuta su declaración, así que leerla lanza un error. Con `var` se imprimiría `undefined`; la declaración de función tiene hoisting completo, pero la línea `typeof f` nunca se ejecuta porque la primera ya lanzó el error.',
    options: {
      a: 'Imprime `undefined` y luego `function`',
      b: 'Lanza `ReferenceError` porque `a` está en la zona muerta temporal',
      c: 'Imprime `1` y luego `function`',
      d: 'Lanza `TypeError`',
    },
  },
  'javascript-null-vs-undefined-core': {
    prompt:
      'En las entrevistas preguntan la diferencia entre `null` y `undefined`. Demuestra que sabes cómo se comporta cada uno en código real: ¿qué imprime esto, una línea por cada `console.log`?',
    explanation:
      '`undefined` es lo que reporta el **motor** para "todavía no hay valor": una propiedad inexistente, una variable sin asignar, un argumento faltante, una función sin `return`. `null` es un valor que un **programa** asigna a propósito para decir "vacío".\n\n- `typeof null` es `"object"`, un bug histórico que nunca se podrá corregir.\n- `JSON.stringify` descarta las claves cuyo valor es `undefined` pero conserva `null`, así que solo `null` sobrevive a un viaje por la red.\n- `??` y `?.` tratan a ambos como nullish, pero **los parámetros por defecto solo se activan con `undefined`**: `greet(null)` devuelve `null`.\n- La coerción numérica difiere: `null` se convierte en `0` y `undefined` en `NaN`.\n\nEsa asimetría es la razón por la que las APIs a menudo la usan a propósito: en el body de un PATCH, un campo ausente significa "no lo toques" y `null` significa "bórralo".',
  },
  'javascript-arrow-object-literal-core': {
    prompt:
      'En las entrevistas preguntan la diferencia entre una **expresión** y una **sentencia**. Este fragmento es donde esa diferencia muerde. ¿Qué imprime, un valor por línea?',
    explanation:
      'Una **expresión** produce un valor y puede aparecer en cualquier lugar donde se espera un valor (`a + b`, `x ? y : z`, `total = 3`, una expresión de función). Una **sentencia** realiza una acción y no produce un valor utilizable (`if`, `for`, `return`, declaraciones, bloques).\n\n- `() => { value: 1 }` interpreta las llaves como una **sentencia de bloque** que contiene una *etiqueta* `value:` y la expresión `1`. No hay `return`, así que produce `undefined`. Envolverlo en paréntesis fuerza el contexto de expresión: `() => ({ value: 1 })`.\n- La IIFE necesita los paréntesis externos por la misma razón: `function () {}` al inicio de una sentencia es una declaración, no una expresión que puedas invocar.\n- La asignación es una expresión cuyo valor es el valor asignado, por eso `(total = 3) * 2` es `6`.\n- El ternario es la forma de expresión de `if`, por eso los huecos `{...}` de JSX (que solo aceptan expresiones) usan ternarios y `&&` en lugar de `if`.',
  },
  'javascript-event-loop-async-await-core': {
    prompt:
      'En las entrevistas preguntan cómo funciona el event loop. Demuéstralo con código que mezcla `async`/`await`, promesas, `queueMicrotask` y un temporizador. ¿Qué imprime esto, un valor por línea?',
    explanation:
      'El script en sí es una macrotarea. Todo lo síncrono se ejecuta primero, **incluido el cuerpo de una función `async` hasta su primer `await`** y el cuerpo de `b`: `start`, `a1`, `b`, `end`.\n\n`await b()` suspende `a` y programa su continuación como microtarea cuando la promesa de `b()` se resuelve (ya lo está, así que se encola de inmediato, antes del `.then` y el `queueMicrotask` posteriores). Cuando la pila queda vacía, se vacía **toda** la cola de microtareas en orden FIFO: `a2`, `then`, `micro`. Solo entonces el loop toma la siguiente macrotarea, el temporizador.\n\n**Dilo en voz alta:** "Una función async se ejecuta de forma síncrona hasta su primer await; cada continuación posterior es una microtarea, y toda la cola de microtareas se vacía antes del siguiente temporizador o callback de I/O, así que una cadena interminable de callbacks de promesas puede dejar sin turno a los temporizadores y al renderizado."',
  },
  'javascript-promise-executor-sync-core': {
    prompt:
      'En las entrevistas preguntan la diferencia entre código síncrono y asíncrono. ¿Qué partes de este fragmento son realmente asíncronas? ¿Qué imprime, un valor por línea?',
    explanation:
      'El código síncrono se ejecuta hasta terminar en la pila de llamadas; el código asíncrono registra un callback que se ejecuta **más tarde**, en el mismo único hilo, cuando la pila está vacía.\n\n- El **executor de la Promise se ejecuta de forma síncrona** dentro de `new Promise`, así que `B` y `D` se imprimen de inmediato; `resolve` no detiene la función.\n- El cuerpo de una función `async` también se ejecuta de forma síncrona hasta su primer `await` (aquí no hay ninguno), así que `F` se imprime en orden.\n- Solo los callbacks de `.then` se difieren, como microtareas, en el orden en que se registraron: `C` y luego `G`.\n\nAsíncrono no es paralelo: envolver trabajo pesado de CPU en una Promise sigue bloqueando el hilo. Solo la I/O (o un Worker) se ejecuta realmente en otro lugar.',
  },
  'javascript-stale-closure-getter-core': {
    prompt:
      '`createCounter` debe mantener `count` privado (un closure) y a la vez exponer su valor vivo como `counter.count`, pero `counter.count` siempre es `0`. Corrige **`createCounter`** (deja `solution` como está) para que el valor expuesto refleje cada incremento. No muevas `count` al objeto como un campo escribible.',
    explanation:
      'Un closure es una función empaquetada junto con las **variables** (bindings) del scope donde se creó, así que `increment` sigue actualizando el mismo `count` mucho después de que `createCounter` haya retornado. Pero `{ count }` es la forma abreviada de `{ count: count }`: **copia el valor primitivo actual (0) en una propiedad** en el momento de la creación. A partir de ahí, la propiedad y la variable encerrada no tienen relación.\n\nUn getter (o una función `getCount()`) lee el binding vivo en cada acceso y mantiene la variable privada, ya que nada externo puede asignarla.\n\nUn bug relacionado aparece en React como *stale closure*: un callback creado durante un render antiguo sigue leyendo los bindings de ese render. Los closures además mantienen vivas todas las variables que capturan, y así es como los closures que retienen objetos grandes o nodos del DOM causan fugas de memoria.\n\n**Dilo en voz alta:** "Un closure captura variables, no valores, pero en el momento en que copias un primitivo a una propiedad de un objeto tomaste una instantánea; expón un getter si quieres el valor vivo."',
  },
  'javascript-var-let-const-loop-core': {
    prompt:
      'En las entrevistas preguntan la diferencia entre `var`, `let` y `const`. ¿Qué imprime esto, una línea por cada `console.log`?',
    explanation:
      '- `var` tiene **scope de función**: hay un solo `i` para todo el loop (incluso se escapa de él, por eso `typeof i` es `"number"`), y las tres funciones flecha leen su valor final, `3`.\n- `let` tiene **scope de bloque** y un loop `for (let ...)` crea un **binding nuevo en cada iteración**, así que cada función flecha captura su propio `j`. Fuera del loop `j` no existe, y `typeof` sobre un nombre no declarado devuelve `"undefined"` en lugar de lanzar un error.\n- `const` prohíbe **reasignar el binding** (un `TypeError` en tiempo de ejecución), no mutar el valor al que apunta: `list.push(2)` funciona sin problema. Usa `Object.freeze` o actualizaciones inmutables para el valor.\n\nAdemás: `let`/`const` tienen hoisting pero quedan en la zona muerta temporal hasta que se ejecuta su declaración, y `var` en el nivel superior de un script clásico se convierte en una propiedad de `window`.',
  },
  'javascript-prototype-shared-state-core': {
    prompt:
      'En las entrevistas preguntan cómo funciona la herencia prototípica. Este constructor tiene un bug clásico. ¿Qué imprime, una línea por cada `console.log`?',
    explanation:
      'Todo objeto tiene un enlace interno `[[Prototype]]`; `new Team()` lo apunta a `Team.prototype`. Las **lecturas** recorren la cadena hasta encontrar la propiedad (terminando en `null`). Las **escrituras** crean o actualizan una propiedad **propia** en el receptor, salvo que un setter heredado o una propiedad heredada no escribible las intercepte.\n\n- `a.add(\'x\')` *lee* `this.members`, encuentra el único array que está en el prototipo y lo muta, así que todas las instancias ven `["x"]`. El estado mutable en un prototipo es estado compartido.\n- `b.members = [\'y\']` *escribe*, creando en `b` una propiedad propia que **oculta** la del prototipo. Al borrarla, vuelve a quedar expuesto el array compartido.\n- `in` revisa toda la cadena; `Object.hasOwn` revisa solo el objeto en sí. Los métodos viven una sola vez en el prototipo, por eso se comparten a bajo costo.\n\nLa sintaxis `class` es azúcar sobre exactamente esto: los métodos van en `Class.prototype`, y el estado por instancia pertenece al constructor o a los campos de clase.\n\n**Dilo en voz alta:** "Las lecturas de propiedades recorren la cadena de prototipos, pero las escrituras caen en el propio objeto, así que pon el comportamiento en el prototipo y el estado en la instancia; los datos mutables en un prototipo se comparten entre todas las instancias."',
  },
  'javascript-static-vs-instance-core': {
    prompt:
      'En las entrevistas preguntan la diferencia entre un método estático y un método de instancia. ¿Qué imprime esto, una línea por cada `console.log`?',
    explanation:
      'Un método **estático** es una propiedad de la propia función constructora (`Temperature.fromFahrenheit`); un método de **instancia** vive en `Temperature.prototype` y las instancias lo alcanzan a través de la cadena de prototipos. Por eso las instancias no ven los estáticos (`typeof t.fromFahrenheit` es `"undefined"`), y los estáticos no tienen un `this` de instancia.\n\nDentro de un método estático, `this` es **la clase sobre la que se llamó**. `extends` también enlaza los constructores (`Object.getPrototypeOf(Reading) === Temperature`), así que `Reading.fromFahrenheit` se hereda y `new this(...)` construye un `Reading`. Eso convierte a los estáticos en el lugar idiomático para métodos factory, parsers y cachés que pertenecen al tipo y no a un objeto en particular.',
  },
  'javascript-this-call-site-core': {
    prompt:
      'En las entrevistas preguntan para qué sirve `this`. El fragmento se ejecuta como módulo ES (modo estricto). ¿Qué imprime, un valor por línea?',
    explanation:
      'En las funciones regulares, `this` se decide **en el punto de llamada**, con estas reglas en orden de prioridad: `new` > `bind` explícito > `call`/`apply` > llamada de método `obj.fn()` > llamada simple (`undefined` en modo estricto, el objeto global en scripts no estrictos).\n\n- `regular()` es una llamada simple después de la desestructuración: el receptor se perdió.\n- `arrow` se creó en el nivel superior del módulo, donde `this` es `undefined`; las funciones flecha nunca tienen su propio `this`, y un literal de objeto no es un scope.\n- El callback `function` dentro de `map` es una llamada simple, así que pierde `account`; la función flecha dentro de `nestedArrow` hereda `this` de `nestedArrow`, que se llamó como método.\n- Una función enlazada ignora `call`/`apply` posteriores: gana el primer `bind`.\n\n**Dilo en voz alta:** "`this` no depende de dónde se escribe la función sino de cómo se llama; las funciones flecha se excluyen y toman `this` del scope que las rodea, y `bind` lo fija de forma permanente."',
  },
  'javascript-method-vs-function-core': {
    prompt:
      'En las entrevistas preguntan la diferencia entre un método y una función.\n```js\nconst cart = {\n  items: [\'a\', \'b\'],\n  count() {\n    return this.items.length;\n  },\n};\nsetTimeout(cart.count, 0);\n```\n¿Qué afirmación es correcta?',
    explanation:
      'JavaScript no tiene un tipo separado para los métodos: un método es una propiedad cuyo valor es una función (`typeof` es `"function"`) y que normalmente lee `this`. El enlace con el objeto ocurre solo en la expresión de llamada `cart.count()`. Pasar `cart.count` entrega la función sola; luego el temporizador la llama con un receptor propio que no es `cart` (`window` en el navegador, un objeto `Timeout` en Node), así que `this.items` es `undefined` y leer `.length` lanza un `TypeError` dentro del callback del temporizador.\n\nSoluciones: `setTimeout(() => cart.count(), 0)` o `setTimeout(cart.count.bind(cart), 0)`. Una función flecha como método *no* ayuda: las funciones flecha toman `this` del scope que las rodea, no del literal de objeto. Los métodos abreviados sí difieren en dos detalles: no se pueden usar con `new` y pueden usar `super`.',
    options: {
      a:
        'Un método es solo una función guardada como propiedad de un objeto; `this` viene de la llamada, así que pasar `cart.count` como callback pierde `cart` y la llamada lanza un error.',
      b:
        'Un método queda enlazado de forma permanente al objeto donde se definió, así que `setTimeout(cart.count, 0)` devuelve 2 sin problemas.',
      c: 'Los métodos deberían escribirse como funciones flecha para que `this` quede enlazado al literal de objeto.',
      d: 'Los métodos son un tipo aparte: `typeof cart.count` es `"method"`.',
    },
  },
  'javascript-promise-chain-recovery-core': {
    prompt:
      'En las entrevistas te piden explicar las promesas. Sigue la resolución, la propagación de errores y `finally` a lo largo de este código. ¿Qué imprime, una línea por cada `console.log`?',
    explanation:
      'Una promesa es un marcador de posición para un valor futuro con tres estados: **pending** y luego, exactamente una vez, **fulfilled** o **rejected**. Una vez resuelta es inmutable, así que las llamadas posteriores a `reject` y `resolve` se ignoran.\n\nCada `.then`/`.catch`/`.finally` devuelve una promesa **nueva**:\n- Un `throw` dentro de `then` rechaza esa nueva promesa; el rechazo se salta los handlers de éxito hasta llegar a un `catch`.\n- Un `catch` que **devuelve** un valor recupera la cadena con ese valor (2). Vuelve a lanzar el error si solo querías registrarlo.\n- `finally` no recibe argumentos y **deja pasar el valor anterior**; su valor de retorno se ignora (salvo que lance un error o devuelva una promesa rechazada).\n\n`first` se imprime primero porque su handler se encoló antes, mientras la otra cadena necesitaba varios saltos de microtarea.',
  },
  'javascript-async-foreach-fix-core': {
    prompt:
      'Este bug, favorito de los revisores, devuelve `0` sin importar la entrada. Corrige `solution` para que devuelva la suma de los precios de `ids`, obteniéndolos de forma **concurrente**. No modifiques `fetchPrice`.',
    explanation:
      '`forEach` ignora las promesas que devuelve su callback, así que `solution` retorna antes de que llegue cualquier precio. Aquí se esconden dos problemas más:\n- **Actualizaciones perdidas:** `total += await x` lee `total` *antes* del await. Con callbacks concurrentes, cada uno lee `0`, así que aunque esperaras, gana el último que escribe.\n- **Rechazos no manejados:** un callback que falla rechaza una promesa que nadie observa.\n\nJavaScript maneja el trabajo asíncrono con callbacks, promesas y `async`/`await` (azúcar sobre las promesas). Elige la forma a propósito: `for...of` con `await` para trabajo **secuencial** (orden, límites de tasa), `Promise.all(items.map(...))` para trabajo **concurrente** que falla rápido, `Promise.allSettled` cuando un fallo parcial es aceptable, y un limitador de concurrencia (estilo p-limit) cuando la lista es grande.\n\n**Dilo en voz alta:** "`forEach` no entiende de promesas; mapeo a promesas y hago await de `Promise.all` para tener concurrencia, o uso `for...of` con `await` cuando importan el orden o los límites de tasa, y nunca acumulo estado compartido entre awaits concurrentes."',
  },
  'javascript-promisify-callback-core': {
    prompt:
      'Una librería legacy usa callbacks estilo Node con el error primero. Implementa `promisify(fn)` para que devuelva una función que reciba los mismos argumentos (sin el callback) y devuelva una Promise que se **rechace** con el error del callback o se **resuelva** con el resultado. `solution` muestra el uso con async/await que debes soportar.',
    explanation:
      'Esta es toda la historia del JavaScript asíncrono en una sola función: **callbacks** (con el error primero, por convención de Node), envueltos en una **Promise**, consumida con **async/await**.\n\n- El constructor de Promise es el puente: llama a la API antigua dentro del executor y dirige `error` a `reject` y el valor a `resolve`.\n- Rest/spread (`...args`) mantiene el wrapper genérico para cualquier aridad.\n- `await` convierte el rechazo en una excepción, así que `try/catch` funciona como en código síncrono.\n\nLos callbacks se componen mal (anidamiento, sin un canal único de errores, fáciles de llamar dos veces); las promesas se resuelven una sola vez y se encadenan. Node incluye `util.promisify` y la mayoría de los módulos core tienen variantes con promesas (`fs/promises`); si `fn` depende de `this`, el wrapper debe ser una `function` regular (una función flecha no tiene `this` propio) y reenviarlo con `fn.call(this, ...args, callback)`.',
  },
  'javascript-map-parseint-core': {
    prompt:
      'En las entrevistas preguntan para qué sirve `Array.prototype.map`. Estos son los casos borde que se espera que un senior conozca. ¿Qué imprime esto, una línea por cada `console.log`?',
    explanation:
      '`map` construye un **array nuevo de la misma longitud** llamando al callback con `(element, index, array)`.\n\n- `parseInt` acepta `(string, radix)`, así que recibe el índice como base: `parseInt(\'2\', 1)` y `parseInt(\'3\', 2)` son `NaN`. Pasa una función flecha explícita, `(s) => parseInt(s, 10)`, o usa `Number`.\n- `map` se salta los huecos de los arrays dispersos y los conserva como huecos.\n- `map` no muta el *array*, pero no hace nada para impedir que el callback mute los *elementos*: el resultado comparte los mismos objetos. Devuelve `{ ...item, n: item.n + 1 }` para una transformación realmente inmutable.\n- Un callback que no retorna nada produce posiciones `undefined`; `map` nunca es un filtro. Usa `filter` y luego `map`, `flatMap` o `reduce`, y usa `forEach` cuando solo quieras efectos secundarios.',
  },
  'javascript-pipe-functional-core': {
    prompt:
      'En las entrevistas preguntan cómo se aplica la programación funcional en JavaScript. Implementa la función de orden superior `pipe(...fns)`: devuelve una función que pasa su entrada por `fns` **de izquierda a derecha**, y cada salida alimenta a la siguiente. Sin funciones, devuelve la entrada sin cambios.',
    explanation:
      'La programación funcional construye programas a partir de **funciones puras** (misma entrada, misma salida, sin efectos secundarios) combinadas mediante **funciones de orden superior**, evitando el estado mutable compartido. JavaScript lo permite porque las funciones son valores de primera clase: puedes pasarlas, devolverlas y guardarlas.\n\n`pipe` es un `reduce` sobre funciones: el acumulador es el valor que fluye. `compose` es lo mismo de derecha a izquierda (`reduceRight`). Cada paso aquí es puro y trivial de probar con tests unitarios; el pipeline es solo datos.\n\nEn el JavaScript del día a día esto aparece como `map`/`filter`/`reduce` en lugar de loops con mutación, actualizaciones de estado inmutables en los reducers de Redux y pequeñas utilidades componibles. La postura pragmática: mantén el núcleo puro y empuja los efectos secundarios (I/O, logging, tiempo) hacia los bordes.',
  },
  'javascript-memoize-cache-key-core': {
    prompt:
      'En las entrevistas te piden explicar la memoización. Implementa `memoize(fn)` para que las llamadas repetidas con los **mismos argumentos** devuelvan el resultado en caché sin volver a llamar a `fn`. Los argumentos son serializables a JSON, y listas de argumentos distintas nunca deben compartir una entrada de caché (`(1, 2)` y `("1,2")` son llamadas diferentes).',
    explanation:
      'La memoización guarda en caché el resultado de una función por cada entrada, cambiando memoria por tiempo. La caché vive en un **closure**, privada para la función devuelta.\n\nLo difícil es la **clave**:\n- `args.join(\',\')` o `String(args)` colisionan (`[1, 2]` y `[\'1,2\']` se convierten ambos en `"1,2"`). `JSON.stringify(args)` conserva tipos y límites para entradas serializables.\n- Los argumentos de tipo objeto comparados por identidad van en un `WeakMap` (las entradas se recolectan junto con la clave); las claves estructurales necesitan un serializador estable.\n- Usa `cache.has`, no una comprobación de truthiness, o los resultados `0`, `""` y `undefined` en caché se vuelven a calcular.\n\nSolo memoiza funciones **puras**: una llamada impura en caché devuelve datos obsoletos. Un `Map` sin límite es una fuga de memoria en un proceso de larga duración, así que las cachés de producción necesitan un límite LRU o un TTL. Para funciones asíncronas, guarda en caché la **promesa** para que los llamadores concurrentes compartan una sola petición en curso, y elimínala si se rechaza.\n\n**Dilo en voz alta:** "La memoización solo es correcta para funciones puras, la clave de caché es la verdadera decisión de diseño, y en un servidor toda caché necesita una política de expulsión o es una fuga."',
  },
  'javascript-immutability-freeze-core': {
    prompt:
      'En las entrevistas preguntan sobre inmutabilidad. El fragmento se ejecuta como módulo ES (modo estricto). ¿Qué imprime, una línea por cada `console.log`?',
    explanation:
      'Los primitivos ya son inmutables; los objetos y arrays son mutables por defecto. La inmutabilidad significa producir valores **nuevos** en lugar de cambiar los existentes.\n\n- `Object.freeze` es **superficial**: el array anidado `hosts` sigue siendo mutable. Un congelamiento profundo debe ser recursivo.\n- En modo estricto, escribir en una propiedad congelada **lanza un error**; en modo no estricto falla en silencio, lo cual es peor.\n- El spread crea un objeto nuevo, no congelado, que **comparte** las referencias anidadas (structural sharing). Ese es el modelo que usan Redux, el estado de React e Immer: copia la ruta que cambias y comparte el resto.\n- ES2023 agregó métodos de array que no mutan (`toSorted`, `toReversed`, `toSpliced`, `with`) justamente para esto; `sort` y `reverse` mutan en el lugar.\n\nPor qué vale la pena: flujo de datos predecible, detección de cambios barata por referencia (`prev !== next`), compartir datos entre módulos de forma segura y menos bugs del tipo "¿quién cambió esto?".\n\n**Dilo en voz alta:** "`const` y `Object.freeze` son superficiales; la inmutabilidad real es una disciplina de devolver objetos nuevos con structural sharing, y eso es lo que hace funcionar la detección de cambios por igualdad de referencia en React y Redux."',
  },
  'javascript-arrow-vs-regular-core': {
    prompt:
      'En las entrevistas preguntan la diferencia entre las funciones flecha y las funciones regulares. ¿Qué imprime esto, una línea por cada `console.log`?',
    explanation:
      'Las funciones flecha no son solo una sintaxis más corta. **No tienen** `this`, `arguments`, `super` ni `new.target` **propios**; todos se resuelven léxicamente desde la función que las rodea.\n\n- No hay objeto `arguments`: usa parámetros rest.\n- No tienen `prototype` ni `[[Construct]]`, así que `new` lanza un `TypeError`.\n- `call`, `apply` y `bind` no pueden cambiar el `this` de una función flecha; `viaArrow` conserva el `this` de `describe`.\n\nRegla práctica: funciones flecha para callbacks que necesitan el `this` externo (métodos de array, handlers de promesas, handlers de React); funciones regulares o métodos abreviados para métodos de objeto, métodos de prototipo y constructores. Una función flecha como método de un literal de objeto es un bug, porque captura el `this` externo, no el objeto.',
  },
  'javascript-destructuring-defaults-core': {
    prompt: 'En las entrevistas te piden explicar la desestructuración. ¿Qué imprime esto, una línea por cada `console.log`?',
    explanation:
      'La desestructuración extrae elementos de un array (por **posición**, mediante el iterador) o propiedades de un objeto (por **nombre**) hacia bindings.\n\n- Los valores por defecto se aplican **solo cuando el valor es `undefined`**, no `null`: `b` sigue siendo `null`. Esta es la sorpresa más común en producción con datos de una API.\n- `c: renamed = 3` renombra y asigna un valor por defecto a la vez; los huecos (`, ,`) saltan posiciones; `...rest` recoge el resto.\n- Los patrones anidados necesitan su propio respaldo (`= {}`); de lo contrario, desestructurar un objeto inexistente lanza un error.\n- Desestructurar `null` o `undefined` lanza un `TypeError`, por eso las firmas de funciones suelen escribir `({ page = 1 } = {})`.\n- Intercambiar con `[p, q] = [q, p]` requiere que la sentencia anterior termine en punto y coma, o la ASI une las líneas.',
  },
  'javascript-spread-shallow-core': {
    prompt: 'En las entrevistas preguntan para qué sirve el operador spread. ¿Qué imprime esto, una línea por cada `console.log`?',
    explanation:
      'El spread expande un iterable en elementos (literales de array, argumentos de una llamada) o las propiedades enumerables propias de un objeto en un nuevo literal de objeto.\n\n- La copia es **superficial**: `copy.tags` es el mismo array que `base.tags`, así que el `push` aparece en ambos. **Reasignar** `copy.meta` solo vuelve a enlazar la propiedad de la copia. Para una copia profunda de verdad usa `structuredClone`.\n- Las propiedades posteriores sobrescriben a las anteriores, que es el idioma para valores por defecto más sobrescrituras.\n- Hacer spread de `null`/`undefined` dentro de un **objeto** no hace nada, pero dentro de un **array** o una llamada lanza un error, porque no son iterables.\n- Los strings son iterables por code point, y el spread en una llamada reemplaza a `fn.apply(null, arr)`.\n\nLa sintaxis espejo, `...rest` en parámetros y desestructuración, recoge en lugar de expandir.',
  },
  'javascript-set-semantics-core': {
    prompt: 'En las entrevistas preguntan para qué sirve el objeto `Set`. ¿Qué imprime esto, una línea por cada `console.log`?',
    explanation:
      'Un `Set` guarda **valores únicos en orden de inserción**, con `add`, `has` y `delete` en O(1) en promedio.\n\n- La unicidad usa **SameValueZero**: como `===`, excepto que `NaN` es igual a `NaN` (así que se guarda una sola vez) y `0`/`-0` son lo mismo. No hay coerción: `1` y `\'1\'` son distintos.\n- Los objetos se comparan **por referencia**; dos objetos que se ven iguales son dos entradas. Para eliminar duplicados de registros por id, usa un `Map` con el id como clave.\n- El constructor acepta cualquier iterable, así que `[...new Set(arr)]` es la forma idiomática de eliminar duplicados conservando el orden de primera aparición.\n- `add` devuelve el set, así que las llamadas se encadenan.\n\nPrefiere `set.has(x)` sobre `array.includes(x)` dentro de loops: convierte una intersección O(n*m) en O(n+m). `WeakSet` guarda objetos de forma débil para rastrear "ya visitados" sin fugas de memoria.',
  },
  'javascript-strict-mode-core': {
    prompt:
      'En las entrevistas te piden explicar el modo estricto. Este código es un módulo ES, así que ya es estricto. ¿Qué imprime, un valor por línea?',
    explanation:
      'El modo estricto (`\'use strict\'`, o **automáticamente** en módulos ES y cuerpos de `class`) convierte los fallos silenciosos en errores y elimina semánticas heredadas:\n\n- Asignar a un nombre no declarado lanza `ReferenceError` en lugar de crear una global accidental.\n- Escribir en propiedades de solo lectura o congeladas, y borrar propiedades no configurables, lanza `TypeError` en lugar de no hacer nada.\n- Una llamada simple a una función recibe `this === undefined` en lugar del objeto global, así que un receptor perdido falla de forma visible.\n- `arguments` ya no es un alias de los parámetros con nombre, y `with`, los literales octales y los nombres de parámetros duplicados son errores de sintaxis.\n\nEstas reglas también permiten que los motores optimicen mejor. En la práctica, el código moderno es estricto por defecto porque se escribe como módulos y clases; el riesgo que queda son los scripts antiguos concatenados y las etiquetas `<script>` inline.\n\n**Dilo en voz alta:** "Los módulos ES y los cuerpos de clase siempre son estrictos; el modo estricto convierte fallos silenciosos, como las globales accidentales o las escrituras en objetos congelados, en errores lanzados, y hace que un `this` sin enlazar sea undefined en lugar del objeto global."',
  },
  'javascript-event-delegation-closest-core': {
    prompt:
      'En las entrevistas te piden explicar la delegación de eventos. Un solo listener en la lista maneja el borrado de cada elemento actual **y futuro**:\n```js\nconst list = document.querySelector(\'#todo-list\');\nlist.addEventListener(\'click\', (event) => {\n  const button = event.target.closest(\'button[data-action="delete"]\');\n  if (!button || !list.contains(button)) return;\n  removeTodo(button.closest(\'li\').dataset.id);\n});\n```\n¿Por qué el handler llama a `event.target.closest(...)` en lugar de comprobar `event.target.matches(...)`?',
    explanation:
      'La delegación de eventos pone **un solo listener en un ancestro común** y se apoya en el **bubbling**: un clic en cualquier descendiente sube a través de sus ancestros, así que el ancestro lo ve. Funciona con elementos agregados después y evita adjuntar (y limpiar) un listener por elemento.\n\n- `event.target` es el elemento donde se originó el evento, a menudo un hijo del elemento que te interesa; `event.currentTarget` es el elemento que tiene el listener (el `<ul>`, que es con lo que lo confunde la opción de "siempre es el `<ul>`").\n- `closest` sube desde el target; la guarda `list.contains` evita una coincidencia *fuera* de la lista (por ejemplo, cuando hay listas anidadas).\n- `matches` funciona bien con elementos nuevos; simplemente falla cuando el clic cayó sobre un hijo.\n\nAdvertencias: `focus`/`blur`/`mouseenter` no hacen bubbling (usa `focusin`/`focusout`, `mouseover`), y un hijo que llama a `stopPropagation()` rompe en silencio el handler delegado. React mismo delega: adjunta sus listeners en el contenedor raíz.',
    options: {
      a:
        '`event.target` es el elemento más interno que recibió el clic (por ejemplo, un ícono `<svg>` dentro del botón), así que el handler sube hasta el botón; `closest` devuelve `null` cuando el clic no fue dentro de uno.',
      b:
        '`event.target` siempre es el `<ul>` al que está adjunto el listener, así que se necesita `closest` para llegar al botón.',
      c: '`matches` no funciona con elementos que se agregaron después de registrar el listener.',
      d: '`closest` impide que el evento siga haciendo bubbling, lo que evita que el borrado se ejecute dos veces.',
    },
  },
  'javascript-data-binding-core': {
    prompt:
      'En las entrevistas te piden explicar el **data binding** en JavaScript. Ve más allá de la definición: compara el binding unidireccional con el bidireccional, esboza cómo implementarías el binding bidireccional para un formulario en JavaScript puro y di qué eligió React y por qué.',
    explanation:
      'La respuesta común ("sincronización entre el modelo y la vista") es la versión junior. La versión senior demuestra que conoces el **mecanismo** (eventos en una dirección, observación mediante Proxy/setters/suscripciones en la otra), los **modos de fallo** (ciclos de retroalimentación, actualizaciones en cascada, renders de más) y por qué el ecosistema convergió en el flujo unidireccional.\n\n**Dilo en voz alta:** "El binding bidireccional son solo dos bindings unidireccionales, eventos hacia el modelo y observación de vuelta hacia la vista; React hace explícita la segunda mitad con componentes controlados para que cada cambio de estado tenga una sola fuente rastreable."',
    modelAnswer:
      'El data binding mantiene sincronizados el modelo (el estado de la aplicación) y la vista (el DOM) para que no tengas que escribir a mano cada actualización. En el binding **unidireccional** el estado fluye hacia abajo, hacia la vista, y la entrada del usuario cambia el estado solo mediante handlers de eventos o acciones explícitas; React y Redux funcionan así. En el binding **bidireccional** una edición en la vista escribe directamente en el modelo y los cambios del modelo vuelven a renderizar la vista, como en `[(ngModel)]` de Angular o `v-model` de Vue. En JavaScript puro pondría un solo listener delegado de `input` en el formulario que escriba `model[event.target.name] = event.target.value`, y envolvería el modelo en un `Proxy` cuyo trap `set` (o un observer con suscriptores) actualice los inputs enlazados y cualquier parte del DOM que dependa de ellos. Omitiría las escrituras cuando el valor no cambia para evitar ciclos de actualización, y agruparía las actualizaciones del DOM en una microtarea o en `requestAnimationFrame`. React eligió el flujo unidireccional con una sola fuente de verdad porque las actualizaciones explícitas son rastreables y depurables a escala; el comportamiento bidireccional se recrea con componentes controlados (`value` más `onChange`). El trade-off es boilerplate contra previsibilidad: el bidireccional es cómodo para formularios, pero las actualizaciones implícitas en cascada se vuelven difíciles de razonar en aplicaciones grandes.',
    rubric: [
      'Define el binding como la sincronización entre modelo y vista, y distingue el unidireccional del bidireccional',
      'Describe un mecanismo en JS puro: eventos input/change para actualizar el modelo más un Proxy, setter u observer para actualizar la vista',
      'Menciona cómo evitar ciclos de actualización o agrupar las actualizaciones del DOM',
      'Explica el flujo de datos unidireccional de React y los componentes controlados como su equivalente bidireccional',
      'Plantea el trade-off: comodidad contra trazabilidad a escala',
    ],
  },
  'javascript-coercion-to-primitive-core': {
    prompt:
      '¿Cómo se convierten los objetos y `null` con `+`, los template literals, `==` y `>=`? ¿Qué imprime esto, una línea por cada `console.log`?',
    explanation:
      'Cuando un objeto se encuentra con un operador, se convierte con **ToPrimitive** y una pista (hint): `+` y `==` usan la pista *default* (`valueOf` primero); los template literals y `String()` usan la pista *string* (`toString` primero). `Symbol.toPrimitive` sobrescribe ambas.\n\n- Luego `==` compara primitivos, así que `price == 42` es `true`; `===` nunca convierte, así que tipos distintos simplemente no son iguales.\n- `[] == false`: `false` se convierte en `0`, `[]` se convierte en `""` y luego en `0`, así que es `true`, mientras que `!![]` es `true` porque todo objeto es truthy. El mismo valor es "igual a false" y a la vez truthy.\n- `null == 0` es `false` porque `==` trata a `null` como caso especial: solo es igual a `undefined`. Pero los operadores relacionales convierten con ToNumber, así que `null >= 0` es `true`.\n\nEsta inconsistencia es el argumento para usar `===` en todas partes, con una excepción aceptada: `x == null` como comprobación deliberada de `null` y `undefined` a la vez.\n\n**Dilo en voz alta:** "`===` compara sin conversión; `==` ejecuta el algoritmo de igualdad abstracta con ToPrimitive y ToNumber, y el único `==` que permito en un code review es `x == null`."',
  },
  'javascript-async-operations-explain': {
    prompt: '¿Cómo maneja JavaScript las operaciones asíncronas? Explícame las opciones y cuándo elegirías cada una.',
    explanation:
      'La respuesta de referencia común enumera callbacks, promesas y async/await. Una respuesta senior empieza un nivel más abajo, con **quién hace la espera** (el host, no el hilo de JavaScript), trata los tres estilos como la evolución de la misma idea de continuación y termina con preocupaciones de producción: paralelismo, propagación de errores, cancelación y trabajo limitado por I/O frente a trabajo limitado por CPU.\n\n**Dilo en voz alta:** "JavaScript nunca espera en el hilo principal: el host hace la I/O y encola una continuación. Callbacks, promesas y async/await son tres formas de escribir esa continuación, y async/await gana porque los errores y el flujo de control se leen como código síncrono."',
    modelAnswer:
      'JavaScript ejecuta tu código en un solo hilo, así que la asincronía viene del host (el navegador, o libuv en Node), que hace la espera de temporizadores, red e I/O de archivos y luego encola un callback cuando el trabajo termina; el event loop ejecuta ese callback cuando la pila de llamadas está vacía. El patrón más antiguo son los callbacks, que funcionan pero se anidan mal, obligan a manejar los errores a mano (la convención de Node del error primero) e invierten el control, porque le entregas tu continuación al código de otro. Las promesas representan el resultado futuro como un valor: se resuelven una sola vez, se componen con cadenas de `then` y combinadores como `Promise.all` y `Promise.allSettled`, y propagan los errores a un único `catch`. `async`/`await` es sintaxis sobre las promesas: `await` suspende la función y la reanuda como microtarea, así que el código se lee de arriba abajo y `try`/`catch` vuelve a funcionar. Las trampas que vigilo son la serialización accidental (hacer await de llamadas independientes una tras otra en lugar de usar `Promise.all`), `forEach` con un callback async (nadie lo espera), los rechazos no manejados y la falta de timeouts o de cancelación con `AbortController`. Nada de esto vuelve asíncrono el trabajo pesado de CPU; para eso se necesita un Web Worker o un worker thread.',
    rubric: [
      'Explica el mecanismo: un solo hilo de JS, las APIs del host hacen la espera y el event loop ejecuta la continuación encolada',
      'Compara callbacks, promesas y async/await con una desventaja concreta de los callbacks (anidamiento, inversión de control, errores manuales)',
      'Nombra una herramienta de composición (Promise.all, allSettled, race, any) y la trampa del await en serie',
      'Cubre el manejo de errores y la cancelación o los timeouts (try/catch, rechazos no manejados, AbortController)',
      'Señala que el trabajo limitado por CPU necesita workers, no async',
    ],
  },
  'javascript-equality-explain': {
    prompt: '¿Cuál es la diferencia entre `==` y `===`? ¿Cuándo, si acaso, permitirías `==` en un code review?',
    explanation:
      'La respuesta común se queda en "`==` aplica coerción, `===` no". Los entrevistadores presionan por el **algoritmo** (ToNumber, ToPrimitive, el caso especial de `null`/`undefined`), por **`NaN` y `Object.is`**, y por una **política** que realmente harías cumplir.\n\n**Dilo en voz alta:** "`===` compara tipo y valor sin conversión; `==` ejecuta un algoritmo de coerción con suficientes casos borde como para que lo prohíba por lint salvo en `x == null`, y recurro a `Object.is` cuando importan `NaN` o el cero con signo."',
    modelAnswer:
      '`===` es la igualdad estricta: si los tipos difieren devuelve `false` sin convertir nada, y para objetos compara referencias. `==` ejecuta el algoritmo de igualdad abstracta, que aplica coerción: los strings y booleanos se convierten en números, los objetos se reducen con ToPrimitive (`valueOf`, luego `toString`, o `Symbol.toPrimitive`), y `null` y `undefined` solo son iguales entre sí. Eso produce sorpresas como que `\'\' == 0`, `\'0\' == false` y `[] == false` sean todos `true`, mientras que `null == 0` es `false`. Ninguno de los dos operadores trata a `NaN` como igual a sí mismo; `Object.is` implementa SameValue, así que es la herramienta cuando necesitas que `NaN` sea igual a `NaN` o que `+0` sea distinto de `-0`. Mi regla es `===` en todas partes, impuesta con la regla `eqeqeq` de ESLint, con una excepción deliberada: `value == null` como forma concisa de comprobar `null` y `undefined` a la vez, que la opción `null: \'ignore\'` de la regla permite. Para objetos, ninguno de los dos operadores compara contenidos, así que la igualdad estructural necesita un helper de deep-equal.',
    rubric: [
      'Dice que === nunca aplica coerción mientras que == aplica la igualdad abstracta con conversión de tipos',
      'Da al menos una sorpresa concreta de coerción (\'\' == 0, [] == false, o que null == 0 sea false)',
      'Menciona NaN y Object.is (SameValue) como el caso que va más allá de ambos operadores',
      'Da una regla de equipo: === por defecto, x == null como única excepción aceptada, impuesta por lint',
    ],
  },
  'javascript-closures-explain': {
    prompt: '¿Puedes explicar los closures? Dame un caso de uso real y una forma en que los closures causan bugs.',
    explanation:
      'La respuesta de referencia común describe el acceso a los scopes externos. La capa senior es que los closures capturan **bindings vivos**, lo que explica tanto el bug de `var` en los loops como los stale closures de React, además de la consecuencia sobre el **ciclo de vida**: todo lo que un closure referencia sigue siendo alcanzable.\n\n**Dilo en voz alta:** "Un closure es una función más el scope donde se creó; captura variables por referencia, que es lo que hace posible el estado privado y también lo que causa bugs de stale closure cuando el binding capturado no es el que crees."',
    modelAnswer:
      'Un closure es una función junto con el entorno léxico en el que se creó: conserva referencias a las variables externas que usa, así que siguen vivas después de que la función externa retorna. Captura bindings, no valores, así que si la variable cambia después, el closure ve el valor nuevo. Los usos reales están en todas partes: estado privado mediante el patrón módulo o factories (un contador cuyo estado es inalcanzable desde fuera), aplicación parcial y fábricas de funciones, cachés de memoización, y todo callback o event handler que necesita contexto. El bug clásico es `var` en un loop, donde todos los callbacks comparten un único binding con scope de función; `let` lo corrige porque cada iteración obtiene un binding nuevo. En React el mismo mecanismo produce stale closures: el callback de un effect o de un intervalo captura el estado del render que lo creó, y lo corriges con un array de dependencias correcto, una actualización funcional o un ref. Los closures también pueden causar fugas de memoria cuando un callback de larga vida, como un listener que nunca se elimina, mantiene alcanzable un objeto grande, porque todo lo que un closure referencia vive tanto como el closure.',
    rubric: [
      'Define un closure como una función más su entorno léxico, que captura bindings y no valores',
      'Da un uso práctico (estado privado, factories, memoización, callbacks)',
      'Explica el bug de var en un loop y por qué let lo corrige',
      'Menciona los stale closures (effects o intervalos de React) o la retención de memoria por listeners de larga vida',
    ],
  },
  'javascript-null-undefined-explain': {
    prompt: '¿Cuál es la diferencia entre `null` y `undefined`, y cómo manejas ambos en una API o en un codebase?',
    explanation:
      'La respuesta común es la definición. Una respuesta senior agrega las **diferencias observables** que causan bugs (los valores por defecto ignoran `null`, JSON descarta `undefined`, `typeof null`) y una **convención** que sobreviva a los límites de serialización.\n\n**Dilo en voz alta:** "`undefined` significa que nadie lo asignó, `null` significa que alguien lo dejó vacío a propósito; los valores por defecto y JSON los tratan distinto, así que uso `??` para manejar ambos y mantengo una convención clara en el límite de la API, como ausente frente a `null` en un PATCH."',
    modelAnswer:
      '`undefined` es el valor por defecto del lenguaje para "todavía no hay valor": una variable sin asignar, una propiedad inexistente, un argumento faltante y una función sin `return` lo producen. `null` es un valor explícito que un programador asigna para decir "vacío intencionalmente". Se comportan distinto: `typeof undefined` es `\'undefined\'` pero `typeof null` es `\'object\'`, un bug histórico; `Number(undefined)` es `NaN` mientras que `Number(null)` es `0`; los parámetros por defecto y los valores por defecto de la desestructuración se aplican solo a `undefined`, no a `null`; y `JSON.stringify` descarta las propiedades cuyo valor es `undefined` pero conserva `null`. Son laxamente iguales entre sí y a nada más, por eso `x == null` comprueba ambos. Los operadores modernos los tratan juntos: `??` recurre al valor alternativo solo con `null` o `undefined` (a diferencia de `||`, que también se traga `0` y `\'\'`), y `?.` hace cortocircuito con cualquiera de los dos. En una API elijo una convención, normalmente `null` para "se sabe que está vacío" y un campo ausente para "no se proporcionó", porque eso se mapea limpiamente a JSON y a la semántica de PATCH, donde omitir un campo y borrarlo significan cosas distintas.',
    rubric: [
      'Distingue el valor por defecto del motor (undefined) del valor vacío intencional (null)',
      'Nombra diferencias de comportamiento concretas (typeof, conversión con Number, valores por defecto, JSON.stringify)',
      'Usa ?? y ?. correctamente y contrasta ?? con ||',
      'Propone una convención de API, como ausente frente a null en payloads de PATCH',
    ],
  },
  'javascript-event-loop-explain': {
    prompt: '¿Cómo funciona el event loop de JavaScript? Sé preciso con las microtareas y las macrotareas.',
    explanation:
      'La respuesta de referencia común describe una sola "cola de callbacks". Ese es el modelo junior; el modelo senior tiene **dos colas con reglas de vaciado distintas** más **oportunidades de renderizado**, y predice la salida real.\n\n**Dilo en voz alta:** "Después de cada tarea, el motor vacía toda la cola de microtareas antes de renderizar o tomar la siguiente tarea, así que los callbacks de promesas se adelantan a los temporizadores, y tanto una tarea larga como una cadena interminable de microtareas congelan la página."',
    modelAnswer:
      'JavaScript se ejecuta en una pila de llamadas por hilo; el event loop es el planificador del host que decide qué se ejecuta cuando esa pila está vacía. Los temporizadores cumplidos, la I/O y los eventos de UI encolan **tareas** (macrotareas); el loop toma una tarea, la ejecuta hasta terminar y luego vacía por completo la cola de **microtareas**, que contiene las reacciones de promesas, las continuaciones de `await` y los callbacks de `queueMicrotask`. En el navegador, el renderizado (estilos, layout, paint, más los callbacks de `requestAnimationFrame`) puede ocurrir entre tareas, nunca en medio de una. Ese orden explica por qué el `then` de una promesa resuelta se ejecuta antes que un `setTimeout(fn, 0)`, y por qué el código después de `await` se reanuda de forma asíncrona incluso cuando la promesa ya estaba resuelta. También explica los modos de fallo: una tarea síncrona larga congela la UI y retrasa todos los temporizadores, y una microtarea que sigue programando microtareas deja sin turno tanto al renderizado como a las tareas. Node agrega sus propias fases (timers, poll, check para `setImmediate`, close callbacks) y una cola de `process.nextTick` que se ejecuta antes de las microtareas de promesas. Las reglas prácticas son mantener las tareas cortas, dividir el trabajo largo o mover el trabajo de CPU a un worker, y nunca depender de la precisión de los temporizadores.',
    rubric: [
      'Explica la pila de llamadas única, la ejecución hasta completar (run-to-completion) y que el loop toma trabajo cuando la pila está vacía',
      'Distingue las microtareas (promesas, await, queueMicrotask) de las tareas (temporizadores, I/O, eventos) y dice que las microtareas se vacían por completo después de cada tarea',
      'Menciona el renderizado entre tareas o requestAnimationFrame en el navegador',
      'Nombra un modo de fallo: tareas largas que bloquean, microtareas que acaparan el turno o temporizadores retrasados',
      'Extra: las fases de Node, setImmediate y process.nextTick',
    ],
  },
  'javascript-var-let-const-explain': {
    prompt: '¿Cuál es la diferencia entre `var`, `let` y `const`, y qué usas por defecto?',
    explanation:
      'La respuesta común cubre el scope y la redeclaración. Los entrevistadores profundizan en la **TDZ**, en **`const` frente a la inmutabilidad** y en el comportamiento del **binding en los loops**, porque ahí viven los bugs.\n\n**Dilo en voz alta:** "`var` tiene scope de función y vale `undefined` en silencio antes de su línea; `let` y `const` tienen scope de bloque y lanzan un error en la zona muerta temporal. Uso `const` por defecto, sabiendo que congela el binding, no el objeto."',
    modelAnswer:
      '`var` tiene scope de función (o global), tiene hoisting y se inicializa en `undefined`, se puede redeclarar y, en el nivel superior de un script clásico, se convierte en una propiedad del objeto global. `let` y `const` tienen scope de bloque y también tienen hoisting, pero quedan sin inicializar en la zona muerta temporal hasta que se ejecuta la declaración, así que tocarlas antes lanza un `ReferenceError` en lugar de leer `undefined` en silencio. `let` se puede reasignar y `const` no, pero `const` hace inmutable el **binding**, no el valor, así que un objeto o array `const` todavía se puede mutar. En los loops, `let` crea un binding nuevo por iteración, por eso los closures sobre una variable de loop `let` ven el valor de su propia iteración, mientras que `var` comparte un solo binding. Ni `let` ni `const` se pueden redeclarar en el mismo scope. Mi valor por defecto es `const` en todas partes, `let` solo cuando una variable realmente se reasigna y nunca `var`, impuesto con `prefer-const` y `no-var`, porque así la reasignación queda visible para quien lee.',
    rubric: [
      'Contrasta el scope de función (var) con el scope de bloque (let y const)',
      'Explica la diferencia de hoisting: var inicializada en undefined frente a la TDZ de let y const',
      'Dice que const impide la reasignación, no la mutación',
      'Explica los bindings por iteración de let en los loops',
      'Da una política por defecto: const, luego let, nunca var',
    ],
  },
  'javascript-prototypal-inheritance-explain': {
    prompt: '¿Cómo funciona la herencia prototípica en JavaScript y cómo se relacionan con ella las clases de ES?',
    explanation:
      'La respuesta de referencia común describe la cadena. La capa senior es la **asimetría entre lectura y escritura** (la búsqueda recorre la cadena, la asignación oculta), lo que hace **`new`** paso a paso y que **las clases son el mismo mecanismo**.\n\n**Dilo en voz alta:** "Las lecturas recorren la cadena de prototipos y las escrituras caen en el propio objeto; las clases son solo una forma más agradable de armar la misma cadena, y por eso el estado mutable en un prototipo se filtra a todas las instancias."',
    modelAnswer:
      'Todo objeto tiene un enlace interno `[[Prototype]]` hacia otro objeto o hacia `null`. Cuando lees una propiedad, el motor revisa primero las propiedades propias del objeto y luego recorre esa cadena hasta encontrar la clave o llegar a `null`; una escritura, en cambio, crea o actualiza una propiedad propia en el objeto destino, que oculta la heredada (a menos que un setter heredado o una propiedad no escribible la intercepte). Las funciones tienen una propiedad `prototype`, y `new F()` crea un objeto cuyo `[[Prototype]]` es `F.prototype`, ejecuta `F` con `this` enlazado a ese objeto y lo devuelve. Las clases de ES son sintaxis sobre el mismo modelo: los métodos viven en `Class.prototype`, `extends` enlaza `Child.prototype` con `Parent.prototype` y también enlaza los constructores para que los miembros estáticos se hereden, y `super` recorre esa cadena. Como los métodos se comparten a través del prototipo, poner estado mutable como un array en el prototipo lo comparte entre todas las instancias, un bug clásico. Puedes crear enlaces directamente con `Object.create(proto)` e inspeccionarlos con `Object.getPrototypeOf`, mientras que cambiar el prototipo de un objeto vivo con `Object.setPrototypeOf` es lento y conviene evitarlo. En la práctica prefiero la composición a las cadenas de herencia profundas, pero la cadena es lo que explica `instanceof`, la búsqueda de métodos y `Object.hasOwn` frente a `in`.',
    rubric: [
      'Describe el enlace [[Prototype]] y la búsqueda que recorre la cadena hasta null',
      'Explica que las escrituras crean propiedades propias que ocultan, y el bug del estado mutable compartido en un prototipo',
      'Explica lo que hace new con F.prototype',
      'Relaciona class, extends y super con la misma mecánica de prototipos',
      'Menciona Object.create u Object.getPrototypeOf, o prefiere la composición sobre jerarquías profundas',
    ],
  },
  'javascript-this-explain': {
    prompt: '¿Cuál es el propósito de la palabra clave `this` y cómo se determina su valor?',
    explanation:
      'La respuesta de referencia común enumera contextos (método, solo, función, evento) y dice que una función simple recibe el objeto global, lo cual es **incorrecto en modo estricto, en módulos y en clases**, donde una llamada simple da `undefined`. Una respuesta senior enuncia las reglas en orden de precedencia y nombra el bug del receptor perdido.\n\n**Dilo en voz alta:** "En las funciones regulares, `this` se decide por cómo se llama la función: `new`, luego `call`/`apply`/`bind`, luego el objeto antes del punto y, si no, `undefined` en código estricto; las funciones flecha se saltan todo eso y usan el `this` que las rodea."',
    modelAnswer:
      '`this` le da a una función acceso al objeto sobre el que está operando, para que una sola implementación de un método sirva a muchos objetos. En las funciones regulares su valor se decide en el momento de la llamada según el punto de llamada, no según dónde se definió la función, con esta precedencia: `new` enlaza el objeto recién creado; `call`, `apply` o `bind` enlazan el objeto que pasas; una llamada de método `obj.fn()` enlaza `obj`; y una llamada simple `fn()` da `undefined` en código estricto (incluidos módulos y clases) o el objeto global en modo no estricto. Las funciones flecha no tienen `this` propio y usan el `this` del scope que las rodea, por eso sirven para callbacks dentro de métodos y por eso están mal como métodos de un literal de objeto. El bug clásico es perder el receptor: desestructurar `obj.method` o pasarlo como callback lo separa de `obj`, así que `this` pasa a ser lo que ponga quien llama: `undefined` en una llamada simple en código estricto, `window` o un objeto `Timeout` en `setTimeout`. Las soluciones son `bind` en el constructor, un wrapper con función flecha en el punto de llamada o campos de clase que contengan funciones flecha. En un listener del DOM registrado como función regular, `this` es el elemento al que está adjunto el listener, igual que `event.currentTarget`. `bind` además es permanente: una función enlazada ignora `call` o `bind` posteriores, aunque `new` sí lo sobrescribe.',
    rubric: [
      'Dice que this se determina por el punto de llamada en las funciones regulares',
      'Enumera las reglas de enlace en orden de precedencia (new, explícito, llamada de método, por defecto con undefined en código estricto)',
      'Explica que las funciones flecha heredan un this léxico',
      'Describe el bug del receptor perdido (pasar un método como callback) y una solución',
    ],
  },
  'javascript-hoisting-explain': {
    prompt: '¿Puedes explicar cómo funciona el hoisting? ¿Qué pasa realmente y dónde te muerde?',
    explanation:
      'La respuesta de referencia común dice que las declaraciones "se mueven arriba". Los entrevistadores que miden seniority quieren la explicación de la **fase de creación** y la **TDZ**, incluido su efecto de ocultamiento y los distintos errores que producen las llamadas anticipadas.\n\n**Dilo en voz alta:** "El hoisting es el motor creando los bindings de un scope antes de ejecutarlo: las declaraciones de función quedan listas para llamarse, `var` empieza como `undefined`, y `let`, `const` y `class` quedan en la zona muerta temporal y lanzan un error hasta que se ejecuta su línea."',
    modelAnswer:
      'Nada se mueve físicamente. Antes de ejecutar un scope, el motor crea bindings para cada declaración que contiene, y el hoisting es el resultado observable de esa fase de preparación. Las declaraciones de función quedan completamente inicializadas desde el principio, así que puedes llamarlas antes de su línea. Los bindings de `var` se crean y se inicializan en `undefined`, así que leer uno antes da `undefined` en lugar de un error. Los bindings de `let`, `const` y `class` también se crean desde el principio, pero quedan sin inicializar en la zona muerta temporal hasta que se ejecuta la declaración, así que una lectura anticipada lanza un `ReferenceError`; la TDZ incluso oculta una variable externa con el mismo nombre durante todo el bloque. Las expresiones de función y las funciones flecha asignadas a variables siguen las reglas de la variable, así que llamar a una antes de tiempo lanza `TypeError: x is not a function` con `var`, o un `ReferenceError` con `let` o `const`. Los imports de los módulos ES también tienen hoisting: se resuelven y se enlazan antes de que se ejecute cualquier código del módulo. Donde muerde es en código que depende de que `var` lea `undefined`, en imports circulares entre módulos que chocan con una TDZ y en un `let` local que oculta un nombre externo, haciendo que las líneas anteriores del bloque lancen un error.',
    rubric: [
      'Explica el hoisting como bindings creados durante la preparación del scope, no como código que se mueve',
      'Diferencia las declaraciones de función, var (undefined) y let/const/class (TDZ)',
      'Explica que las expresiones de función y las funciones flecha siguen el hoisting de la variable (TypeError frente a ReferenceError)',
      'Da un caso real donde muerde: ocultamiento por la TDZ, imports circulares o depender de que var sea undefined',
    ],
  },
  'javascript-method-vs-function-explain': {
    prompt: '¿Cuál es la diferencia entre un método y una función en JavaScript? ¿Hay una diferencia técnica real?',
    explanation:
      'La respuesta común ("un método es una función asignada a una propiedad de un objeto") es correcta pero superficial. La versión senior es que la diferencia vive en **la llamada**, no en la función, más la semántica concreta de las **definiciones de método** y el trade-off entre prototipo y campo en las clases.\n\n**Dilo en voz alta:** "Un método es solo una función llamada a través de un objeto, así que `this` es ese objeto; sácala del objeto y vuelve a ser una función simple, por eso elijo a conciencia entre métodos de prototipo y campos de clase con funciones flecha."',
    modelAnswer:
      'Todo método es una función; "método" describe cómo se alcanza y se llama la función: como propiedad de un objeto, llamada a través de ese objeto, así que `this` es ese objeto. El mismo valor de función puede ser ambas cosas: `const f = obj.greet; f()` la llama como función simple y `this` ya no es `obj`. Hay diferencias reales para las **definiciones de método** en literales de objeto y clases (`greet() {}`): tienen un home object, así que `super` funciona dentro de ellas; no son constructores, así que `new obj.greet()` lanza un error; y los métodos de clase no son enumerables y siempre son estrictos. Una propiedad que contiene una función flecha parece un método pero no se comporta como tal: captura `this` de forma léxica e ignora el receptor. En las clases, los métodos de prototipo se comparten entre todas las instancias, mientras que los campos de clase con funciones flecha crean una función nueva por instancia, cambiando memoria por un `this` ya enlazado. Así que la distinción práctica tiene que ver con el receptor, y un senior elige la forma según si `this` debe seguir al punto de llamada o quedar fijo.',
    rubric: [
      'Dice que los métodos son funciones a las que se accede como propiedades de un objeto y que se llaman con un receptor',
      'Muestra que la misma función pierde su receptor cuando se extrae y se llama de forma simple',
      'Menciona las particularidades de las definiciones de método (super, no se pueden construir, no enumerables en clases)',
      'Contrasta los métodos de prototipo con los campos de clase con funciones flecha (compartidos frente a por instancia, this enlazado)',
    ],
  },
  'javascript-promises-explain': {
    prompt: '¿Puedes explicar las promesas? ¿Cómo funcionan por dentro y cuáles son los errores comunes?',
    explanation:
      'La respuesta común cubre los tres estados. Una respuesta senior agrega la **semántica del encadenamiento** (lo que devuelve el handler decide la siguiente promesa), el **momento de las microtareas**, la **elección del combinador** según su comportamiento ante fallos y los errores que detectas en un review.\n\n**Dilo en voz alta:** "Una promesa se resuelve una sola vez, y cada `then` devuelve una promesa nueva definida por lo que su handler devuelve o lanza; esa única regla explica el encadenamiento, la propagación de errores y la recuperación."',
    modelAnswer:
      'Una promesa es un objeto que representa un valor que estará disponible más tarde; empieza en pending y se resuelve exactamente una vez, ya sea fulfilled con un valor o rejected con un motivo, y después nunca cambia. El executor que se pasa a `new Promise` se ejecuta de forma síncrona; solo las reacciones registradas con `then`, `catch` y `finally` se ejecutan de forma asíncrona, siempre como microtareas, incluso si la promesa ya está resuelta. `then` devuelve una promesa nueva que adopta lo que produce el handler: un valor simple la cumple, un error lanzado la rechaza y una promesa o thenable devuelto se sigue, y así es como las cadenas se aplanan. Un rechazo se salta los handlers de éxito hasta que un `catch` (o un `then` con segundo argumento) lo maneja, y un handler que retorna normalmente recupera la cadena. Para concurrencia, `Promise.all` falla rápido, `allSettled` espera todos los resultados, `race` toma el primero en resolverse y `any` toma el primer éxito. Los errores comunes son olvidar el `return` dentro de un `then` (la cadena continúa con `undefined` y los errores se escapan), envolver una promesa existente en `new Promise` (el antipatrón de construcción explícita), dejar rechazos sin manejar y suponer que una promesa se puede cancelar; no se puede, así que cancelas el trabajo subyacente con `AbortController`.',
    rubric: [
      'Describe los estados (pending, fulfilled, rejected) y que una promesa se resuelve una sola vez',
      'Explica que then devuelve una promesa nueva definida por el handler (valor, throw, promesa devuelta) y que se ejecuta como microtarea',
      'Explica la propagación de errores y la recuperación a lo largo de una cadena',
      'Compara los combinadores (all, allSettled, race, any)',
      'Nombra errores comunes: return faltante, antipatrón del constructor, rechazo no manejado, sin cancelación',
    ],
  },
  'javascript-sync-vs-async-explain': {
    prompt:
      '¿Cuál es la diferencia entre la programación síncrona y la asíncrona en JavaScript, y cómo decides cuál necesita un trabajo determinado?',
    explanation:
      'La respuesta común explica bloqueante frente a no bloqueante. La distinción senior es la **concurrencia sin paralelismo** y la decisión entre **trabajo limitado por I/O y trabajo limitado por CPU**, incluido el mito de que marcar una función como `async` evita que bloquee.\n\n**Dilo en voz alta:** "En JavaScript, async es concurrencia, no paralelismo: libera el hilo mientras el host espera la I/O, pero el trabajo de CPU sigue bloqueando a menos que lo divida o lo mueva a un worker."',
    modelAnswer:
      'El código síncrono se ejecuta hasta terminar en la pila de llamadas: cada sentencia termina antes de que empiece la siguiente, y mientras se ejecuta nada más puede correr en ese hilo, incluidos el renderizado y los event handlers. El código asíncrono inicia una operación, retorna de inmediato y continúa más tarde mediante un callback, una reacción de promesa o una continuación de `await` programada por el event loop. El punto clave es que asíncrono no significa paralelo: la espera ocurre en el host (la pila de red, los temporizadores, la I/O del sistema operativo), pero el JavaScript en sí sigue ejecutándose en un solo hilo, una parte a la vez. El executor de una promesa se ejecuta de forma síncrona y solo sus reacciones se difieren, y una función `async` se ejecuta de forma síncrona hasta su primer `await`. Así que async es la herramienta correcta para el trabajo limitado por I/O, donde de otro modo bloquearías mientras esperas, y no hace nada por el trabajo limitado por CPU: un loop intenso dentro de una función `async` sigue congelando la página o el proceso de Node. Para el trabajo de CPU las opciones son dividirlo entre tareas, usar Web Workers o `worker_threads`, o moverlo a un job en el backend. El costo de lo asíncrono es un flujo de control, un orden y un manejo de errores más difíciles, así que mantengo síncrono el cómputo puro y hago asíncrono solo el límite de I/O.',
    rubric: [
      'Define lo síncrono como ejecución bloqueante hasta completar y lo asíncrono como una continuación diferida mediante el event loop',
      'Dice que async no es paralelismo: un solo hilo de JS, el host hace la espera',
      'Sabe qué se ejecuta de forma síncrona dentro del código asíncrono (el executor de la promesa, la función async hasta su primer await)',
      'Distingue el trabajo limitado por I/O (async ayuda) del limitado por CPU (necesita workers o dividirlo)',
    ],
  },
  'javascript-event-delegation-explain': {
    prompt: 'Explica la delegación de eventos. ¿Cómo la implementarías correctamente y cuáles son sus límites?',
    explanation:
      'La respuesta común explica la delegación y el bubbling. Los detalles senior son **`closest` más la comprobación de contención** para targets anidados, los **eventos que no hacen bubbling** y cómo **`stopPropagation`** rompe en silencio a los delegados.\n\n**Dilo en voz alta:** "Pongo un solo listener en el contenedor y resuelvo el target real con `event.target.closest(selector)`, que maneja el markup anidado y los elementos agregados después; para el foco escucho `focusin`, porque `focus` no hace bubbling."',
    modelAnswer:
      'La delegación de eventos adjunta un solo listener a un ancestro común en lugar de uno por hijo, apoyándose en que la mayoría de los eventos hacen bubbling desde el target hacia arriba a través de sus ancestros. Dentro del handler encuentras el target lógico con `event.target.closest(\'[data-action]\')` y compruebas que la coincidencia esté dentro del contenedor con `container.contains(match)`, porque `event.target` suele ser un elemento anidado, como un ícono dentro del botón. Los beneficios son menos listeners y menos memoria, soporte automático para elementos agregados después y no tener que agregar y quitar listeners cuando una lista se vuelve a renderizar. Los límites: algunos eventos no hacen bubbling (`focus`, `blur`, `mouseenter`, `mouseleave`), así que usas `focusin`, `focusout`, `mouseover` y `mouseout` o un listener en fase de captura; un descendiente que llama a `stopPropagation` le oculta el evento al delegado; y los eventos de alta frecuencia como `mousemove` sobre un ancestro grande ejecutan el handler para todo. Dentro del shadow DOM, los eventos se redirigen al host, así que inspeccionas `event.composedPath()`. React mismo se apoya en la delegación: adjunta los listeners en el contenedor raíz y despacha sus eventos sintéticos a través de su propio árbol.',
    rubric: [
      'Explica el bubbling como el mecanismo y un solo listener en un ancestro',
      'Usa event.target.closest más una comprobación de contención en lugar de comparar event.target directamente',
      'Enuncia los beneficios: elementos dinámicos, menos listeners, sin volver a enlazar',
      'Nombra límites: eventos sin bubbling y sus alternativas, stopPropagation, eventos de alta frecuencia',
      'Extra: la delegación a nivel raíz de React o la redirección de eventos del shadow DOM',
    ],
  },
  'javascript-array-map-explain': {
    prompt: '¿Para qué sirve `Array.prototype.map` y qué señalarías en un code review sobre cómo se usa?',
    explanation:
      'La respuesta común dice que `map` es puro. Siendo precisos: `map` no muta el array, pero solo es tan puro como su callback, y el resultado es un array nuevo **superficial**. De un senior se espera que conozca las trampas de la firma del callback y que detecte el mal uso en un review.\n\n**Dilo en voz alta:** "`map` es para transformaciones uno a uno que devuelven un array nuevo; si ignoro el resultado, lo que quiero es `forEach`, y si el callback es async necesito `Promise.all` alrededor."',
    modelAnswer:
      '`map` crea un array nuevo de la misma longitud llamando a un callback sobre cada elemento y reuniendo los valores devueltos, así que expresa una transformación uno a uno sin mutar el array original. El callback recibe `(element, index, array)`, por eso `[\'1\', \'2\', \'3\'].map(parseInt)` devuelve `[1, NaN, NaN]`: `parseInt` trata el índice como base. Se salta los huecos de los arrays dispersos y los conserva como huecos en el resultado, y el resultado es superficial, así que mutar objetos dentro del callback sigue cambiando los originales. En un review señalo `map` usado solo por sus efectos secundarios descartando el resultado (eso es `forEach` o `for...of`), callbacks con llaves que olvidan el `return` y producen `undefined`, `map` seguido de `flat` donde `flatMap` expresa la intención, y callbacks `async`, que producen un array de promesas que debe pasar por `Promise.all`. `map` solo es tan puro como su callback; el método en sí solo garantiza que no modifica el array. En React, `map` renderiza listas, y cada elemento necesita una `key` estable que no sea el índice cuando los elementos se pueden reordenar.',
    rubric: [
      'Define map como una transformación uno a uno que devuelve un array nuevo sin mutar el original',
      'Conoce la firma del callback y la trampa de parseInt',
      'Señala el mal uso: map solo por efectos secundarios, return faltante, callbacks async que necesitan Promise.all',
      'Señala que la pureza depende del callback y que el resultado es superficial; extra: keys estables en listas de React',
    ],
  },
  'javascript-functional-programming-explain': {
    prompt: '¿Puedes explicar la programación funcional y cómo la aplicas en JavaScript en el día a día?',
    explanation:
      'La respuesta común enumera funciones de primera clase, de orden superior y puras. Un senior muestra **dónde** la aplica (un núcleo puro, reducers, componentes de React) y **dónde se detiene** (I/O en los bordes, legibilidad por encima de la astucia).\n\n**Dilo en voz alta:** "Mantengo la lógica de negocio como funciones puras sobre datos inmutables y empujo los efectos secundarios hacia los bordes; eso hace que el núcleo sea trivial de probar, y es exactamente el modelo que ya usan los reducers y los componentes de React."',
    modelAnswer:
      'La programación funcional construye programas a partir de funciones puras, donde las mismas entradas siempre dan la misma salida sin efectos secundarios, y trata los datos como inmutables, produciendo valores nuevos en lugar de cambiar los existentes. JavaScript la permite porque las funciones son valores de primera clase que se pueden pasar, devolver y guardar, lo que habilita funciones de orden superior como `map`, `filter` y `reduce`, closures, currying, aplicación parcial y composición con `pipe` o `compose`. La recompensa es código más fácil de probar y de razonar: una función pura no necesita mocks, se puede memoizar de forma segura y hace explícitos los cambios de estado. En el día a día la aplico de forma pragmática, con un núcleo funcional de transformaciones puras y reglas de negocio y una capa imperativa en los bordes para la I/O, el logging y el acceso al DOM o a la base de datos. React y Redux se construyen sobre estas ideas: componentes como funciones de props y estado, reducers como `(state, action) => newState` puros y actualizaciones inmutables para que la igualdad de referencia detecte los cambios. Los costos son las asignaciones de memoria por copiar, que rara vez importan pero pueden hacerlo en loops críticos, y el código point-free o muy curried, que perjudica la legibilidad para el equipo, así que lo mantengo idiomático y no dogmático.',
    rubric: [
      'Define las funciones puras y la inmutabilidad como los principios centrales',
      'Nombra las funciones de primera clase y de orden superior, la composición, el currying o los closures en JavaScript',
      'Explica los beneficios: testeabilidad, previsibilidad, memoización segura',
      'Describe una aplicación pragmática: núcleo funcional con una capa imperativa, reducers, componentes de React',
      'Reconoce los trade-offs: el costo de copiar y la legibilidad del código point-free',
    ],
  },
  'javascript-arrow-vs-regular-explain': {
    prompt: '¿Cuál es la diferencia entre una función flecha y una función regular, y cuándo eliges cada una?',
    explanation:
      'La respuesta común enumera las diferencias. El valor senior está en convertirlas en una **regla de decisión** y conocer las **trampas** que aparecen en código real.\n\n**Dilo en voz alta:** "Las funciones flecha toman `this` y `arguments` de donde están escritas, así que las uso para callbacks, y uso métodos regulares donde importa el receptor; una función flecha nunca puede ser un constructor ni un método correcto de un literal de objeto."',
    modelAnswer:
      'Las funciones flecha son más que una sintaxis corta: no tienen `this`, `arguments`, `super` ni `new.target` propios, y resuelven todos de forma léxica desde el scope que las rodea. Eso las hace ideales para callbacks dentro de métodos, como un callback de `setTimeout` o de `array.map` en una clase, donde una función regular perdería `this`. Además no pueden ser constructores (`new` lanza un error), no tienen propiedad `prototype`, y `call`, `apply` y `bind` no pueden cambiar su `this`. Las funciones regulares obtienen `this` del punto de llamada, tienen `arguments`, pueden ser constructores, y las declaraciones de función tienen hoisting, así que se pueden llamar antes de su línea. Por eso uso funciones regulares o métodos abreviados para los métodos de objetos y clases que necesitan el receptor y para los constructores, y funciones flecha para callbacks y expresiones pequeñas. Dos trampas: una función flecha usada como método de un literal de objeto ve el `this` externo, no el objeto, y devolver un literal de objeto necesita paréntesis, `() => ({ a: 1 })`, porque una llave inicia el cuerpo de la función. En las clases, los campos con funciones flecha dan una función por instancia ya enlazada, útil para event handlers pero no compartida en el prototipo.',
    rubric: [
      'Dice que las funciones flecha tienen un this léxico y no tienen arguments, super ni new.target propios',
      'Señala que las funciones flecha no pueden ser constructores, no tienen prototype e ignoran call/apply/bind para this',
      'Da una guía de uso: funciones flecha para callbacks, sintaxis regular o de método para métodos y constructores',
      'Nombra una trampa: función flecha como método de objeto, literal de objeto que necesita paréntesis o campos de clase por instancia',
    ],
  },
  'javascript-destructuring-explain': {
    prompt: '¿Puedes explicar la desestructuración, incluidas las partes en las que la gente se equivoca?',
    explanation:
      'La respuesta común muestra la sintaxis básica. Los entrevistadores revisan la **semántica de los bordes**: los valores por defecto y `null`, desestructurar `undefined`, la ambigüedad de las llaves entre bloque y objeto, y que nada se copia en profundidad.\n\n**Dilo en voz alta:** "Los valores por defecto de la desestructuración solo se activan con `undefined`, y desestructurar `undefined` en sí lanza un error, así que para los parámetros de opciones escribo `function f({ timeout = 1000 } = {})`."',
    modelAnswer:
      'La desestructuración extrae valores de arrays por posición y de objetos por nombre de propiedad hacia variables, en declaraciones, asignaciones y parámetros de funciones. La desestructuración de arrays funciona con cualquier iterable y permite saltar posiciones (`const [, second] = arr`), rest (`[first, ...rest]`) e intercambios (`[a, b] = [b, a]`). La desestructuración de objetos permite renombrar (`{ id: userId }`), valores por defecto (`{ page = 1 }`), anidamiento y rest (`{ password, ...safe }`), que es una forma elegante de omitir campos de manera inmutable. Las trampas: los valores por defecto se aplican solo cuando el valor es `undefined`, no `null`; desestructurar `null` o `undefined` en sí lanza un `TypeError`, así que los parámetros suelen llevar un valor por defecto como `function f({ a } = {})`; los patrones anidados lanzan un error cuando falta un objeto intermedio; y asignar a variables existentes con sintaxis de objeto necesita paréntesis, `({ a } = obj);`, porque una llave inicial se interpreta como bloque. La desestructuración copia valores, así que los objetos siguen siendo referencias compartidas. Aplicada a un objeto de opciones en los parámetros, da argumentos con nombre, valores por defecto autodocumentados e independencia del orden de los argumentos.',
    rubric: [
      'Cubre la desestructuración de arrays (posicional, cualquier iterable) y de objetos (por nombre) con renombrado, valores por defecto y rest',
      'Dice que los valores por defecto se aplican solo con undefined, no con null',
      'Sabe que desestructurar null o undefined lanza un error, y la solución del valor por defecto = {} en el parámetro',
      'Menciona la trampa de la asignación entre paréntesis o que los objetos anidados siguen siendo referencias compartidas',
      'La aplica a parámetros con objeto de opciones como argumentos con nombre',
    ],
  },
  'javascript-spread-explain': {
    prompt: 'Describe el propósito del operador spread. ¿Dónde ayuda y dónde engaña a la gente?',
    explanation:
      'La respuesta común define el spread. Una respuesta senior trata sobre la **semántica de la copia**: superficial, solo propiedades enumerables propias, prototipo perdido. De ahí vienen los bugs de producción, sobre todo en las actualizaciones de estado.\n\n**Dilo en voz alta:** "El spread hace una copia superficial de las propiedades enumerables propias, así que es perfecto para actualizaciones inmutables del nivel superior, pero los objetos anidados siguen compartidos; para una copia profunda de verdad uso `structuredClone`."',
    modelAnswer:
      'El spread expande un iterable en elementos individuales en literales de array y argumentos de llamadas (`[...a, ...b]`, `Math.max(...nums)`), y copia las propiedades enumerables propias de un objeto en un nuevo literal de objeto (`{ ...defaults, ...overrides }`, donde ganan las claves posteriores). Su trabajo principal son las actualizaciones inmutables: copiar arrays y objetos, combinar configuración, y el patrón de reducers y estado de React `{ ...state, user: { ...state.user, name } }`. Engaña porque es una copia **superficial**: los objetos y arrays anidados se comparten, así que mutar `copy.user.name` también cambia el original; una copia profunda de verdad necesita `structuredClone` o un spread explícito en cada nivel. El spread de objetos solo toma propiedades enumerables propias, así que se pierden los métodos del prototipo y la identidad de clase (una instancia de clase con spread se convierte en un objeto simple), los getters se invocan y se copian sus valores actuales, y las claves symbol se incluyen. El spread de arrays requiere un iterable, así que hacer spread de un objeto simple dentro de un array lanza un error, mientras que hacer spread de `null` o `undefined` dentro de un literal de objeto se ignora en silencio. Hacer spread de un array muy grande en una llamada a función puede superar el límite de argumentos del motor, y usar spread dentro de un loop para hacer crecer un array es cuadrático. La sintaxis rest se ve igual pero hace lo contrario: reúne valores en un array o un objeto.',
    rubric: [
      'Explica el spread de iterables en arrays y llamadas, y de propiedades enumerables propias en objetos, donde ganan las claves posteriores',
      'Dice que es una copia superficial, da el bug de la mutación anidada y una alternativa de copia profunda',
      'Señala la pérdida de prototipos e identidad de clase, o la evaluación de getters, en el spread de objetos',
      'Menciona límites (límite de argumentos, spreads cuadráticos en loops) o distingue rest de spread',
    ],
  },
  'javascript-static-vs-instance-explain': {
    prompt:
      'Describe la diferencia entre un método estático y un método de instancia, y cuándo diseñarías algo como estático.',
    explanation:
      'La respuesta común dice dónde se llama cada método. Los agregados senior son **dónde vive cada uno** (prototipo frente a constructor), la **herencia de estáticos** con `this` apuntando a la subclase y el **criterio de diseño** entre factories y estado global oculto.\n\n**Dilo en voz alta:** "Los métodos de instancia viven en el prototipo y trabajan con el estado de un objeto; los métodos estáticos viven en la clase, lo que los hace adecuados para factories como `User.fromJson` e inadecuados para cualquier cosa que guarde en silencio estado mutable compartido."',
    modelAnswer:
      'Un método de instancia vive en `Class.prototype`, lo comparten todas las instancias y se llama sobre una instancia, así que `this` es esa instancia y puede leer y cambiar su estado. Un método estático vive en el propio constructor y se llama como `Class.method()`; su `this` es la clase (o la subclase a través de la cual se llamó), y llamarlo sobre una instancia falla porque las instancias no heredan del constructor. Las subclases heredan los miembros estáticos porque `extends` también enlaza los constructores, así que `this` dentro de un método estático puede ser una subclase, y así es como `static create() { return new this(); }` construye el tipo correcto. Los usos típicos de lo estático son factories y constructores con nombre (`Array.from`, `Date.now()`, `User.fromJson`), helpers de parseo o validación ligados al tipo, y constantes o cachés a nivel de clase, incluidos los campos `static #private`. Evito lo estático para cualquier cosa que necesite estado por instancia, y desconfío del estado estático mutable, porque en la práctica es una global compartida en toda la aplicación y entre tests. Si un método estático nunca toca la clase, una función simple a nivel de módulo suele ser más sencilla y más fácil de eliminar con tree-shaking.',
    rubric: [
      'Ubica los métodos de instancia en el prototipo con this como la instancia, y los estáticos en el constructor con this como la clase',
      'Sabe que los métodos estáticos no se pueden llamar sobre instancias y que las subclases los heredan',
      'Da buenos casos de uso estático: factories o constructores con nombre, helpers de parseo, constantes',
      'Advierte que el estado estático mutable es estado global, o prefiere funciones de módulo cuando no se necesita acceso a la clase',
    ],
  },
  'javascript-expression-vs-statement-explain': {
    prompt:
      '¿Cuál es la diferencia entre una expresión y una sentencia en JavaScript, y por qué importa en código real?',
    explanation:
      'La respuesta común da definiciones. De un senior se espera que conecte la distinción con el **parseo**: los mismos caracteres significan cosas distintas en posición de sentencia y de expresión, lo que explica el bug de la función flecha con literal de objeto, la ASI después de `return` y la regla de `{}` en JSX.\n\n**Dilo en voz alta:** "Las expresiones producen valores y las sentencias hacen cosas; las llaves de JSX y los template literals solo aceptan expresiones, y una `{` inicial se interpreta como bloque en posición de sentencia, por eso una función flecha que devuelve un objeto necesita paréntesis."',
    modelAnswer:
      'Una expresión es cualquier fragmento de código que produce un valor: `2 + 2`, `user.name`, una llamada a función, `a ? b : c`, una función flecha o una asignación. Una sentencia realiza una acción y no produce un valor que puedas usar: `if`, `for`, `while`, `return`, las declaraciones con `let`, `const` o `function`, y los bloques. En cualquier lugar donde JavaScript espera un valor puedes poner una expresión pero no una sentencia, por eso no puedes escribir un `if` dentro de un template literal o de un `{}` de JSX y usas un ternario, `&&` o un array mapeado. La misma sintaxis puede ser una u otra según la posición: `function f() {}` al inicio de una sentencia es una declaración con hoisting, mientras que en posición de expresión es una expresión de función sin hoisting. Las llaves son la trampa clásica: el cuerpo de la función flecha en `() => { a: 1 }` es un bloque que contiene una etiqueta, así que devuelve `undefined` y necesitas `() => ({ a: 1 })`, y una sentencia que empieza con `{` no puede ser una asignación por desestructuración de objeto sin paréntesis. La inserción automática de punto y coma depende de la misma gramática: `return` seguido de un salto de línea termina la sentencia, así que el valor de la línea siguiente nunca se devuelve. Conocer la distinción explica las reglas de JSX, la sintaxis de las IIFE y toda una familia de bugs del tipo "¿por qué esto es undefined?".',
    rubric: [
      'Define las expresiones como las que producen valores y las sentencias como las que realizan acciones',
      'Explica por qué JSX y los template literals solo aceptan expresiones (ternario o && en lugar de if)',
      'Muestra el parseo que depende de la posición: declaración frente a expresión de función, o llaves como bloque frente a literal de objeto',
      'Nombra un bug real: función flecha que devuelve un literal de objeto, return seguido de un salto de línea o los paréntesis de la asignación por desestructuración',
    ],
  },
  'javascript-immutability-explain': {
    prompt: '¿Puedes explicar la inmutabilidad en JavaScript, cómo la logras y por qué importa?',
    explanation:
      'La respuesta común es una línea. Un senior conecta la inmutabilidad con la **igualdad de referencia**, que es lo que hace funcionar la detección de cambios de React y Redux, y conoce los **límites de cada herramienta**: `freeze` es superficial y solo lanza errores en modo estricto, `readonly` desaparece en tiempo de ejecución.\n\n**Dilo en voz alta:** "React y Redux detectan los cambios por referencia, así que nunca muto el estado; creo objetos nuevos con spread o con los métodos al estilo `toSorted`, o dejo que Immer lo haga, y recuerdo que `Object.freeze` es superficial."',
    modelAnswer:
      'Inmutabilidad significa que un valor nunca cambia después de crearse; para "cambiarlo" creas un valor nuevo. Los primitivos ya son inmutables, pero los objetos y arrays son mutables y se comparten por referencia, así que cualquiera que tenga una referencia puede cambiarlos para todos. Logras la inmutabilidad con disciplina y herramientas: operaciones que no mutan, como spread, `map` y `filter`, y los métodos de copia de ES2023 `toSorted`, `toReversed`, `toSpliced` y `with`; `Object.freeze` para una garantía en tiempo de ejecución, recordando que es superficial y que las escrituras en un objeto congelado solo lanzan errores en modo estricto (el código no estricto las ignora en silencio); `readonly` y `as const` de TypeScript para garantías en tiempo de compilación; e Immer, que Redux Toolkit usa para convertir código que "muta" en actualizaciones inmutables. Importa porque hace que la detección de cambios sea barata y confiable: el estado de React, `React.memo` y los selectores de Redux comparan por referencia, así que mutar el estado en el lugar significa que nada se vuelve a renderizar o que un valor memoizado queda obsoleto. También elimina los bugs causados por estado mutable compartido, facilita el deshacer y el time travel, y hace que las funciones sean seguras de memoizar. El costo son las asignaciones y copias extra, que el structural sharing mantiene pequeñas, y las rutas muy críticas todavía pueden mutar datos locales que nunca escapan.',
    rubric: [
      'Define la inmutabilidad y señala que los primitivos son inmutables mientras que los objetos y arrays son referencias compartidas',
      'Nombra técnicas: spread y métodos que no mutan (toSorted y compañía), Object.freeze superficial, readonly o as const, Immer',
      'Explica por qué importa para la detección de cambios por igualdad de referencia en React y Redux',
      'Menciona otros beneficios (menos bugs de estado compartido, deshacer, memoización segura) y el costo de copiar o el structural sharing',
    ],
  },
  'javascript-strict-mode-explain': {
    prompt: '¿Puedes explicar el modo estricto? ¿Qué cambia y todavía necesitas `\'use strict\'` hoy?',
    explanation:
      'La respuesta común es la definición. La respuesta senior nombra **cambios de comportamiento específicos** y sabe que **los módulos y las clases son estrictos por defecto**, por eso la mayor parte del código moderno es estricto sin la directiva.\n\n**Dilo en voz alta:** "El modo estricto convierte fallos silenciosos en errores, como las escrituras en objetos congelados y las globales accidentales, y hace que `this` sea `undefined` en las llamadas simples; los módulos ES y las clases siempre son estrictos, así que el código moderno lo obtiene gratis."',
    modelAnswer:
      'El modo estricto es una variante restringida y opcional de JavaScript que convierte fallos silenciosos en errores y elimina algunas características confusas. Los cambios clave: asignar a una variable no declarada lanza un `ReferenceError` en lugar de crear una global; escribir en una propiedad no escribible o que solo tiene getter, o agregar una propiedad a un objeto congelado o no extensible, lanza un `TypeError`; `this` en una llamada simple a una función es `undefined` en lugar del objeto global; `with` está prohibido; los nombres de parámetros duplicados y el `delete` de una variable simple son errores de sintaxis; `arguments` ya no es un alias de los parámetros con nombre; y `eval` obtiene su propio scope, así que no puede inyectar variables. Estas restricciones también hacen que el código sea más fácil de optimizar para los motores. Lo activas con `\'use strict\'` al inicio de un script o una función, pero los módulos ES y los cuerpos de clase siempre son estrictos, así que en los codebases modernos basados en módulos rara vez escribes la directiva. Todavía importa en scripts clásicos y en archivos CommonJS antiguos que nunca la emitieron, y una función con parámetros por defecto, desestructurados o rest ni siquiera puede contener la directiva. Al depurar, es lo que explica por qué `this` es `undefined` en un método separado de su objeto y por qué una escritura en un objeto congelado lanza un error en un archivo pero no hace nada en silencio en otro.',
    rubric: [
      'Explica que el modo estricto convierte errores silenciosos en errores lanzados y elimina características inseguras',
      'Enumera cambios concretos: asignación no declarada, las escrituras de solo lectura lanzan error, this undefined en llamadas simples, with prohibido',
      'Dice que los módulos ES y las clases son estrictos automáticamente',
      'Explica dónde todavía importa (scripts clásicos, CommonJS legacy) o su efecto al depurar this y las escrituras congeladas',
    ],
  },
  'javascript-set-explain': {
    prompt: '¿Cuál es el propósito del objeto `Set` y cómo lo usarías en código de producción?',
    explanation:
      'La respuesta común define la unicidad. Un senior sabe **cómo** se decide la unicidad (SameValueZero, identidad por referencia), **por qué** un `Set` le gana a un array para comprobar pertenencia y la **trampa de la serialización** en los límites de una API.\n\n**Dilo en voz alta:** "Un `Set` me da comprobación de pertenencia en tiempo constante y eliminación de duplicados por SameValueZero, lo que significa que los objetos son únicos por referencia, así que para deduplicar registros uso un `Map` con el id como clave, y lo convierto a array antes de `JSON.stringify`."',
    modelAnswer:
      'Un `Set` es una colección de valores únicos de cualquier tipo, que se recorre en orden de inserción, con `add`, `has`, `delete` y `size`. La unicidad usa SameValueZero: como `===`, excepto que `NaN` es igual a `NaN` (y `+0` y `-0` cuentan como el mismo valor), y los objetos se comparan por referencia, así que dos objetos estructuralmente iguales son dos entradas. Su valor es el rendimiento y la intención: `has` es aproximadamente de tiempo constante frente al `array.includes` lineal, así que es la herramienta correcta para comprobar pertenencia dentro de loops, eliminar duplicados (`[...new Set(ids)]`) y rastrear nodos visitados. Los motores modernos también incluyen métodos de álgebra de conjuntos, `union`, `intersection`, `difference`, `symmetricDifference` e `isSubsetOf`, que antes requerían filtrar a mano. Las trampas: un `Set` no elimina duplicados de objetos por contenido, así que deduplicas registros por una clave con un `Map` indexado por id; `JSON.stringify` convierte un `Set` en `{}`, así que lo conviertes a array en los límites de la API; y no hay acceso por índice. `WeakSet` guarda objetos de forma débil, lo que sirve para etiquetar objetos, como marcar cuáles ya se procesaron, sin mantenerlos vivos.',
    rubric: [
      'Define un Set como valores únicos en orden de inserción con add, has, delete y size',
      'Explica SameValueZero: NaN es igual a sí mismo, los objetos se comparan por referencia',
      'Lo usa para comprobar pertenencia en tiempo constante y eliminar duplicados en lugar de array.includes',
      'Nombra una trampa o extensión: deduplicar objetos necesita una clave, JSON lo serializa como {}, WeakSet o los métodos de álgebra de conjuntos',
    ],
  },
};
