// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  'typescript-basics-inference-widening': {
    prompt:
      '```ts\nlet a = \'open\';\nconst b = \'open\';\nconst task = { status: \'open\' };\n```\n¿Qué tipos infiere TypeScript para `a`, `b` y `task.status`?',
    explanation:
      'TypeScript infiere a partir del inicializador y luego **ensancha** (widening) los literales donde el valor podría cambiar. Un `let` se puede reasignar, así que `a` se ensancha a `string`; un primitivo `const` no, así que `b` conserva el literal `"open"`. Las propiedades de un objeto son mutables incluso dentro de un objeto `const`, así que `task.status` se ensancha a `string`, y por eso pasar `task` a una función que espera `{ status: \'open\' | \'closed\' }` falla.\n\nConserva el literal con `as const`, `satisfies` o una anotación explícita. Regla práctica: deja que la inferencia tipe las variables locales, y anota los parámetros de funciones, las APIs exportadas y los tipos de retorno de las funciones públicas para que el contrato quede declarado y no sea accidental.',
  },
  'typescript-basics-unknown-any-never': {
    prompt: '¿Qué afirmación sobre `any`, `unknown` y `never` es correcta?',
    explanation:
      '- `any` desactiva la comprobación de tipos en ambas direcciones: se puede asignar a todo y todo se puede invocar sobre él, así que un solo `any` se filtra por los valores de retorno y desactiva en silencio la seguridad más adelante.\n- `unknown` es el **top type** seguro: cualquier cosa puede entrar, pero nada sale hasta que haces narrowing (`typeof`, `instanceof`, `in`, un type guard o un schema). Es el tipo correcto para `JSON.parse`, las variables de `catch`, las respuestas de APIs y la salida de LLMs/herramientas.\n- `never` es el **bottom type**: ningún valor lo tiene. Tipa las funciones que siempre lanzan un error y hace posibles las comprobaciones de exhaustividad (`assertNever(x: never)`).\n\n`null` y `undefined` son sus propios tipos con `strictNullChecks`, no `never`.',
    options: {
      a:
        '`unknown` acepta cualquier valor, pero hay que hacer narrowing antes de leer propiedades o invocarlo; `any` desactiva la comprobación y se propaga en silencio; `never` no tiene valores y es lo que queda en el `default` de un `switch` exhaustivo.',
      b: '`unknown` es el nombre nuevo de `any`; se comportan igual, pero los linters prefieren `unknown`.',
      c: '`never` es el tipo de `null` y `undefined` cuando `strictNullChecks` está activado.',
      d:
        '`any` es la opción más segura para los resultados de `JSON.parse` porque conserva el autocompletado de propiedades.',
    },
  },
  'typescript-basics-types-erased': {
    prompt: 'Esto compila sin errores con `strict`. ¿Qué imprime en tiempo de ejecución, un valor por línea?',
    explanation:
      'Los tipos de TypeScript se **borran**: el JavaScript emitido no contiene comprobaciones. `as` es una aserción ("confía en mí"), no una conversión, y un type guard definido por el usuario (`value is User`) es tan honesto como su cuerpo. El compilador cree que `user.age` es un `number`, así que `user.age + 1` pasa la comprobación de tipos, y en tiempo de ejecución concatena `"30" + 1`.\n\nPor eso los datos que cruzan un límite (`JSON.parse`, `fetch`, variables de entorno) deben tiparse como `unknown` y validarse en tiempo de ejecución, y por eso un `as` en código de aplicación merece un comentario en el review.',
  },
  'typescript-generics-pluck': {
    prompt:
      'Implementa el genérico `pluck(items, key)` para que devuelva el valor de `key` de cada elemento, en orden. La firma ya está dada: `K extends keyof T` significa que `pluck(products, \'price\')` tiene tipo `number[]` y que un error de tipeo en la clave es un error de compilación.',
    explanation:
      'Los genéricos son parámetros de tipo: los tipos de quien llama fluyen a través de la función en lugar de borrarse a `any`. `K extends keyof T` **restringe** la clave a nombres de propiedad reales de `T`, y el indexed access type `T[K]` da el tipo exacto del valor para esa clave. La implementación es un simple `map`; el valor del ejercicio está en la firma, que hace preciso el punto de llamada sin overloads.',
  },
  'typescript-generics-group-by': {
    prompt:
      'Implementa `groupBy(items, keyOf)`: devuelve un objeto que mapea cada clave producida por `keyOf` a los elementos con esa clave, en su orden original. Solo deben estar presentes las claves que aparecen.',
    explanation:
      'Dos parámetros de tipo, ambos **inferidos** en el punto de llamada: `T` a partir del array y `K` a partir del tipo de retorno del callback. Con los datos de `Ticket`, `K` es `\'open\' | \'closed\'`, así que el resultado es `Partial<Record<\'open\' | \'closed\', Ticket[]>>`.\n\n- `K extends PropertyKey` (`string | number | symbol`) es la restricción que hace que `K` sea válido como clave de objeto.\n- `Partial` es honesto: no toda clave posible tiene un grupo, así que leer `groups.open` obliga a comprobar `undefined`.\n- `??=` crea el grupo la primera vez que se usa.\n\nES2024 incluye `Object.groupBy` con la misma forma (devuelve un objeto con prototipo null); escribirlo tú mismo es un ejercicio estándar de genéricos.',
  },
  'typescript-generics-constraint': {
    prompt:
      '```ts\nfunction longest<T>(a: T, b: T): T {\n  return a.length >= b.length ? a : b;\n}\n```\nEsto falla con `Property \'length\' does not exist on type \'T\'`. ¿Qué corrección conserva el tipo de quien llama, de modo que `longest(\'ab\', \'c\')` sea un `string` y `longest([1], [2, 3])` sea un `number[]`?',
    explanation:
      'Un `T` sin restricción podría ser cualquier cosa, así que el compilador solo permite lo que es válido para *todos* los tipos. `extends { length: number }` es una **restricción**: quien llama puede pasar cualquier tipo que tenga un `length` numérico, y `T` sigue devolviendo su tipo exacto.\n\n- La opción b compila pero borra el tipo: quien llama recibe `{ length: number }` y pierde los métodos de string o de array.\n- La opción c compila desactivando la comprobación, así que `longest(1, 2)` compilaría y devolvería basura.\n- La opción d define un **valor por defecto**, no una restricción; no le dice nada al compilador sobre `length`.',
    options: {
      c: 'Mantener `<T>` y escribir `(a as any).length >= (b as any).length`',
    },
  },
  'typescript-interface-vs-type-open': {
    prompt:
      'Tu equipo está escribiendo su guía de estilo de TypeScript. ¿Cuándo usas `interface` y cuándo `type`? Defiende un valor por defecto y nombra los casos en los que la elección realmente importa.',
    explanation:
      'Los entrevistadores usan esta pregunta para separar a quienes repiten "las interfaces son para objetos" de quienes conocen las diferencias mecánicas (merging, reporte de conflictos, lo que solo los alias pueden expresar) y saben convertirlas en una regla de equipo.\n\n**Dilo en voz alta:** "Son intercambiables para formas de objetos; uso `interface` donde quiero extensión o module augmentation, `type` para uniones y tipos derivados, y dejo que una regla de lint imponga el valor por defecto para que nunca lo discutamos en un review."',
    modelAnswer:
      'Para formas de objetos simples son casi intercambiables, así que la elección importa solo en los bordes. `interface` soporta **declaration merging**, que es como aumentas tipos de librerías (`Window`, el `Request` de Express, los tipos de un módulo), pero esa misma característica hace que dos interfaces con el mismo nombre se combinen en silencio, mientras que un `type` duplicado es un error. `interface extends` comprueba los conflictos de forma anticipada y reporta un error claro, mientras que una intersección (`A & B`) con tipos de propiedad en conflicto produce en silencio propiedades `never`. El compilador cachea las relaciones entre interfaces por nombre, lo que ayuda al rendimiento de la comprobación de tipos y a la legibilidad de los errores en codebases grandes. `type` es obligatorio para todo lo que no sea una forma de objeto simple: uniones y uniones discriminadas, tuplas, alias de primitivos, tipos de función, mapped types, conditional types y template literal types. Mi valor por defecto es `interface` para los contratos públicos de objetos que otros extienden o aumentan, y `type` para uniones, composiciones y tipos derivados; un equipo que usa `type` en todas partes excepto donde se necesita merging también está bien. La regla real es la consistencia impuesta por una regla de lint (`consistent-type-definitions`), no debatirlo en cada pull request.',
    rubric: [
      'El declaration merging es exclusivo de interface, y cuándo ayuda (augmentation) o perjudica (merges accidentales)',
      'Las uniones, tuplas, mapped types y conditional types requieren `type`',
      '`extends` reporta conflictos mientras que las intersecciones pueden producir `never` en silencio',
      'Menciona el rendimiento del compilador o la legibilidad de los errores de las interfaces en codebases grandes',
      'Enuncia un valor por defecto concreto para el equipo y cómo se impone, no solo "depende"',
    ],
  },
  'typescript-declaration-merging': {
    prompt:
      '```ts\ninterface Box {\n  width: number;\n}\ninterface Box {\n  height: number;\n}\nconst box: Box = { width: 10 };\n```\n¿Qué reporta el compilador?',
    explanation:
      'Las interfaces con el mismo nombre en el mismo scope **fusionan** sus miembros. Es deliberado: así funcionan `declare global { interface Window { analytics: Analytics } }` o la augmentation del request de Express.\n\nEl mismo código con `type Box = ...` dos veces falla con *Duplicate identifier*: los alias de tipo son cerrados. El merging también es el riesgo: una segunda `interface User` accidental en algún lugar del scope cambia en silencio la forma de la que todos dependen.',
    options: {
      a: 'Falta la propiedad `height`: las dos declaraciones se fusionaron en `{ width: number; height: number }`.',
      b: 'Identificador duplicado `Box`.',
      c: 'Nada: gana la primera declaración y `height` se ignora.',
      d:
        'Un literal de objeto solo puede especificar propiedades conocidas: `width` no existe, porque la segunda declaración reemplazó a la primera.',
    },
  },
  'typescript-enum-runtime-output': {
    prompt:
      'Los enums son una de las pocas características de TypeScript que emiten código en tiempo de ejecución. ¿Qué imprime esto, un valor por línea?',
    explanation:
      'Un enum numérico compila a un objeto con **ambas direcciones**: `Status.Draft === 0` y `Status[0] === \'Draft\'`. Los miembros se autoincrementan a partir del valor anterior, así que `Archived` es `6`. Por las entradas inversas, `Object.keys` devuelve seis claves (primero las claves con forma de entero, en orden ascendente), lo que rompe el código ingenuo que "recorre el enum".\n\nLos enums de string **no tienen mapeo inverso**: `Color` tiene las claves `Red` y `Blue`, así que buscar `\'RED\'` da `undefined`. En tiempo de ejecución, el valor de un enum de string es solo el string, así que compararlo con un string simple funciona, pero TypeScript no te deja *asignar* `\'RED\'` a un `Color` sin un cast, porque los enums son nominales.',
  },
  'typescript-as-const-satisfies': {
    prompt: 'Este es el patrón común de "enum sin `enum`". ¿Qué imprime, un valor por línea?',
    explanation:
      '`as const` hace que el compilador infiera el tipo **más estrecho**: una tupla `readonly` de literales, a partir de la cual `(typeof ROLES)[number]` deriva la unión `\'admin\' | \'editor\' | \'viewer\'`. Un solo array es a la vez la lista en tiempo de ejecución (para validación y dropdowns) y el tipo. Pero `readonly` existe solo en tiempo de compilación: un cast después, `push` funciona y el array no está congelado. Si necesitas inmutabilidad en tiempo de ejecución, agrega `Object.freeze`.\n\n`satisfies` comprueba el valor contra un tipo **sin ensancharlo**: cada ruta debe empezar con `/`, y aun así `routes` conserva sus claves exactas, así que `routes.user` se autocompleta y `routes.missing` es un error de compilación. Anotar `const routes: Record<string, ...>` en su lugar aceptaría cualquier clave y perdería esa precisión.\n\n**Dilo en voz alta:** "`as const` y `satisfies` son solo de tiempo de compilación: `as const` estrecha los literales y agrega readonly sin congelar nada, y `satisfies` valida un valor contra un tipo conservando su forma inferida."',
  },
  'typescript-enum-vs-union': {
    prompt:
      'Muchos equipos prefieren `type Status = \'open\' | \'closed\'` (a menudo derivado de un array `as const`) sobre `enum Status`. ¿Cuál es la mejor razón?',
    explanation:
      'Los enums son una de las pocas características de TypeScript que no se pueden borrar. Eso se nota como fricción: los valores que llegan como strings en JSON deben convertirse al enum con un cast; `const enum` se inserta en línea entre archivos, algo que Babel, esbuild e `isolatedModules` no pueden hacer; y el type stripping integrado de Node (y `--erasableSyntaxOnly`) rechaza los enums por completo.\n\nUna unión de literales no tiene nada de eso, y combinarla con un array `as const` te devuelve la lista en tiempo de ejecución. La opción d está al revés: un enum *es* un objeto en tiempo de ejecución que puedes recorrer (con mapeos inversos incluidos), mientras que un tipo unión no existe en absoluto en tiempo de ejecución.',
    options: {
      a:
        'Una unión de literales se borra, coincide con strings simples de JSON sin conversión y no necesita soporte especial del compilador; un enum emite un objeto en tiempo de ejecución, es nominal (un `\'open\'` simple no se le puede asignar) y `const enum` se rompe con transpiladores de un solo archivo.',
      b:
        'Las uniones se ejecutan más rápido porque los motores optimizan mejor las comparaciones de strings que las búsquedas de propiedades.',
      c: 'Los enums no se pueden usar en sentencias `switch` ni en comprobaciones de exhaustividad.',
      d: 'Una unión se puede recorrer en tiempo de ejecución con `Object.values`, y un enum no.',
    },
  },
  'typescript-discriminated-union-render': {
    prompt:
      'Implementa `solution(state)` para esta unión discriminada: `idle` devuelve `Start a search`, `loading` devuelve `Loading`, `success` devuelve `<n> results` (la longitud de `data`) y `error` devuelve `Error: <error>`. Haz switch sobre el discriminante y termina con la guarda de exhaustividad `assertNever`.',
    explanation:
      'Un campo literal compartido (el **discriminante**, aquí `status`) permite que el compilador estreche cada `case` a exactamente un miembro, así que `state.data` existe solo en `success` y `state.error` solo en `error`.\n\nEsto *hace irrepresentables los estados ilegales*: compáralo con la bolsa habitual `{ isLoading: boolean; data?: T; error?: string }`, que permite cargando-con-un-error y éxito-sin-datos. La rama `default` recibe `never` una vez que todos los casos están cubiertos; agrega un estado `cancelled` más adelante y `assertNever(state)` se convierte en un **error de compilación** en cada switch que lo haya olvidado.',
  },
  'typescript-narrow-unknown-error': {
    prompt:
      'En un bloque `catch` el error es `unknown`: se puede lanzar cualquier cosa. Implementa `toMessage(error)`: para un `Error`, devuelve su `message`; para un string, devuelve el string; para cualquier otro objeto con una propiedad `message` de tipo **string**, devuelve esa propiedad; en cualquier otro caso devuelve `Unknown error`. Usa narrowing, no `as`.',
    explanation:
      'Con `strict` (`useUnknownInCatchVariables`) las variables de catch son `unknown`, porque JavaScript te deja lanzar cualquier cosa. Cada comprobación estrecha el tipo para el código que sigue:\n\n- `instanceof` estrecha a la clase.\n- `typeof error === \'string\'` estrecha a `string`.\n- `typeof error === \'object\'` todavía incluye `null` (el viejo bug de `typeof null`), así que la comprobación de null es obligatoria.\n- Desde TypeScript 4.9, `\'message\' in error` estrecha a `object & Record<\'message\', unknown>`, y la comprobación `typeof` final lo convierte en string.\n\nEscribir `(error as Error).message` compila, pero falla o miente justo con las entradas para las que existe este handler.',
  },
  'typescript-optional-zero-fix': {
    prompt:
      'Un reporte de inventario dice `bolts: not tracked` aunque el almacén tiene cero pernos registrados. Corrige la comprobación para que solo una cantidad **ausente** o `null` cuente como no rastreada.',
    explanation:
      'El narrowing por truthiness quita `undefined` y `null` del tipo, por eso la versión con el bug compila, pero también rechaza los valores válidos `0`, `NaN` y `""`. Para un número opcional, comprueba nullish de forma explícita (`=== undefined || === null`, o el idiomático `line.quantity == null`), o usa `??` cuando quieras un valor alternativo (`line.quantity ?? \'n/a\'`) en lugar de `||`.',
  },
  'typescript-optional-vs-undefined': {
    prompt:
      'Con `strict` activado (y `exactOptionalPropertyTypes` desactivado), ¿cuál es la diferencia entre `{ nickname?: string }` y `{ nickname: string | undefined }`?',
    explanation:
      '`?` significa **la clave puede estar ausente**; `| undefined` significa **el valor puede ser undefined**. Leer cualquiera de los dos da `string | undefined`, pero solo el opcional se puede omitir en un literal de objeto. Ninguno acepta `null`; tienes que agregar `| null` explícitamente.\n\nLa diferencia importa siempre que la presencia tenga significado: `\'nickname\' in obj`, `Object.keys`, el spread de objetos y la semántica de PATCH ("ausente significa sin cambios, `undefined` o `null` significa borrar"). Por defecto TypeScript deja que `nickname?: string` reciba un `undefined` explícito; `exactOptionalPropertyTypes` lo endurece para que el tipo describa lo que realmente ve el runtime.',
    options: {
      a:
        'El primero permite a quien llama omitir la clave; el segundo exige que la clave esté presente, aunque su valor puede ser `undefined`. Activar `exactOptionalPropertyTypes` además impide que el primero acepte un `nickname: undefined` explícito.',
      b: 'No hay diferencia; `?` es la forma abreviada de `| undefined`.',
      c: 'El primero también acepta `null`; el segundo no.',
      d: 'El segundo permite a quien llama omitir la clave; el primero la exige.',
    },
  },
  'typescript-partial-spread-undefined': {
    prompt:
      'Una pantalla de configuración combina un patch `Partial` sobre los valores por defecto. Esto compila con `strict`. ¿Qué imprime, un valor por línea?',
    explanation:
      '`Partial<Settings>` hace opcionales todas las claves, y sin `exactOptionalPropertyTypes` una clave opcional también acepta un `undefined` explícito. El spread de objetos copia las propiedades **propias**, incluidas las que tienen valor `undefined`, así que `theme: undefined` sobrescribe el valor por defecto.\n\nEl compilador sigue tipando `merged.theme` como `string`: modela una propiedad opcional en un spread como "quizás ausente", no como "quizás presente y undefined". Es una falta de solidez conocida, y lleva `undefined` a código que confía en el tipo.\n\nSoluciones: quitar las entradas `undefined` antes de combinar (como arriba), activar `exactOptionalPropertyTypes` para que `{ theme: undefined }` se rechace, o combinar campo por campo con `??`.\n\n**Dilo en voz alta:** "Una propiedad opcional y una propiedad con valor `undefined` son distintas en tiempo de ejecución; el spread copia el `undefined`, TypeScript no lo modela por defecto, y `exactOptionalPropertyTypes` es la forma de hacer que el tipo coincida con el runtime."',
  },
  'typescript-pick-omit-runtime': {
    prompt:
      'Los tipos integrados `Pick<T, K>` y `Omit<T, K>` solo existen en tiempo de compilación. Implementa `pick` y `omit` en tiempo de ejecución cuyos tipos de retorno sean esos utility types, para que `solution` devuelva una tarjeta con solo `id` y `name`, y un usuario público **sin** `passwordHash`.',
    explanation:
      '`Pick<T, K>` es el mapped type `{ [P in K]: T[P] }`; `Omit<T, K>` es `Pick<T, Exclude<keyof T, K>>`. El starter muestra por qué los tipos solos no alcanzan: devolver `source` **pasa la comprobación de tipos** (un `User` es asignable estructuralmente a ambos), y aun así el `passwordHash` viaja por la red. El tipado estructural permite propiedades extra, así que un tipo DTO nunca elimina datos; solo lo hace el código en tiempo de ejecución.\n\nLas implementaciones necesitan un cast interno porque `Object.fromEntries` pierde la información de las claves; mantener ese cast dentro de un helper pequeño y probado es lo que les da tipos exactos a quienes lo llaman. Esta combinación (derivar el tipo DTO con `Pick`/`Omit` y construirlo con una copia real) es la forma estándar de dar forma a las respuestas de una API.',
  },
  'typescript-utility-types-equivalence': {
    prompt:
      '```ts\ninterface User {\n  id: number;\n  name: string;\n  email: string;\n}\n```\nNecesitas el tipo del payload de PATCH `{ name?: string; email?: string }`. ¿Cuáles de estos producen exactamente ese tipo? Selecciona todos los que correspondan.',
    explanation:
      '- **a**: quita `id` y luego hace opcional el resto.\n- **b**: hace todo opcional y luego quita `id`. `Omit` está construido sobre `Pick`, y `Pick` es un mapped type *homomórfico* (itera sobre `keyof T`), así que **conserva** los modificadores `?` y `readonly` que encuentra.\n- **d**: la misma conservación de modificadores, con las claves listadas explícitamente.\n- **c** es la confusión clásica: `Exclude<U, E>` filtra miembros de una **unión**. `Partial<User>` es un solo tipo de objeto, no una unión que contenga `\'id\'`, así que no se excluye nada y `id?` se queda.\n\n**Dilo en voz alta:** "`Omit` y `Pick` trabajan sobre las claves de un tipo de objeto, `Exclude` y `Extract` trabajan sobre los miembros de una unión, y los mapped types homomórficos como `Pick` y `Partial` conservan los modificadores opcional y readonly, así que el orden de composición a menudo no importa."',
  },
  'typescript-deep-readonly-freeze': {
    prompt:
      '`DeepReadonly<T>` es un mapped type recursivo que hace `readonly` cada propiedad anidada en tiempo de compilación. Implementa `deepFreeze` para que el runtime cumpla la misma promesa: el objeto y cada objeto o array anidado deben quedar congelados. `solution` reporta `Object.isFrozen` para la raíz, un objeto anidado y un array anidado.',
    explanation:
      'El tipo combina un **conditional type** (las funciones pasan sin cambios, los objetos se recorren de forma recursiva, los primitivos se quedan como están) con un **mapped type** que agrega `readonly` a cada clave. Se distribuye sobre las uniones y también funciona con arrays, porque un mapped type homomórfico sobre un tipo array produce un array readonly.\n\nPero `readonly` se borra: un cast o quien llame desde JavaScript simple todavía puede mutar. `Object.freeze` es la mitad de runtime, y es **superficial**, así que la implementación debe ser recursiva (`Reflect.ownKeys` también cubre las claves symbol; la comprobación `isFrozen` detiene los ciclos y el trabajo repetido). El `as` final es inevitable: el compilador no puede demostrar que un loop en tiempo de ejecución satisface un tipo recursivo.\n\n**Dilo en voz alta:** "Los utility types y los mapped types describen formas solo en tiempo de compilación; cuando la garantía tiene que cumplirse en tiempo de ejecución, acompaño el tipo con código que la imponga, y mantengo el único cast inevitable dentro de ese helper."',
  },
  'typescript-boundary-validation-open': {
    prompt:
      'Un servicio consume JSON de un webhook de un tercero y de una llamada a una herramienta de un LLM. Hoy el código hace `const event = (await res.json()) as OrderEvent`. ¿Qué tiene de malo eso y cómo tipas correctamente estos límites?',
    explanation:
      'Esta es la pregunta de TypeScript a nivel de arquitecto: el sistema de tipos es una herramienta de tiempo de compilación y **no garantiza nada sobre los datos externos**. Las respuestas fuertes nombran el mecanismo (parseo con schema en el borde, tipos inferidos), el camino de fallo operativo, e incluyen límites que no son HTTP.\n\n**Dilo en voz alta:** "Los tipos se borran, así que en cada límite recibo `unknown`, lo parseo con un schema e infiero el tipo a partir de ese schema; la entrada inválida falla rápido en el borde con un error claro en lugar de tres capas más adentro."',
    modelAnswer:
      'El cast `as` es una aserción sin comprobar: los tipos se borran, así que los datos mal formados fluyen hasta lo profundo del sistema y fallan lejos de su causa o, peor, se persisten. Todo lo que cruza un límite de confianza (bodies HTTP, webhooks, mensajes de colas, variables de entorno, `localStorage`, la salida de un LLM o de una herramienta) debería entrar como `unknown` y **parsearse** en el borde con un schema de runtime como zod, valibot o ajv. Derivo el tipo estático a partir del schema (`type OrderEvent = z.infer<typeof OrderEvent>`) para que el validador y el tipo no puedan desincronizarse. Parsea, no valides: el parser devuelve un valor tipado o un error estructurado, y más allá del borde el código de dominio nunca vuelve a ver `unknown`. El camino de fallo es explícito: un 400 para las APIs síncronas, una dead-letter queue para webhooks y mensajes, un reintento acotado o un prompt de reparación para la salida del LLM, y un log con el correlation id en todos los casos. También decido por límite si las claves desconocidas se eliminan o se rechazan, y versiono el schema cuando cambia el productor. La configuración de entorno recibe el mismo tratamiento al arrancar, para que el proceso falle rápido en lugar de en la primera petición.',
    rubric: [
      '`as` y los type predicates no se comprueban; los tipos se borran en tiempo de ejecución',
      'Recibir los datos del límite como `unknown` y parsearlos con un schema de runtime en el borde',
      'Derivar el tipo estático a partir del schema para tener una sola fuente de verdad',
      'Define el camino de fallo: 4xx, dead-letter queue, reintentos o reparación, logging',
      'Lo aplica más allá de HTTP: salida de LLMs/herramientas, mensajes, configuración de entorno',
    ],
  },
  'typescript-parse-untrusted-tickets': {
    prompt:
      'Reemplaza el cast mentiroso por una validación real. `solution(json)` debe devolver solo los tickets válidos de un string JSON: `id` es un string no vacío, `status` es `open`, `pending` o `closed`, y `priority` está ausente o es un número finito. Un JSON inválido o un payload que no sea un array devuelve `[]`. Escribe una guarda `value is Ticket` que parta de `unknown`.',
    explanation:
      '`JSON.parse` devuelve `any`; asignarlo primero a `unknown` obliga a que cada uso pase por una comprobación. Un **type guard definido por el usuario** (`value is Ticket`) conecta una comprobación en tiempo de ejecución con el narrowing en tiempo de compilación, y pasarlo a `filter` da un `Ticket[]` sin ningún cast en el punto de llamada.\n\nLa guarda es tan honesta como su cuerpo, y justamente por eso el código de producción la genera a partir de un schema (el `Ticket.safeParse` de zod) en lugar de escribirla a mano. Decide también la política de forma explícita: aquí los elementos inválidos se descartan; una API que deba rechazar todo el payload devolvería un error en su lugar y, en cualquier caso, deberías registrar en el log lo que se rechazó.\n\n**Dilo en voz alta:** "`as` le dice al compilador que confíe en mí; un type guard o un schema hace que el runtime lo demuestre, y solo confío en los datos después de que se hayan demostrado."',
  },
};
