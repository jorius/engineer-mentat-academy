// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  'design-patterns-builder-recognition': {
    prompt:
      "```js\nconst request = new RequestBuilder()\n  .url('/orders')\n  .method('POST')\n  .header('Idempotency-Key', key)\n  .timeout(2000)\n  .build();\n```\n¿Qué patrón es este y qué problema resuelve?",
    options: {
      a: 'Builder: arma un objeto complejo paso a paso y reemplaza un constructor con muchos argumentos posicionales opcionales',
      b: 'Factory Method: cada llamada encadenada elige qué subclase de `Request` instanciar',
      c: 'Decorator: cada llamada encadenada envuelve la solicitud en un objeto nuevo que agrega comportamiento',
      d: 'Chain of Responsibility: cada llamada pasa la solicitud al siguiente handler hasta que uno la acepta',
    },
    explanation:
      'Un Builder se reconoce por un único método de creación (`build()`/`create()`) y varios métodos de configuración que normalmente devuelven `this` para poder encadenarse. Existe para eliminar el *constructor telescópico* (`new Request(url, method, headers, undefined, 2000, true)`) y para que `build()` valide el objeto completo una sola vez. Devolver `this` lo hace fluido, pero la fluidez por sí sola no es el patrón: un Decorator devuelve un *nuevo envoltorio* con la misma interfaz, y una Chain of Responsibility pasa una solicitud entre handlers en tiempo de ejecución.',
    hint: 'Fíjate en qué devuelve cada llamada encadenada y qué hace la última; pregúntate qué patrón reemplaza un constructor con una larga lista de argumentos opcionales.',
  },
  'design-patterns-vehicle-factory-falsy-defaults': {
    prompt: 'Una `VehicleFactory` guiada por configuración usa `||` para los valores por defecto, como en la versión clásica de los tutoriales. ¿Qué imprime esto, una línea por cada `console.log`?',
    explanation:
      '`||` usa el valor por defecto ante **cualquier valor falsy**, así que un `0` legítimo en las puertas o un `state` vacío explícito se reemplaza en silencio por el valor por defecto (4 y `"new"`). `??` solo usa el valor por defecto ante `null`/`undefined`, y por eso `wheels: 0` sobrevive en el remolque. `bike.type` es `"motorcycle"` porque `Motorcycle` agrega `type: "motorcycle"` a lo que le pasa a `super` (la entrada solo trae `vehicleType`; ponerlo después de `...options` también le permitiría sobrescribir un `type` que viniera en la entrada). En una factory que construye objetos a partir de configuración externa, este es un bug real de corrupción de datos: prefiere `??` o los valores por defecto en la desestructuración (`{ doors = 4 }`), que también se aplican solo a `undefined`.',
    hint: 'Compara qué valores trata `||` como faltantes y cuáles trata `??`, y revisa qué le pasa la subclase a `super`.',
  },
  'design-patterns-factory-registry-prototype-keys': {
    prompt:
      "El equipo reemplazó el `switch` de la factory por un mapa de búsqueda para que los nuevos tipos de vehículo se agreguen registrando un creador (abierto/cerrado). Los tipos desconocidos deben caer en un `vehicle` genérico con 4 puertas. Un test de fuzzing que envía valores de `vehicleType` como `'constructor'` y `'__proto__'` ahora falla. Corrige `createVehicle` para que la búsqueda solo use creadores **registrados**. Deja `solution` como está.",
    explanation:
      "Un objeto literal simple hereda de `Object.prototype`, así que `creators['constructor']` es la función `Object` (que devuelve su argumento sin cambios), `creators['toString']` es un método y `creators['__proto__']` es el propio `Object.prototype`: no se puede llamar, así que la factory lanza un error. Cualquier clave que venga de la entrada del usuario o de configuración debe buscarse en una estructura que solo contenga lo que registraste: un `Map`, un diccionario `Object.create(null)` o una guarda `Object.hasOwn(creators, type)`.\n\nEl registro en sí es la decisión correcta: convierte la factory en algo que extiendes agregando una entrada en lugar de editar un `switch` (abierto/cerrado), y permite que los plugins registren sus propios tipos.\n\n**Dilo en voz alta:** \"Un mapa de factory guiado por configuración es como mantengo la creación abierta a la extensión, pero la búsqueda tiene que ser por clave propia: un `Map` u `Object.hasOwn`, nunca un índice directo sobre un objeto con entrada no confiable.\"",
    hint: 'Un objeto literal hereda claves de `Object.prototype`. Usa una búsqueda que solo vea entradas propias: un `Map` o una guarda con `Object.hasOwn`.',
  },
  'design-patterns-singleton-module-closure': {
    prompt:
      'Todos los que llaman a `getConfig()` deberían compartir **un** único objeto de configuración, creado de forma perezosa en el primer uso. Ahora mismo cada llamada construye uno nuevo. Corrige `getConfig` usando un closure a nivel de módulo (no hace falta una clase). Deja sin cambios `createConfig` y `solution`.',
    explanation:
      'En JavaScript el sistema de módulos ya te da un Singleton: el cuerpo de un módulo se ejecuta una sola vez y todos los que lo importan obtienen los mismos bindings. Un `let instance` privado más un getter perezoso es todo el patrón; una clase con un `static #instance` y un `getInstance()` estático (TypeScript además puede marcar el constructor como `private`; JavaScript no) es la misma idea con más ceremonia.\n\nEl costo de un Singleton es el estado global oculto: las pruebas lo comparten y es difícil de reemplazar. Cuando puedas, prefiere exportar una factory e inyectar la instancia, y reserva los Singletons de verdad para cosas que deben ser únicas por proceso (un pool de conexiones, un logger).',
    hint: 'Mantén una variable a nivel de módulo que sobreviva entre llamadas y crea la configuración solo la primera vez, cuando está vacía.',
  },
  'design-patterns-memoize-decorator-falsy-cache': {
    prompt:
      '`memoize` es un Decorator: envuelve una función con caché manteniendo la misma firma de llamada. El profiling muestra que `slowSquare(0)` se sigue recalculando en cada llamada. Corrige `memoize` para que **todo** resultado calculado previamente se sirva desde la caché, sea cual sea su valor.',
    explanation:
      'La verificación por truthiness trata un `0` en caché (o `""`, `false`, `null`) como un fallo de caché, así que los resultados falsy nunca se sirven desde la caché. Verifica la **presencia** (`Map#has`, u `Object.hasOwn(cache, key)`) en lugar del valor.\n\nUn `Map` también evita otras dos trampas de la caché basada en objetos: las claves se convierten a string (`1` y `"1"` colisionan) y las claves heredadas como `"constructor"` parecen aciertos. Para funciones con varios argumentos necesitas una estrategia de claves (`JSON.stringify(args)` para primitivos, `WeakMap`s anidados para argumentos que son objetos), y para procesos de larga vida un límite (LRU) para que la caché no sea una fuga de memoria. La memoización solo es segura para funciones **puras**.',
    hint: 'La verificación del caché evalúa si el valor guardado es truthy. Verifica en cambio si la clave está presente, por ejemplo con `Map#has`.',
  },
  'design-patterns-adapter-vs-facade': {
    prompt:
      'Tu código de dominio ya depende de esta interfaz:\n```ts\ninterface PaymentGateway {\n  charge(amountCents: number, token: string): Promise<{ id: string }>;\n}\n```\nEscribes `StripeGateway implements PaymentGateway`, que traduce la llamada a esta solicitud de Stripe y mapea la respuesta de vuelta:\n```ts\nstripe.paymentIntents.create({\n  amount,\n  currency,\n  payment_method,\n  confirm: true,\n});\n```\nPara el próximo trimestre planeas también un `AdyenGateway`. ¿Qué patrón es principalmente `StripeGateway`?',
    options: {
      a: 'Adapter: convierte la interfaz de un proveedor en la interfaz que tu código ya espera',
      b: 'Facade: oculta un subsistema complejo detrás de un único punto de entrada más simple',
      c: 'Proxy: sustituye al cliente de Stripe con la misma interfaz para controlar el acceso',
      d: 'Decorator: envuelve al cliente de Stripe para agregar comportamiento manteniendo su interfaz',
    },
    explanation:
      'El dato decisivo es que la **interfaz destino ya existe** (`PaymentGateway`) y la clase traduce una interfaz incompatible a ella: eso es un Adapter, y es exactamente lo que hace intercambiable al proveedor. Un Facade también simplifica, pero define un frente simplificado *nuevo* sobre un subsistema que normalmente es tuyo (`BillingService.charge()` sobre tres APIs internas) y no se trata de ajustarse a una interfaz esperada. Proxy y Decorator mantienen ambos la **misma** interfaz que el objeto envuelto: un Proxy controla el acceso (caché, inicialización perezosa, rate limiting), un Decorator agrega comportamiento (reintentos, logging, `withRetry(fn)`, HOCs).',
    hint: 'Pregúntate si la interfaz destino ya existía antes de esta clase, y si la clase conserva la interfaz del objeto envuelto o la traduce a otra.',
  },
  'design-patterns-observer-emitter': {
    prompt:
      'Implementa el `Emitter` (Observer / pub-sub) que usa `solution`:\n\n- `on(event, listener)` registra un listener y devuelve una **función para desuscribirse**.\n- `once(event, listener)` registra un listener que se elimina a sí mismo después de su primera llamada.\n- `emit(event, payload)` llama a cada listener registrado para `event`, **en el orden de registro**.\n\nLos listeners pueden suscribirse o desuscribirse mientras un `emit` está en curso; eso no debe hacer que se salte otro listener. No cambies `solution`.',
    explanation:
      'La primera prueba es la trampa: el envoltorio de `once` se elimina a sí mismo del array **durante** `emit`. Si `emit` itera el array vivo, `splice` corre `audit` al índice que el bucle ya visitó y se lo salta en la primera orden. Iterar una copia (`[...list]`) es lo que hace también el `EventEmitter` de Node.\n\nDevolver una función para desuscribirse (como hacen `subscribe` de Redux y los efectos de React) es la API más limpia, porque quien llama no necesita guardar una referencia al listener exacto. En procesos de larga vida, las suscripciones olvidadas son la clásica fuga de memoria del Observer, y por eso Node avisa cuando se pasan de 10 listeners por evento. Un detalle de producción que las pruebas no cubren: un listener que lanza un error corta el bucle y los listeners siguientes nunca se ejecutan (el `emit` de Node se comporta igual), así que envuelve cada llamada en `try/catch` y reporta el error cuando un suscriptor que falla no debe dejar sin ejecutar al resto.\n\n**Dilo en voz alta:** "Observer desacopla al publicador de sus suscriptores; los detalles que importan en producción son copiar los listeners durante el emit, darle siempre a quien llama una forma de desuscribirse y aislar el error de un listener del resto."',
    hint: 'Guarda los listeners por evento en un `Map` de arrays, haz que `on` devuelva un closure que lo quite, y piensa qué le pasa al ciclo cuando `once` se quita a sí mismo durante `emit`.',
  },
  'design-patterns-strategy-map-shipping': {
    prompt:
      'Implementa `solution(method, weightKg)` que devuelva el costo de envío usando un **mapa de estrategias** (un `Map`, o un objeto verificado con `Object.hasOwn`, del nombre del método a una función de precio), no un `switch`:\n\n- `standard`: 5 + 1.5 por kg\n- `express`: 15 + 3 por kg\n- `pickup`: siempre 0\n- cualquier otro método: `null`',
    explanation:
      'El patrón estrategia convierte cada algoritmo en un valor que puedes elegir en tiempo de ejecución. En JavaScript una estrategia suele ser simplemente una función, así que el "patrón" es una tabla de búsqueda de funciones. Agregar `overnight` significa agregar una entrada, no editar un `switch` que crece en cada lugar donde se calcula el precio del envío: ese es el principio abierto/cerrado en la práctica. Los comparadores de ordenamiento y los proveedores intercambiables de autenticación o de pagos son la misma idea.',
    hint: 'Usa un `Map` del nombre del método a una función de precio y busca el método; un nombre desconocido, incluida una clave heredada, no tiene entrada.',
  },
  'design-patterns-command-undo': {
    prompt:
      "Termina este editor de texto con el patrón Command. Cada operación es un objeto comando con `execute(doc)` y `undo(doc)`; los comandos ejecutados van a una pila de historial.\n\n- `['type', text]` agrega `text` al final.\n- `['delete', n]` elimina los últimos `n` caracteres (o todos si hay menos).\n- `['undo']` revierte el comando más reciente que siga en el historial; con el historial vacío no hace nada.\n\nDevuelve el texto final.",
    explanation:
      'Command convierte una acción en un objeto, de modo que se puede guardar, encolar, registrar, reintentar o revertir. La parte sutil es que `undo` necesita el estado capturado en el momento de `execute`: `delete` debe recordar **qué** eliminó (aquí solo 3 caracteres, no 5); si no, undo no puede restaurarlo. La misma forma aparece en las colas de jobs (un comando serializado que se entrega a un worker) y en Redux, donde las acciones son mensajes de datos simples que se pueden registrar y reproducir (la guía de estilo de Redux las modela como eventos, no como comandos).',
    hint: 'Cada comando debe capturar en `execute` lo que su `undo` necesita, como los caracteres que realmente se borraron. Trata el historial como una pila.',
  },
  'design-patterns-over-patterning': {
    prompt:
      'Un pull request para una feature que envía notificaciones solo por email introduce `NotificationFactory`, una `AbstractChannelFactory`, una interfaz `ChannelStrategy` con una sola implementación y un Singleton `NotificationManager`. El autor dice que "esto lo hace extensible". ¿Cómo lo revisas, y cuándo pedirías estos patrones?',
    modelAnswer:
      'Evaluaría cada abstracción por el cambio que absorbe, no por si es un patrón con nombre. Con un solo canal, una interfaz de estrategia y dos capas de factory agregan indirección y archivos sin proteger contra ningún cambio que realmente esperemos, así que pediría una función simple `sendEmailNotification` detrás de un límite de módulo pequeño. El Singleton es la parte que más cuestionaría: el estado global oculto hace que las pruebas dependan del orden, e inyectar el emisor da el mismo uso compartido sin el acoplamiento. Si producto confirma que vienen SMS y push, un mapa de estrategias indexado por canal es el siguiente paso correcto y es un refactor pequeño y reversible a partir de una función bien factorizada, no una reescritura, así que no se pierde nada por empezar simple. Abstract Factory solo se justifica cuando creas **familias** de objetos relacionados que deben mantenerse consistentes (por ejemplo cliente, firmador y parser por proveedor), que no es el caso aquí. El mejor diseño suele ser lo más simple que absorba el cambio que esperas, y los patrones deberían introducirse cuando aparece la segunda o tercera variación.',
    rubric: [
      'Justifica los patrones por el problema concreto o el cambio que absorben, no por su nombre',
      'Señala el Singleton como estado global oculto que perjudica las pruebas y prefiere la inyección',
      'Explica cuándo se justificaría un Strategy o una factory (una segunda variación real)',
      'Sabe para qué sirve realmente Abstract Factory (familias de objetos relacionados)',
      'Plantea la retroalimentación como un camino reversible e incremental en lugar de una reescritura',
    ],
    explanation:
      'Señal senior: nombrar el patrón es fácil; la habilidad es saber cuándo **no** vale su indirección. Abusar de los patrones es un olor, y "extensible" solo es un beneficio para las extensiones que de verdad vas a hacer.\n\n**Dilo en voz alta:** "Justifico un patrón por el problema que resuelve. Con un solo canal de email esto es indirección sin retorno; empezaría con una función simple e introduciría un mapa de estrategias cuando el segundo canal sea real."',
    hint: 'Juzga cada abstracción por el cambio concreto que absorbe hoy, nombra el costo del estado global oculto y di qué señal real justificaría agregar un patrón después.',
  },
};
