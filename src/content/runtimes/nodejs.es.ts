// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  // fundamentals
  'nodejs-esm-dirname-migration': {
    prompt:
      'Cambias un paquete a ES modules agregando `"type": "module"` a `package.json`. ¿Qué línea de `server.js` ahora **lanza un error en tiempo de ejecución**?',
    options: {
      c: '```js\nconst config = await import(\'./config.js\');\n```\n(en el nivel superior)',
    },
    explanation:
      '`__dirname`, `__filename`, `require`, `module` y `exports` son **variables del wrapper de CommonJS**: Node las inyecta envolviendo cada archivo CJS en una función. Los ES modules no se envuelven, así que `__dirname` produce un `ReferenceError`. Usa `import.meta.dirname` (Node 20.11+) o `path.dirname(fileURLToPath(import.meta.url))`, y `createRequire(import.meta.url)` si todavía necesitas `require`.\n\nEl `await` de nivel superior es válido en ESM (no lo es en CJS), los imports por defecto de los módulos integrados funcionan y `export default` es la forma de exportar en ESM. Otras diferencias de ESM que vale la pena conocer: siempre se ejecuta en modo estricto, los imports son bindings vivos de solo lectura y el grafo de módulos se carga de forma asíncrona.',
    hint: 'Pregúntate qué identificadores inyecta Node al envolver cada archivo CommonJS en una función, y si los módulos ES reciben esa envoltura.',
  },
  'nodejs-libuv-threadpool-operations': {
    prompt:
      'Node ejecuta tu JavaScript en un solo hilo, pero libuv mantiene un **pool de hilos** (thread pool; tamaño por defecto 4, `UV_THREADPOOL_SIZE`). ¿Cuáles de estas operaciones asíncronas se ejecutan en ese pool de hilos? Selecciona todas las que apliquen.',
    options: {
      c: 'Leer el cuerpo de una petición HTTP entrante desde su socket',
      d: '`dns.lookup(\'api.example.com\', cb)` (también lo usa implícitamente `http.get` con un nombre de host)',
    },
    explanation:
      'Los sockets de red **no** usan el pool: libuv los registra en la API de disponibilidad del kernel (epoll, kqueue, IOCP) y el event loop recibe la notificación en la fase poll, por eso un solo hilo puede mantener decenas de miles de conexiones. Las llamadas al sistema de archivos, `dns.lookup` (envuelve el `getaddrinfo` bloqueante), la criptografía asíncrona (`pbkdf2`, `scrypt`, `randomBytes`) y el `zlib` asíncrono no tienen una API del kernel no bloqueante y portable, así que se ejecutan en el pool.\n\nLa consecuencia práctica: con los 4 hilos por defecto, cuatro hashes `pbkdf2` o búsquedas DNS lentas dejan en cola todas las demás llamadas a `fs` detrás de ellas. Aumenta `UV_THREADPOOL_SIZE` (configúralo antes del primer uso del pool) o saca el hashing de la ruta de la petición. Esta es la respuesta concreta a "cómo maneja JavaScript el trabajo asíncrono si tiene un solo hilo".',
    hint: 'Separa el trabajo que el kernel puede reportar como listo (epoll, kqueue, IOCP) de las llamadas bloqueantes al sistema que libuv tiene que pasar a un hilo trabajador.',
  },
  'nodejs-async-function-runs-sync': {
    prompt:
      'Un compañero marcó como `async` una función que usa mucha CPU "para que no bloquee". ¿Qué imprime esto, un valor por línea?',
    explanation:
      'Una función `async` se ejecuta de forma **síncrona** hasta su primer `await`. Aquí no hay ningún `await`, así que todo el bucle corre en el stack de quien la llama antes de que se imprima `after call`. La promesa devuelta ya está cumplida cuando `sumTo` retorna; solo el callback de `.then` se difiere, como una microtarea que corre cuando termina el script, y por eso `total 500500` sale al final.\n\n`async` cambia cómo se entrega el resultado, no dónde se ejecuta el trabajo. El comportamiento no bloqueante real viene de que el runtime haga el trabajo en otro lugar (el kernel, el pool de libuv) o de que tú muevas el trabajo de CPU a un worker thread.',
    hint: 'Recuerda hasta dónde se ejecuta una función `async` antes de ceder el control por primera vez, y qué implica eso cuando su cuerpo nunca usa `await`.',
  },

  // event-loop-phases
  'nodejs-set-immediate-phase': {
    prompt: '¿En qué fase del event loop de Node.js se ejecutan los callbacks de `setImmediate()`?',
    explanation:
      'Una iteración del loop ejecuta estas fases en orden:\n\n1. **timers**: callbacks vencidos de `setTimeout` / `setInterval`\n2. **pending callbacks**: algunos callbacks de I/O del sistema diferidos desde la iteración anterior\n3. **idle, prepare**: internas\n4. **poll**: espera y ejecuta callbacks de I/O (aquí corre la mayor parte de tu código)\n5. **check**: callbacks de `setImmediate`\n6. **close callbacks**: p. ej. `socket.on(\'close\')`\n\n`setImmediate` existe precisamente para decir "ejecuta esto justo después de la fase poll actual". Entre cada callback, Node vacía la cola de `process.nextTick` y luego la cola de microtareas de promesas.',
    hint: 'Repasa las fases del event loop en orden y qué tipo de callback ejecuta cada una.',
  },
  'nodejs-immediate-vs-timeout-in-io': {
    prompt: `¿En qué orden imprime la salida este programa CommonJS?

\`\`\`js
const fs = require('node:fs');

fs.readFile(__filename, () => {
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));
});
\`\`\``,
    options: {
      a: 'Siempre `immediate` y luego `timeout`',
      b: 'Siempre `timeout` y luego `immediate`, porque los timers se ejecutan primero en cada iteración',
      c: 'No es determinista; depende de qué tan rápido sea el proceso',
      d: 'Depende de `UV_THREADPOOL_SIZE`, porque `readFile` se ejecuta en el pool',
    },
    explanation:
      'El callback de `readFile` se ejecuta en la fase **poll**. Cuando termina, el loop pasa a la fase **check**, que ejecuta el immediate. El timer solo puede dispararse cuando el loop da la vuelta hasta la fase **timers** de la siguiente iteración. Así que, dentro de un callback de I/O, `setImmediate` siempre gana.\n\n"No es determinista" es la respuesta correcta para otro programa: cuando ambos se programan desde el **módulo principal**, el orden no es determinista. `setTimeout(fn, 0)` en realidad es 1 ms, y que ese 1 ms ya haya transcurrido cuando la primera iteración revisa los timers depende de los tiempos de arranque del proceso.',
    hint: 'Fíjate en qué fase corre el callback de `readFile` y luego pregúntate a qué fase llega el loop después y cuándo vuelve a revisar los timers.',
  },
  'nodejs-nexttick-promise-ordering': {
    prompt: `Este archivo se ejecuta como \`node order.cjs\` (CommonJS). ¿Qué afirmación sobre la salida es correcta?

\`\`\`js
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));
Promise.resolve().then(() => console.log('promise'));
process.nextTick(() => console.log('nextTick'));
console.log('sync');
\`\`\``,
    options: {
      a: '`sync`, `nextTick`, `promise` y luego `timeout` e `immediate` en un orden que no está garantizado',
      b: '`sync`, `promise`, `nextTick`, `timeout`, `immediate`, porque las promesas son microtareas estándar y `nextTick` es una macrotarea',
      c: '`sync`, `nextTick`, `promise`, `immediate`, `timeout`, siempre',
    },
    explanation:
      'Cuando termina el script principal, Node vacía **primero la cola de `process.nextTick` y luego la cola de microtareas de promesas**, y lo vuelve a hacer después de cada callback en cada fase. Así que `nextTick` le gana a `promise`, y ambos le ganan a cualquier timer o immediate.\n\nLuego arranca el loop: la fase **timers** ejecuta `timeout` solo si su 1 ms ya transcurrió; si no, la fase **check** ejecuta `immediate` primero y `timeout` espera a la siguiente iteración. Desde el módulo principal esa carrera no es determinista (dentro de un callback de I/O, `immediate` siempre gana).\n\nTrampa de ESM: en un archivo `.mjs` el propio cuerpo del módulo se ejecuta dentro de un job de promesa, así que la cola de microtareas se vacía antes de que Node vuelva a la cola de nextTick, y `promise` se imprime **antes** que `nextTick`. Un `nextTick` recursivo también puede dejar sin turno al loop por completo, y por eso la documentación de Node recomienda `queueMicrotask` o `setImmediate` para la mayoría de los diferimientos.\n\n**Dilo en voz alta:** "Cola de nextTick y luego microtareas, después de cada callback; timers contra check desde el módulo principal es una carrera, pero dentro de un callback de I/O setImmediate siempre se ejecuta primero porque check viene después de poll."',
    hint: 'Recuerda qué cola vacía Node primero al terminar el script principal, y qué decide si un timer de 0 ms ya venció cuando el loop llega por primera vez a la fase de timers.',
  },
  'nodejs-microtask-queue-interleaving': {
    prompt: '¿Qué imprime esto, un valor por línea?',
    explanation:
      'La cola de microtareas es FIFO y se vacía **por completo**, incluidas las microtareas encoladas mientras se vacía, antes de que el event loop pase a la siguiente macrotarea.\n\nDespués de `sync`, la cola es `[micro 1, promise 1]`. Ejecutar `micro 1` agrega `micro 2`; ejecutar `promise 1` resuelve la promesa encadenada y agrega `promise 2`. Cola: `[micro 2, promise 2]`. Solo cuando queda vacía, la fase timers ejecuta `timeout`.\n\nEsa misma regla explica cómo una cadena infinita de microtareas deja sin turno a los timers y al I/O: el loop nunca pasa del vaciado.',
    hint: 'La cola de microtareas se vacía por completo, incluidas las tareas que se agregan mientras se vacía, antes de cualquier macrotarea; sigue la cola después de cada paso `.then`.',
  },
  'nodejs-microtasks-between-timers': {
    prompt: '¿Qué imprime esto en Node 11+ (y en los navegadores), un valor por línea?',
    explanation:
      '`job()` se ejecuta de forma síncrona hasta `await null`, que encola su continuación **antes** de que se encole `p1`, así que `job resumed` va antes que `p1`. Ambos le ganan a todos los timers.\n\nEn la fase timers, tanto `t1` como `t2` están vencidos. Desde **Node 11**, las microtareas se vacían después de **cada** callback de timer (igual que en los navegadores), así que `t1 microtask` se imprime antes que `t2`. En Node 10 y versiones anteriores primero se ejecutaba todo el lote de timers vencidos, lo que daba `t1, t2, t1 microtask`. `t3` se programó durante la fase timers, así que se ejecuta después de `t2` (en la siguiente pasada por los timers).\n\n**Dilo en voz alta:** "Un await no es más que una continuación en una microtarea, y desde Node 11 la cola de microtareas se vacía entre cada callback individual de timer o de immediate, no una vez por fase."',
    hint: 'Recuerda qué difiere un `await` y en qué momento, y que desde Node 11 las microtareas se vacían después de cada callback de timer, no una vez por fase de timers.',
  },

  // streams-and-large-files
  'nodejs-stream-types-gzip': {
    prompt:
      'Comprimes un archivo de log de 20 GB con este pipeline:\n\n```js\npipeline(\n  fs.createReadStream(src),\n  zlib.createGzip(),\n  fs.createWriteStream(dest)\n)\n```\n\n¿Qué tipo de stream es `zlib.createGzip()`?',
    options: {
      d: 'Un Duplex simple con lados de lectura y escritura independientes, como un socket TCP',
    },
    explanation:
      'Node tiene cuatro tipos de stream: **Readable** (origen, p. ej. `fs.createReadStream`), **Writable** (destino, p. ej. `fs.createWriteStream`), **Duplex** (ambos lados, independientes, p. ej. un socket TCP donde lo que lees no tiene nada que ver con lo que escribiste) y **Transform**, un Duplex cuya salida se calcula a partir de su entrada (gzip, cifrado, parseo de CSV).\n\nCon streaming, el archivo se procesa chunk por chunk (64 KiB por defecto en los streams de archivos), así que la memoria se mantiene estable sin importar el tamaño del archivo, mientras que `fs.readFile` intentaría guardar los 20 GB en un Buffer y fallaría.',
    hint: 'Recuerda los cuatro tipos de stream de Node y qué distingue a los dos que son a la vez legibles y escribibles.',
  },
  'nodejs-pipeline-over-pipe': {
    prompt:
      '¿Por qué se prefiere `stream.pipeline()` (o `pipeline` de `node:stream/promises`) en lugar de encadenar `source.pipe(transform).pipe(dest)`? Selecciona todas las que apliquen.',
    options: {
      a: 'Un error en cualquier etapa llega a un solo callback o a una sola promesa rechazada, en vez de necesitar un listener de `error` en cada stream',
      b: 'Cuando cualquier etapa falla o el destino se cierra antes de tiempo, todos los streams de la cadena se destruyen, así que no se filtran descriptores de archivo ni sockets',
      c: 'Es la única forma de obtener backpressure; `.pipe()` ignora que `write()` devuelva `false`',
      d: 'Las etapas pueden ser funciones generadoras asíncronas (una `async function*` que recorre `source` con `for await` y hace `yield` de los chunks transformados)',
    },
    explanation:
      '`.pipe()` **sí** implementa backpressure: pausa el origen cuando `dest.write()` devuelve `false` y lo reanuda con `drain`. Lo que no hace es manejar errores. Los errores no se propagan a lo largo de una cadena de `.pipe()`, así que un evento `error` sin manejar en un stream intermedio hace caer el proceso, y cuando el destino falla, el origen queda abierto (un fd filtrado o un socket upstream colgado).\n\n`pipeline()` conecta los errores y el cierre de cada etapa, invoca el callback una sola vez, y la versión con promesas se combina con `await` y `AbortSignal`. También acepta iterables asíncronos y etapas con generadores asíncronos, que muchas veces son la forma más clara de escribir un transform.',
    hint: 'Compara qué hace cada enfoque cuando una etapa intermedia emite `error` o el destino se cierra antes de tiempo, y qué tipos de etapas acepta `pipeline`; evalúa por separado lo que se dice de la backpressure.',
  },
  'nodejs-backpressure-write-bursts': {
    prompt: `Simula un productor que respeta el backpressure de un stream Writable.

Reglas (las mismas del \`Writable\` de Node):
- Cada \`write(chunk)\` agrega \`chunk\` bytes al buffer interno y devuelve \`buffered < highWaterMark\` (se evalúa **después** de agregar).
- Cuando \`write\` devuelve \`false\`, el productor se detiene y espera \`'drain'\`, que se dispara cuando el buffer queda vacío (buffered vuelve a \`0\`).

Implementa \`solution(sizes, highWaterMark)\` para que devuelva las **ráfagas** de escrituras: cada ráfaga es la lista de tamaños de chunk escritos entre esperas de \`'drain'\`. Devuelve \`[]\` si no hay chunks.

Ejemplo: \`sizes = [4, 4, 4, 4, 4]\`, \`highWaterMark = 10\` devuelve \`[[4, 4, 4], [4, 4]]\`.`,
    explanation:
      'Que `write()` devuelva `false` es **solo un aviso**: el chunk se aceptó (incluso un chunk más grande que `highWaterMark`), pero se le indica al productor que se detenga. Si ignora la señal y sigue escribiendo, el Writable acumula en su buffer sin límite y la memoria crece hasta que el proceso muere por OOM. Ese es el bug clásico cuando alguien escribe `for (const row of rows) out.write(row)` sobre un conjunto de datos grande.\n\nFíjate en el `>=`: alcanzar la marca exacta ya devuelve `false`. En código real, haz `await once(stream, \'drain\')` cuando `write` devuelva `false`, o deja que `pipeline()` / la iteración asíncrona lo haga por ti.',
    hint: 'Lleva un total acumulado del buffer y compáralo con `highWaterMark` después de cada write; un chequeo fallido cierra la ráfaga y `\'drain\'` vacía el buffer.',
  },
  'nodejs-large-upload-pipeline-design': {
    prompt:
      'Un endpoint debe aceptar la carga de un CSV de varios GB, validar y transformar cada fila e insertar las filas en Postgres. El contenedor tiene 512 MB de RAM. ¿Cómo lo diseñas para que la memoria se mantenga acotada y las fallas se manejen correctamente?',
    modelAnswer:
      'Nunca guardo el body completo en un buffer: nada de concatenar con `req.on(\'data\')` ni de almacenamiento multipart en memoria. Armo `await pipeline(req, csvParser(), validateTransform, batcher(500), dbWriter)` con etapas en object mode. El writer de la BD es un Writable (o una etapa con un generador asíncrono) que solo invoca su callback cuando se resuelve el `INSERT` / `COPY` del lote, así que una base de datos lenta llena los buffers pequeños, `write()` devuelve `false`, el parser se pausa, el socket de la petición deja de leerse y el control de flujo de TCP frena al cliente. Esa cadena es **backpressure** de punta a punta, y mantiene la memoria en aproximadamente `highWaterMark × stages` en lugar del tamaño del archivo. `pipeline` destruye cada etapa ante un error o una desconexión del cliente, así que paso un `AbortSignal` y hago rollback o marco la importación como fallida. Las filas inválidas van a un reporte de rechazos en lugar de hacer fallar todo el archivo. Para la idempotencia, cargo los datos en una tabla de staging identificada por un id de carga y al final hago el swap o el merge, así un reintento de la carga no duplica filas. Si la importación tarda minutos, envío la carga como stream a object storage, devuelvo `202` con un id de job y un endpoint de estado (`GET /imports/{id}`), y dejo que un worker de cola ejecute el mismo pipeline.',
    rubric: [
      'Procesa la petición como stream con `pipeline()` y rechaza explícitamente guardar todo el body en un buffer',
      'Explica el backpressure de punta a punta: BD lenta, `write()` devuelve false, el parser se pausa, el socket y el control de flujo de TCP',
      'Agrupa los inserts en lotes (insert de varias filas o `COPY`) en lugar de una consulta por fila',
      'Cubre el manejo de fallas: cierre del pipeline, aborto del cliente, importación parcial (tabla de staging o transacción), reporte de filas inválidas',
      'Considera mover las importaciones largas a object storage más un job asíncrono con un endpoint de estado',
    ],
    explanation:
      'La señal de seniority es conectar un consumidor lento con un productor pausado a través de los límites entre procesos, y luego diseñar para fallas parciales.\n\n**Dilo en voz alta:** "La memoria está acotada por los buffers de los streams, no por el tamaño del archivo, porque el backpressure se propaga desde la base de datos hasta la ventana TCP del cliente; pipeline garantiza que, si cualquier etapa falla, todo se desmonta."',
    hint: 'Cubre cómo fluye la backpressure desde la base de datos hasta el socket del cliente, los inserts por lotes (p. ej. `COPY`) y qué pasa con las filas ya escritas cuando una falla.',
  },

  // worker-threads-and-cpu-work
  'nodejs-what-blocks-event-loop': {
    prompt:
      'Cada vez que se llama a una ruta de tu API en Express, la latencia se dispara en **todas** las rutas de esa instancia. ¿Cuáles de estas operaciones, dentro de esa ruta, bloquean el event loop? Selecciona todas las que apliquen.',
    options: {
      b: '`JSON.parse` de un string de 150 MB',
      c: '```js\nawait fetch(\'https://slow-partner.example.com/report\')\n```\n(el partner tarda 4 segundos en responder)',
    },
    explanation:
      'Cualquier cosa que mantenga ocupado el único hilo de JavaScript bloquea **todas** las peticiones: la criptografía síncrona, el I/O de archivos síncrono y las llamadas enormes a `JSON.parse` / `JSON.stringify` (también las regex catastróficas y los ordenamientos grandes). Un `await fetch` lento solo hace lenta **esa** petición; mientras espera, el hilo queda libre para atender a las demás.\n\nSoluciones: usa las variantes asíncronas (`crypto.pbkdf2`, `fs.promises`), parsea los payloads grandes con streaming y mueve a un worker thread el trabajo de CPU que no puedas evitar. Detéctalo con `perf_hooks.monitorEventLoopDelay()` o con un perfil de CPU (`--cpu-prof`).',
    hint: 'Para cada llamada, pregúntate si mantiene ocupado el único hilo de JavaScript o si solo deja una petición esperando mientras el hilo atiende a las demás.',
  },
  'nodejs-cluster-vs-worker-threads': {
    prompt:
      'Tu servicio Node corre en una VM de 8 vCPU y tiene dos problemas: (1) bajo carga, el throughput se estanca con un núcleo al 100% mientras los demás están ociosos, en endpoints JSON comunes limitados por I/O; (2) un endpoint que redimensiona imágenes bloquea el event loop unos 300 ms por petición. ¿Qué herramienta usas para cada uno (`cluster`, `worker_threads`, más instancias) y por qué?',
    modelAnswer:
      'Son problemas distintos. El problema 1 consiste en usar más núcleos para tráfico limitado por I/O, así que ejecuto más **procesos**: uno por núcleo con `node:cluster` o PM2 o, preferiblemente en contenedores, más réplicas detrás del balanceador de carga. La app debe ser stateless (sesiones y cachés en Redis) porque los procesos no comparten memoria, y una caída en un proceso no tumba a los demás. El problema 2 es trabajo de CPU en la ruta de la petición, y más procesos no lo resuelven: cualquier petición que llegue a un proceso ocupado redimensionando igual espera 300 ms. Para eso uso un **pool de worker_threads** (por ejemplo, Piscina) dimensionado según el número de núcleos, con una cola acotada que devuelve 503 o descarta carga cuando se llena. Paso los datos de la imagen con un `transferList` para que el ArrayBuffer se mueva y no se copie. Los worker threads no ayudan con el trabajo limitado por I/O, porque libuv ya lo hace de forma concurrente. Si el redimensionamiento no necesita ser síncrono, lo enviaría a una cola de jobs y a un servicio worker separado. Los hilos comparten un mismo proceso, así que una caída nativa o un error de falta de memoria los tumba a todos; configuro `resourceLimits` en los workers.',
    rubric: [
      'Separa el escalado horizontal de procesos (cluster, PM2, réplicas) para el throughput de I/O de los worker threads para el trabajo de CPU',
      'Explica por qué cluster por sí solo no arregla un handler bloqueante y por qué los worker threads no aceleran el I/O',
      'Usa un pool de workers acotado con cola o descarte de carga, no un Worker nuevo por petición',
      'Menciona transfer o SharedArrayBuffer frente a la copia por structured clone para payloads grandes',
      'Aborda el diseño stateless y el aislamiento de fallas (proceso frente a hilo)',
    ],
    explanation:
      'Un `Worker` nuevo cuesta decenas de milisegundos y su propio isolate de V8, así que crear workers por petición es un antipatrón; los pools amortizan ese costo.\n\n**Dilo en voz alta:** "Los procesos escalan el I/O entre núcleos y me dan aislamiento; los hilos sacan el trabajo de CPU del event loop. Elijo según el cuello de botella, y acoto el pool para que la sobrecarga se convierta en 503 rápidos en lugar de en una cola que no para de crecer."',
    hint: 'Diagnostica cada cuello de botella por separado: uno trata de usar más núcleos para trabajo de I/O, el otro de sacar el trabajo de CPU del event loop. Menciona los pools y el costo de arranque.',
  },

  // execution-models
  'nodejs-serverless-db-connection-scope': {
    prompt:
      'En una función de AWS Lambda escrita en Node.js que consulta Postgres, ¿dónde deberías crear el cliente de base de datos y por qué?',
    options: {
      a: 'Dentro del handler, para que cada invocación obtenga una conexión nueva y no se filtre estado entre peticiones',
      b: 'En el scope del módulo, para que las invocaciones en caliente en el mismo entorno de ejecución lo reutilicen; limítalo a una conexión por entorno y pon delante un pooler como RDS Proxy',
      c: 'En el scope del módulo como un pool de 20 conexiones, para que una invocación pueda ejecutar muchas consultas en paralelo',
      d: 'En el scope del módulo, más una consulta keep-alive con `setInterval` para que la conexión nunca quede inactiva entre invocaciones',
    },
    explanation:
      'El scope del módulo se ejecuta una vez por **entorno de ejecución** (en el cold start), y el entorno se reutiliza en las invocaciones siguientes, así que un cliente creado ahí sobrevive a los warm starts. Pero cada entorno atiende **una invocación a la vez**, y la concurrencia escala agregando entornos, así que 500 invocaciones concurrentes significan 500 entornos. Un pool de 20 en cada uno serían 10,000 conexiones y agotaría Postgres. Por eso, una conexión por entorno y un pooler delante.\n\nCrearlo en el handler paga el handshake de TCP y TLS en cada llamada. Un `setInterval` no ayuda: el entorno queda **congelado** entre invocaciones, así que el timer no se dispara mientras el entorno está inactivo, y la base de datos o un NAT igual pueden cortar la conexión inactiva; mejor reconecta ante un error.',
    hint: 'Recuerda el ciclo de vida de un entorno de ejecución de Lambda, y cuenta las conexiones a la base de datos que abre tu elección con la concurrencia máxima.',
  },
  'nodejs-execution-model-choice': {
    prompt:
      'Node puede ejecutarse como un **daemon** de larga duración (worker o consumidor), una **función serverless**, un **servicio de API HTTP** o un **script** o CLI de una sola ejecución. Elige un modelo para cada carga de trabajo y justifícalo: (a) ingesta de webhooks de un proveedor de pagos con tráfico con picos muy marcados; (b) un consumidor que procesa una cola 24/7 y mantiene una conexión persistente con el broker; (c) un job nocturno de conciliación de 40 minutos; (d) una API REST de cara al cliente con un objetivo de p99 menor a 100 ms.',
    modelAnswer:
      '(a) Una **función serverless** encaja con trabajo con picos, corto y sin estado: escala a cero y absorbe ráfagas, y un handler de webhooks solo debería verificar la firma, persistir o encolar el evento con una clave de idempotencia y devolver 2xx rápido. (b) Un **daemon**: las conexiones de larga duración, el prefetch y el estado del consumidor no encajan con la facturación por invocación ni con los límites de tiempo de ejecución. Necesita manejar SIGTERM para dejar de tomar mensajes, terminar o hacer nack de los que están en curso y luego salir. (c) Un **script** ejecutado por un scheduler (Kubernetes CronJob, tarea programada de ECS). 40 minutos está cerca o por encima de los límites típicos de las funciones (Lambda tiene un tope de 15 minutos), y un script da un código de salida claro para las alertas; debería guardar checkpoints para que una nueva ejecución se reanude de forma segura. (d) Un **servicio de API** de larga duración detrás de un balanceador de carga: los procesos en caliente con pools de conexiones y cachés en memoria cumplen un p99 exigente sin cold starts. Serverless es posible con provisioned concurrency, a un costo mayor. En los cuatro casos evaluaría el modelo de costos (inactividad frente a pago por petición), los cold starts, los límites de tiempo, el manejo de conexiones y cómo se apaga cada uno.',
    rubric: [
      'Elige serverless para el webhook con picos y enfatiza la confirmación rápida más la idempotencia',
      'Elige un daemon para el consumidor persistente y menciona la detención ordenada o la semántica de ack',
      'Elige un script o job programado para el batch largo, citando los límites de tiempo de las funciones y los códigos de salida',
      'Elige un servicio de larga duración para la API de baja latencia, citando los cold starts y los pools de conexiones en caliente',
      'Nombra los trade-offs transversales: costo en inactividad, cold start, límites de tiempo, cantidad de conexiones',
    ],
    explanation:
      'Los entrevistadores quieren que la decisión la guíe la forma de la carga de trabajo (duración, patrón de tráfico, estado, presupuesto de latencia), no la preferencia personal.\n\n**Dilo en voz alta:** "Serverless para trabajo corto, en ráfagas y sin estado; procesos de larga duración cuando necesito conexiones en caliente, consumidores persistentes o latencia ajustada; scripts programados para jobs batch acotados, con un código de salida sobre el que pueda alertar."',
    hint: 'Decide cada caso por la forma de la carga: duración, patrón de tráfico, estado y presupuesto de latencia, y nombra los límites (timeouts, cold starts) que descartan opciones.',
  },
  'nodejs-graceful-shutdown-kubernetes': {
    prompt:
      'Cada rolling deploy de tu API Node en Kubernetes produce una ráfaga de 502 y algunos jobs de cola procesados a medias. Explica paso a paso cómo implementas un graceful shutdown.',
    modelAnswer:
      'Primero, me aseguro de que la señal llegue: ejecuto `node` directamente (`CMD` en forma exec, o `tini` / `--init`) en lugar de hacerlo bajo `npm start`, que puede no reenviar SIGTERM. Además, como PID 1, Node no tiene manejo de señales por defecto, así que sin un handler ignora SIGTERM hasta que llega el SIGKILL. Al recibir SIGTERM pongo la readiness en fallo y, opcionalmente, espero unos segundos (o uso un sleep en `preStop`) para que los endpoints dejen de enrutar al pod. Luego `server.close()` deja de aceptar conexiones, y `closeIdleConnections()` o `Connection: close` se encargan de los sockets keep-alive que de otro modo lo mantendrían abierto. Dejo que las peticiones en curso terminen bajo un deadline estricto más corto que `terminationGracePeriodSeconds`. Para los consumidores de cola dejo de tomar mensajes nuevos, termino o hago nack de los que están en curso (los jobs deben ser idempotentes porque algunos se volverán a entregar), luego cierro los pools de la BD y las conexiones al broker, hago flush de logs y telemetría y salgo con código 0. Aparte, ante `uncaughtException` o `unhandledRejection` registro el error y salgo con un código distinto de cero en lugar de seguir en un estado desconocido; el orquestador reinicia el pod.',
    rubric: [
      'Asegura que SIGTERM llegue a Node (comportamiento como PID 1, npm que no reenvía señales, forma exec o init)',
      'Pone la readiness en fallo y da tiempo para que se retire el endpoint antes de cerrar el servidor',
      'Deja de aceptar conexiones, maneja las conexiones keep-alive y drena el trabajo en curso bajo un deadline',
      'Detiene los consumidores de forma limpia teniendo en cuenta la reentrega idempotente, y luego cierra los pools y hace flush de la telemetría',
      'Trata los errores no capturados con fail-fast y deja que el orquestador reinicie',
    ],
    explanation:
      'Los 502 suelen venir de que el balanceador de carga sigue enrutando a un pod que ya dejó de escuchar, o de conexiones keep-alive cortadas a mitad de una petición. Ambos son problemas de orden.\n\n**Dilo en voz alta:** "Primero dejo de recibir tráfico, luego dejo de aceptar, luego dreno con un deadline, luego libero recursos, y hago que cada pieza de trabajo sea idempotente porque parte de ella se va a reintentar."',
    hint: 'Piensa en el orden: `SIGTERM`, readiness, el load balancer poniéndose al día, conexiones keep-alive, peticiones y jobs en curso, un plazo de drenado y `terminationGracePeriodSeconds`.',
  },

  // request-batching
  'nodejs-request-batcher-coalesce': {
    prompt: `Varias peticiones llegan en el mismo tick y cada una pide una lista de ids de usuario. En lugar de hacer una llamada downstream por petición, un batcher (como DataLoader) las junta y llama a un endpoint masivo que acepta como máximo \`batchSize\` ids.

Implementa \`solution(ids, batchSize)\`, donde \`ids[i]\` es la lista de ids que pide la petición \`i\`. Devuelve los lotes downstream:
- cada id aparece **una sola vez** en total (sin duplicados entre peticiones ni dentro de una misma petición),
- los ids conservan el **orden de primera aparición** (orden de las peticiones y luego posición),
- los lotes tienen como máximo \`batchSize\` ids; solo el último puede ser más pequeño.

Ejemplo: \`solution([[1, 2], [2, 3], [4]], 2)\` devuelve \`[[1, 2], [3, 4]]\`.`,
    explanation:
      'Un `Set` conserva el orden de inserción, así que `[...new Set(ids.flat())]` elimina duplicados y mantiene el orden de primera aparición; después se divide en chunks de tamaño fijo.\n\nEn el batcher real, la ventana de recolección es **un tick**: el primer `load(id)` programa un flush con `queueMicrotask` / `process.nextTick` (DataLoader) o con un `setTimeout` corto para una ventana más amplia, cada `load` intermedio agrega su id y recibe una promesa, y el flush reparte la respuesta masiva por id. Eso convierte un patrón N+1 (una consulta por campo de GraphQL o por elemento) en `ceil(unique / batchSize)` llamadas. El trade-off es una pequeña latencia adicional, y un lote fallido hace fallar a todos los que llamaron dentro de él.',
    hint: 'Dos pasos: quita los ids repetidos sin perder el orden en que aparecieron y luego divide lo que queda en grupos de como máximo `batchSize`.',
  },
  'nodejs-retry-backoff-schedule': {
    prompt: `Un endpoint masivo downstream a veces responde \`429\` o \`503\`. Calcula los tiempos de espera de los reintentos usando **backoff exponencial con tope y full jitter**.

\`solution(retries, baseMs, capMs, randoms)\` devuelve un arreglo de \`retries\` esperas. Para el reintento \`i\` (base 0):
- \`ceiling = min(capMs, baseMs * 2^i)\`
- \`delay = Math.floor(randoms[i] * ceiling)\`, donde \`randoms[i]\` está en \`[0, 1)\` (se inyecta para que el resultado sea determinista).

Ejemplo: \`solution(3, 100, 1000, [0.5, 0.5, 0.5])\` devuelve \`[50, 100, 200]\`.`,
    explanation:
      'El crecimiento exponencial le da margen a una dependencia con problemas para recuperarse; el **tope** evita que la espera crezca sin límite; el **jitter** dispersa a los clientes que fallaron en el mismo momento para que no reintenten todos juntos (una estampida, o thundering herd). El full jitter (un valor aleatorio entre 0 y el techo) es el que mejor reparte la carga, a costa de algunas esperas muy cortas.\n\nReintenta solo operaciones **idempotentes** (o envía una clave de idempotencia), respeta `Retry-After` cuando el servidor lo envía, pon un timeout en cada intento (`AbortSignal.timeout`) y coloca un circuit breaker delante para que una dependencia caída falle rápido en lugar de reintentar para siempre.',
    hint: 'Recorre el índice de reintento y cuida dos detalles: la potencia en JavaScript (`**`) y usar el valor aleatorio del mismo índice que el reintento.',
  },
  'nodejs-inflight-dedupe-cache-fix': {
    prompt: `\`createCachedLoader\` debería **unificar** (coalesce) las peticiones concurrentes: todo el que pida el mismo id mientras hay un fetch en curso debe compartir ese único fetch, y quienes llamen después obtienen el resultado en caché. En producción, una ráfaga de peticiones concurrentes para el mismo usuario igual llega al upstream una vez por petición.

Corrige **solo \`createCachedLoader\`** para que:
1. las llamadas concurrentes para el mismo id disparen exactamente una llamada a \`fetcher\`;
2. un fetch **fallido** no quede en caché: la siguiente llamada para ese id lo reintenta.

El harness \`solution\` ejecuta dos oleadas de cargas concurrentes y reporta los resultados y el total de llamadas al upstream. No lo modifiques.`,
    explanation:
      'La versión con el bug guarda en caché el **valor**, que solo existe después del `await`. Todo el que llega mientras el primer fetch está en curso ve la caché vacía e inicia su propio fetch: una estampida de caché (cache stampede). Guardar en caché la **promesa** de forma síncrona, antes de cualquier `await`, hace que quienes llegan después se sumen a la petición en curso.\n\nLa segunda mitad es la que la gente pasa por alto: una vez que guardas promesas en caché, una promesa rechazada también queda en caché, y todas las llamadas futuras reciben el mismo error. Elimínala cuando se rechace (un `.catch` que la borra y vuelve a lanzar el error) para que la siguiente llamada reintente. En producción, agrega un TTL o un límite LRU para que el map no crezca para siempre, y en una flota de varias instancias mueve la unificación a una caché compartida con un lock o a un proxy que colapse las peticiones.\n\n**Dilo en voz alta:** "Guardo en caché la promesa, no el valor, para que las llamadas concurrentes se unifiquen en una sola petición en curso, y la elimino si se rechaza para que una falla transitoria no quede en caché para siempre."',
    hint: 'Pregúntate qué guarda el caché mientras el primer fetch sigue pendiente, qué podrías guardar de forma síncrona antes de cualquier `await` y qué debe pasarle si falla.',
  },
};
