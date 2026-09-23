// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  'operations-production-debugging-stack-trace': {
    prompt:
      'Una alerta de producción enlaza a este error:\n\n```text\nTypeError: Cannot read properties of undefined (reading \'email\')\n    at formatRecipient (/app/dist/notify.js:42:19)\n    at sendReceipt (/app/dist/notify.js:18:10)\n    at OrderService.complete (/app/dist/orders/service.js:77:5)\n    at async /app/dist/routes/orders.js:31:3\n```\n\n¿Cuál es la lectura más precisa?',
    options: {
      a: 'El bug está en `routes/orders.js:31`, porque ahí empezó la solicitud',
      b: '`formatRecipient` lanzó el error porque algo de lo que lee `.email` es `undefined`; el frame superior es donde falló, pero el valor incorrecto probablemente vino de un llamador, así que lee los frames hacia abajo (y mapea las líneas de `dist` al código fuente con source maps)',
      c: 'Falta la columna `email` en la base de datos',
      d: 'El error está dentro de los internos de Node.js, ya que las rutas apuntan a `dist`',
    },
    explanation:
      'Un stack trace se lee de arriba hacia abajo, desde el **punto donde se lanzó el error** hasta el **punto de entrada**. El mensaje dice que un objeto era `undefined` cuando se leyó `.email`, no que faltara `email` (eso daría `undefined`, no un `TypeError`). El frame superior te dice dónde falló; la causa raíz suele estar unos frames más abajo, donde `sendReceipt` u `OrderService.complete` pasaron un cliente inexistente. Las rutas bajo `dist` son salida compilada: habilita los source maps (`node --enable-source-maps`, o súbelos a tu error tracker) para que los números de línea apunten a tu TypeScript. El frame `async` muestra que el trace sobrevivió a un `await` gracias a los async stack traces de V8.',
  },
  'operations-production-debugging-correlation-ids': {
    prompt:
      'Las líneas de log de varios servicios se envían a un mismo almacén y llegan **desordenadas**. Cada línea lleva el `correlationId` que el gateway asignó a la solicitud entrante.\n\nImplementa `solution(logs, correlationId)` para que devuelva:\n\n- `path`: los servicios que manejaron esa solicitud, en orden de timestamp, colapsando los duplicados **consecutivos** (`orders, orders` se convierte en `orders`, pero `orders, payments, orders` se mantiene);\n- `firstError`: `"<service>: <msg>"` para la línea de nivel `error` más temprana de esa solicitud, o `null`.',
    explanation:
      'El correlation id es lo único que une las líneas de distintos servicios a una misma solicitud de usuario, así que se debe generar (o aceptar desde `X-Request-Id` / `traceparent`) en el borde, propagar en cada llamada y mensaje saliente, y adjuntar a cada línea de log (en Node, normalmente mediante `AsyncLocalStorage`, para no tener que pasarlo por cada función). Fíjate en que el primer error está en **payments**, mientras que el error que la mayoría vería primero es el de `orders` o el `502` del gateway: ordenar por tiempo y leer el error más temprano es como encuentras la causa raíz en lugar del síntoma más ruidoso. El desfase de reloj entre hosts hace que los timestamps sean aproximados; el tracing real (spans de OpenTelemetry con ids de padre) resuelve el orden por causalidad.',
  },
  'operations-production-debugging-rollback-vs-flag': {
    prompt:
      'Veinte minutos después de un deploy, la tasa de errores del checkout salta de 0.2% a 8%. El release incluía un nuevo motor de precios (detrás de un feature flag), una actualización de dependencia y una migración de base de datos que agregó una columna. Tú eres el senior de guardia (on-call). **Explícame los primeros 30 minutos.**',
    modelAnswer:
      'Primero mitigar, después diagnosticar: los clientes no están pudiendo pagar ahora mismo. Declaro un incidente, asumo el rol de incident commander o de operaciones y publico en el canal del incidente para que soporte y los stakeholders estén al tanto. La palanca más barata y rápida es el feature flag: apago el nuevo motor de precios y observo la gráfica de la tasa de errores, porque los flags desacoplan el deploy del release y actúan en segundos. Si los errores persisten, la causa probablemente es la actualización de dependencia, así que hago rollback al build anterior; eso es seguro aquí porque la migración solo **agregó** una columna nullable (expand/contract), así que el código viejo sigue funcionando con el esquema nuevo. Una migración destructiva haría inseguro el rollback, y por eso escribimos migraciones compatibles hacia atrás. Mientras mitigo, tomo algunas solicitudes fallidas por correlation id, leo sus traces y stack traces, y comparo los dashboards antes y después del marcador del deploy. Una vez que la tasa de errores vuelve a la línea base, dejo el flag apagado, preservo los logs y agendo un postmortem sin culpables con la línea de tiempo, la causa raíz y acciones de seguimiento, como un despliegue canary o un rollback automático cuando el error budget del SLO de tasa de errores se consume demasiado rápido.',
    rubric: [
      'Prioriza la mitigación (apagar el flag, rollback) por encima del análisis de causa raíz mientras los usuarios están afectados',
      'Usa el feature flag como la primera palanca, la más rápida, y explica la diferencia entre deploy y release',
      'Verifica que el rollback sea seguro frente a la migración (compatible hacia atrás, expand/contract)',
      'Usa correlation ids, traces y el marcador del deploy en los dashboards para confirmar la causa',
      'Comunica durante el incidente y da seguimiento con un postmortem sin culpables y medidas de prevención (canary, rollback automático)',
    ],
    explanation:
      'Los entrevistadores buscan el orden: detener la hemorragia, luego encontrar la causa y luego evitar que se repita. El detalle de la migración evalúa si sabes que los rollbacks no siempre son gratis.\n\n**Dilo en voz alta:** "Primero mitigo: apago el flag y, si hace falta, hago rollback, después de comprobar que la migración es compatible hacia atrás. Solo cuando los clientes están a salvo me meto en los traces por correlation id, y después hacemos un postmortem sin culpables."',
  },
  'operations-logging-structured-and-levels': {
    prompt: '¿Cuáles de estas son buenas prácticas de logging para una API de Node.js en producción? Selecciona todas las que apliquen.',
    options: {
      a: 'Emitir logs en JSON con nombres de campo estables como `requestId`, `userId`, `route`, `durationMs`',
      b: 'Registrar el cuerpo completo y los headers de cada solicitud para que depurar sea más fácil',
      c: 'Reservar `error` para fallas sobre las que alguien debe actuar, `warn` para casos degradados pero manejados, `info` para eventos de negocio clave, y mantener `debug` apagado en producción por defecto',
      d: 'Registrar cada `404` y cada falla de validación con nivel `error`',
      e: 'Construir los mensajes por interpolación, como `"User 42 failed login from 10.0.0.1"`, en lugar de usar campos separados',
    },
    explanation:
      'Los logs estructurados (pino, winston con un formatter JSON) se pueden consultar: `route="/checkout" AND durationMs > 1000` es un filtro, mientras que las cadenas interpoladas necesitan regex frágiles. Los cuerpos y headers completos filtran contraseñas, tokens de `Authorization` y datos personales hacia un sistema con controles de acceso más débiles y retención larga; enmascara esos datos por defecto. Los niveles son un contrato con quien lee los logs y con lo que dispara alertas a partir de ellos: que un cliente envíe una solicitud incorrecta es comportamiento esperado (`info` o `warn`), y registrarlo como `error` entierra las fallas reales.',
  },
  'operations-logging-red-vs-use': {
    prompt: 'Estás armando un dashboard para el **pool de conexiones de Postgres** que usa tu API (no para los endpoints de la API en sí). ¿Qué método encaja y qué graficas?',
    options: {
      a: 'RED: solicitudes por segundo, tasa de errores y duración de las consultas del pool',
      b: 'USE: utilización (conexiones en uso / máximo del pool), saturación (solicitudes esperando una conexión y su tiempo de espera), errores (timeouts al adquirir una conexión, fallas de conexión)',
      c: 'Solo la CPU y la memoria del host de la base de datos, ya que el pool es solo una biblioteca',
      d: 'El volumen de logs por minuto, porque más logs significa más carga',
    },
    explanation:
      '**RED** (Rate, Errors, Duration, de Tom Wilkie) describe los **servicios orientados a solicitudes** desde el punto de vista de quien llama: es lo que graficas para los endpoints de la API. **USE** (Utilization, Saturation, Errors, de Brendan Gregg) describe **recursos**: CPUs, discos, pools de hilos, pools de conexiones, colas. La saturación es la métrica que los equipos olvidan y la que explica la latencia: un pool al 100% de utilización con 50 solicitudes en espera se ve como solicitudes lentas en RED mientras la CPU se ve bien. Los dos se complementan: RED te dice *que* los usuarios están sufriendo, USE te dice *qué recurso* es el cuello de botella.',
  },
  'operations-logging-alert-fatigue': {
    prompt:
      'El pager de guardia suena unas 40 veces por semana, la mayoría de las alertas se resuelven solas en minutos y los ingenieros empezaron a ignorarlo. ¿Qué cambios reducen la fatiga de alertas **sin** perder incidentes reales? Selecciona todas las que apliquen.',
    options: {
      a: 'Hacer page por síntomas visibles para el usuario (burn rate del SLO sobre errores y latencia) y bajar las alertas basadas en causas, como "CPU > 80%", a dashboards o tickets',
      b: 'Exigir que cada alerta que hace page sea accionable y esté vinculada a un runbook; eliminar o bajar de nivel las alertas sobre las que nadie actuó en el último mes',
      c: 'Agregar una duración (`for: 5m`) o condiciones de burn rate de múltiples ventanas para que los picos breves no hagan page',
      d: 'Silenciar las alertas más ruidosas por el resto del trimestre',
      e: 'Enviar las alertas no urgentes a una cola de tickets que se revisa en horario laboral, en lugar de al pager',
    },
    explanation:
      'Un page debería significar "una persona tiene que actuar ya para proteger a los usuarios". Las alertas basadas en síntomas sobre los SLO atrapan todas las causas que afectan a los usuarios, incluidas las que nadie previó, mientras que los umbrales basados en causas se disparan cuando no pasa nada malo (CPU al 85% durante un job batch sano). Las duraciones y los burn rates de múltiples ventanas filtran las alertas intermitentes. Los runbooks y una revisión periódica de las alertas mantienen el conjunto honesto. Silenciar sin un reemplazo solo esconde la señal, y así es como se pasan por alto incidentes reales.\n\n**Dilo en voz alta:** "Hago page por síntomas, no por causas: alertas de burn rate del SLO sobre errores y latencia, cada una accionable y con un runbook, y todo lo demás va a un ticket o a un dashboard."',
  },
  'operations-performance-percentiles': {
    prompt:
      'Implementa `solution(samples)`, que recibe latencias de solicitudes en milisegundos (sin ordenar) y devuelve `{ p50, p95, p99 }` usando el método de **rango más cercano** (nearest-rank): ordena de forma ascendente y el percentil p es el valor en el rango `ceil(p / 100 * n)`, contando desde 1. Para un array vacío, devuelve `null` en los tres. No mutes la entrada.',
    explanation:
      'Dos trampas: `Array.prototype.sort()` sin comparador ordena **como cadenas** (`[100, 20, 3, 9]` queda en ese orden), y ordenar in place muta el array de quien llama, así que primero haz una copia. Calcular `(p * n) / 100` en lugar de `(p / 100) * n` mantiene la aritmética en enteros y evita sorpresas de punto flotante justo en el límite de un rango.\n\nPor qué percentiles: la media del test con el valor atípico es de unos 60 ms, lo que no describe ninguna solicitud real. p50 es el usuario típico; p99 es la cola que alcanza una de cada cien solicitudes (y una página que hace 20 llamadas a la API la alcanza con mucha más frecuencia). Fíjate en que el p95 de 20 muestras todavía esconde el valor atípico: los percentiles de cola necesitan suficientes muestras. En producción no puedes promediar percentiles entre hosts; agregas **histogramas** (buckets de Prometheus, histogramas HDR) y calculas los percentiles a partir de la distribución combinada.',
  },
  'operations-performance-slow-page-approach': {
    prompt:
      'El equipo de producto dice que la página de detalle de producto "se siente lenta". Los datos de campo muestran un LCP de 4.5 s en móvil, un INP de 450 ms y la API de producto con un p95 de 1.2 s. **¿Cómo lo abordas y qué palancas esperas mover?**',
    modelAnswer:
      'Empiezo midiendo, no adivinando: los datos de usuarios reales (CrUX o nuestro RUM) me dicen qué métrica falla y para qué usuarios, y luego perfilo, con el panel Performance de Chrome y Lighthouse para el frontend, y con traces de APM o un perfil de CPU (flame graph) para la API, para encontrar a dónde se va realmente el tiempo. Para el LCP identifico el elemento LCP y lo desgloso en TTFB, retraso de carga del recurso, tiempo de carga y retraso de renderizado: una API lenta infla el TTFB si renderizamos en el servidor, y una imagen principal que se descubre tarde necesita `preload` o `fetchpriority="high"`, nunca `loading="lazy"`, además de formatos modernos y tamaños responsivos desde un CDN. Para el INP busco tareas largas en el hilo principal: dividir o diferir trabajo, aplicar debounce a los manejadores de entrada, virtualizar listas largas y sacar los cálculos pesados del hilo principal. Para la API reviso el trace en busca de consultas N+1 e índices faltantes antes de agregar caché; después cacheo en capas: `Cache-Control`/`ETag` de HTTP para el navegador, el edge del CDN para las respuestas públicas y una caché de aplicación como Redis, con un TTL y un plan de invalidación, para las lecturas costosas. También reviso el tamaño del bundle y divido el código por rutas para que haya menos JavaScript compitiendo con el renderizado. Cada cambio se verifica contra las mismas métricas de campo, porque una mejora de laboratorio que los usuarios no ven no es una mejora.',
    rubric: [
      'Mide primero: datos de campo más profiling (panel Performance, traces de APM, flame graphs) antes de cambiar código',
      'Relaciona los síntomas con las palancas de Core Web Vitals: LCP (preload, optimización de imágenes, TTFB), INP (tareas largas, debounce, virtualización), y menciona CLS',
      'Corrige las causas raíz en la API (N+1, índices) antes de agregar cachés',
      'Describe las capas de caché (navegador, CDN, caché de aplicación) y señala la invalidación o el TTL como la parte difícil',
      'Verifica el impacto con las mismas métricas de usuarios reales después del cambio',
    ],
    explanation:
      'La señal senior es el orden de las operaciones: medir, encontrar el cuello de botella, corregir la causa, cachear lo que siga siendo costoso y verificar con datos de campo. LCP mide la carga, INP la capacidad de respuesta y CLS la estabilidad visual; cada una tiene palancas distintas, y confundirlas (hacer lazy-loading de la imagen principal, memoizar componentes para arreglar una imagen lenta) es un error clásico de nivel mid.\n\n**Dilo en voz alta:** "Perfilo antes de optimizar. Desgloso el LCP en sus fases, corrijo el verdadero cuello de botella, agrego caché en capas con una estrategia de invalidación clara y demuestro la mejora con métricas de usuarios reales, no con una sola ejecución de Lighthouse."',
  },
};
