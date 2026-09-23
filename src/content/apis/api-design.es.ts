// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  'api-design-offset-drift-predict': {
    prompt:
      'Un feed está ordenado del más nuevo al más viejo. El cliente carga la página 1, llega un post nuevo, y luego el cliente carga la página 2, una vez con paginación por **offset** y otra con un **cursor** (el id del último elemento que vio). ¿Qué imprime esto, una línea por log?',
    explanation:
      'La paginación por offset direcciona las filas **por posición**. La inserción al inicio desplaza todas las filas una posición, así que el offset 2 ahora apunta a `4`, que el usuario ya vio: un **duplicado**. Un borrado haría lo contrario y se **saltaría** una fila.\n\nLa paginación por cursor (keyset) direcciona las filas **por valor**: "dame los elementos después del id 4". Las inserciones y los borrados en otras partes no mueven ese límite, así que la página 2 es exactamente `[3,2]`. En SQL esto es `WHERE id < :after ORDER BY id DESC LIMIT 2`, que un índice resuelve directamente en lugar de recorrer y descartar `OFFSET` filas.',
  },
  'api-design-offset-vs-cursor-tradeoffs': {
    prompt: '¿Qué afirmaciones sobre la paginación por offset frente a la paginación por cursor son verdaderas? Selecciona todas las que apliquen.',
    options: {
      a: 'La paginación por cursor no puede saltar directamente a la "página 37"; los clientes solo pueden avanzar o retroceder desde una posición conocida',
      b: '`OFFSET 100000 LIMIT 20` hace que la base de datos lea y descarte 100 000 filas, así que las páginas profundas se vuelven más lentas',
      c: 'Un cursor necesita una clave de ordenamiento única y estable; ordenar solo por `createdAt` necesita un criterio de desempate como `id`',
      d: 'La paginación por cursor te da un conteo total exacto sin costo adicional',
      e: 'Los cursores deberían ser opacos (p. ej. base64 de los valores de ordenamiento) para que el servidor pueda cambiar su contenido sin romper a los clientes',
    },
    explanation:
      '- **a**: verdadera, y es la razón principal por la que las tablas de administración con números de página siguen usando offsets.\n- **b**: verdadera; el costo crece linealmente con el offset, mientras que la paginación por keyset va directo al punto del índice.\n- **c**: verdadera; si dos filas comparten un `createdAt` en el límite de una página, `createdAt < :last` se salta la segunda. Ordena por `(createdAt, id)` y compara la tupla.\n- **d**: falsa; un total necesita un `COUNT(*)` aparte, que es costoso en tablas grandes. Muchas APIs devuelven `hasMore`/`nextCursor` en lugar de un total.\n- **e**: verdadera; un cursor opaco es un contrato ("devuélveme lo que te di"), no un formato que los clientes puedan construir o parsear.\n\nRegla general: offset para listas de administración pequeñas y estables con números de página; cursor para feeds, scroll infinito, APIs de sincronización y tablas grandes.',
  },
  'api-design-keyset-cursor-page': {
    prompt:
      'Implementa paginación por keyset con un cursor opaco. Las `rows` ya vienen ordenadas por `createdAt DESC, id DESC` (el orden del índice). Ten en cuenta que varias filas comparten el mismo `createdAt`.\n\n`solution(rows, limit, cursor)` devuelve `{ ids, nextCursor }`:\n\n- `cursor` es `null` para la primera página; si no, es `btoa(JSON.stringify({ createdAt, id }))` de la **última fila de la página anterior** (con las keys en ese orden).\n- `ids` son los ids de hasta `limit` filas que vienen estrictamente **después** del cursor en el orden de ordenamiento.\n- `nextCursor` codifica la última fila devuelta de la misma forma, o es `null` cuando no quedan filas después de esta página.',
    explanation:
      'Hay dos trampas. Primero, comparar solo `createdAt < cursor.createdAt` se salta los ids 5 y 4 en la página 2, porque comparten el timestamp del cursor. El límite debe comparar la **tupla de ordenamiento completa**: `(createdAt, id) < (cursorCreatedAt, cursorId)`, que en Postgres es literalmente `WHERE (created_at, id) < ($1, $2) ORDER BY created_at DESC, id DESC LIMIT $3` contra un índice compuesto. Segundo, traer `limit + 1` filas es la forma barata de saber si existe una página siguiente sin un `COUNT(*)`, y evita entregar un cursor que lleva a una página vacía.\n\nEl cursor va en base64 para que los clientes lo traten como **opaco**; en producción además lo firmarías o validarías su forma decodificada, porque es input del usuario.\n\n**Dilo en voz alta:** "Pagino por keyset: el cursor codifica los valores de ordenamiento de la última fila, la consulta salta más allá de esa tupla con un criterio de desempate único, traigo limit más uno para saber si hay una página siguiente, y el cursor se mantiene opaco para poder cambiarlo después."',
  },
  'api-design-breaking-changes': {
    prompt: 'Mantienes `/v1/orders`, que usan clientes de terceros. ¿Qué cambios son **breaking** y necesitarían una nueva versión (o un período de migración)? Selecciona todos los que apliquen.',
    options: {
      a: 'Agregar un campo opcional `giftMessage` a la respuesta',
      b: 'Renombrar `total` a `totalAmount` en la respuesta',
      c: 'Hacer obligatorio el campo `currency` de la petición, que antes era opcional',
      d: 'Cambiar `id` de número a string',
      e: 'Agregar un nuevo endpoint `GET /v1/orders/{id}/refunds`',
    },
    explanation:
      'Un cambio es breaking cuando un cliente que funcionaba ayer falla hoy sin haber cambiado su código.\n\n- Los cambios **aditivos** son seguros: nuevos campos opcionales en la respuesta (**a**) y nuevos endpoints (**e**), *siempre que* los clientes sigan la regla del tolerant reader e ignoren los campos desconocidos.\n- **Eliminar o renombrar** cualquier cosa que un cliente lea (**b**), **endurecer** las reglas de entrada (**c**) y **cambiar tipos** (**d**, que rompe a los clientes tipados y las comparaciones con `===`) son breaking.\n\nLa zona gris: agregar un valor a un enum de la respuesta puede romper a los clientes que hacen un switch exhaustivo sobre él. Documenta los enums como abiertos ("espera valores nuevos") desde el primer día.',
  },
  'api-design-versioning-and-deprecation': {
    prompt: 'Tienes que publicar un cambio breaking en una API pública que usan cientos de clientes externos. ¿Cómo la versionas y cómo retiras la versión anterior?',
    modelAnswer:
      'Primero me esfuerzo por evitar la ruptura: la mayoría de los cambios pueden ser aditivos (campo nuevo, endpoint nuevo), y una nueva versión mayor es un costo que paga cada cliente. Si de verdad es breaking, elijo un esquema de versionado y lo mantengo consistente: una versión mayor en el path (`/v2/orders`) es lo más visible y amigable con el caché; un header o media type (`Accept: application/vnd.acme.v2+json`) mantiene estables las URLs; las versiones basadas en fecha fijadas por cuenta (el modelo de Stripe) permiten que el servidor corra una sola base de código con una cadena de transformadores de petición/respuesta por versión. Internamente evito bifurcar todo el servicio; v1 se convierte en un adaptador que traduce al modelo de dominio de v2. Para el retiro anuncio un cronograma, marco las respuestas con los headers `Deprecation` y `Sunset` y un enlace a la guía de migración, y mido el tráfico de v1 por cliente para contactar directamente a los rezagados. Solo cuando el uso está cerca de cero la apago, a menudo con brownouts primero (cortes breves programados) para que las integraciones olvidadas salgan a la luz antes de la fecha final.',
    rubric: [
      'Intenta primero un cambio aditivo y retrocompatible, y trata una versión mayor como último recurso',
      'Compara versionado por URI vs header/media type vs basado en fecha, con una razón para la elección',
      'Mantiene una sola implementación central con adaptadores/transformadores por versión en lugar de bases de código bifurcadas',
      'Proceso de deprecación: cronograma, headers Deprecation/Sunset, guía de migración, telemetría de uso por cliente',
      'Menciona brownouts o un apagado escalonado antes de eliminar la versión anterior',
    ],
    explanation:
      'Una respuesta senior trata el versionado como un **ciclo de vida**, no como un prefijo de URL. El prefijo es la parte fácil; las partes difíciles son evitar rupturas, mantener una sola implementación y retirar versiones viejas con datos en lugar de con esperanza.\n\n**Dilo en voz alta:** "Evito los cambios breaking evolucionando de forma aditiva; cuando tengo que romper, versiono de forma explícita, mantengo v1 como un adaptador sobre el modelo nuevo, y la retiro con headers Sunset, telemetría de uso por cliente y brownouts antes del corte."',
  },
  'api-design-error-envelope': {
    prompt: 'Una petición falla la validación porque `email` está mal formado y `age` es negativo. ¿Qué respuesta tiene el mejor diseño?',
    options: {
      a: '`200 OK` con `{ "success": false, "message": "Invalid input" }`',
      b: '`400 Bad Request` con el body de texto plano `Invalid input`',
      c: '`422 Unprocessable Content` (o `400`), `Content-Type: application/problem+json`, body `{ "type": "https://api.acme.io/errors/validation", "title": "Invalid request", "status": 422, "errors": [{ "field": "email", "code": "invalid_format" }, { "field": "age", "code": "min", "min": 0 }] }`',
      d: '`500 Internal Server Error` con el stack trace de la librería de validación, para que el cliente pueda depurar',
    },
    explanation:
      'Una buena respuesta de error tiene un **código de estado preciso** (para que funcionen los proxies, los reintentos y el monitoreo), un **envelope consistente y legible por máquinas** (para que cada cliente maneje cada error de la misma forma), **códigos de error estables** sobre los que el cliente pueda ramificar (no mensajes en inglés), y **detalle a nivel de campo** para que un formulario pueda resaltar ambos campos a la vez.\n\nEl RFC 9457 *Problem Details for HTTP APIs* (que reemplazó al RFC 7807) estandariza ese envelope: `type`, `title`, `status`, `detail`, `instance`, más miembros de extensión como `errors`. **a** oculta el fallo a las herramientas HTTP, **b** no es legible por máquinas y **d** es un 5xx para un error del cliente que además filtra detalles internos.',
  },
  'api-design-202-accepted-meaning': {
    prompt: '`POST /reports` inicia un reporte que tarda unos 3 minutos en generarse. El servidor responde `202 Accepted` con `Location: /jobs/abc123`. ¿Qué le dice eso al cliente?',
    options: {
      a: 'El reporte está listo y se puede descargar desde `/jobs/abc123`',
      b: 'La petición fue aceptada para procesarse, el procesamiento no ha terminado (y todavía puede fallar); consulta `/jobs/abc123` para ver su estado',
      c: 'El servidor estaba demasiado ocupado; el cliente debería reintentar el POST más tarde',
      d: 'El reporte fue creado y `/jobs/abc123` es su URL permanente, igual que con `201 Created`',
    },
    explanation:
      '`202 Accepted` es intencionalmente evasivo: el trabajo fue **encolado**, no completado, y todavía puede fallar. El header `Location` apunta a un **recurso de job (de estado)** que el cliente puede consultar periódicamente: informa `pending`/`running`/`failed`/`succeeded` y, si tiene éxito, enlaza (o redirige con `303 See Other`) al reporte terminado.\n\n`201 Created` significa que el recurso ya existe. "Demasiado ocupado, reintenta más tarde" es `503` o `429` con `Retry-After`. Mantener la petición HTTP abierta durante 3 minutos chocaría con los timeouts del load balancer y de API Gateway (las integraciones REST de API Gateway tienen un tope de 29 s por defecto).',
  },
  'api-design-long-running-jobs': {
    prompt:
      'Diseña la API para una operación de larga duración (una tarea de un agente de IA o una exportación grande, de 30 s a 10 min). La app web quiere progreso en vivo, los sistemas de partners quieren recibir una notificación cuando termine, y los clientes en redes móviles inestables reintentan las peticiones. Recorre los endpoints y las opciones de entrega.',
    modelAnswer:
      '`POST /exports` valida el input, encola un job (SQS, BullMQ) y devuelve `202 Accepted` con `Location: /exports/{id}` y el body del job; el POST acepta una `Idempotency-Key` para que un envío reintentado no inicie un segundo job. `GET /exports/{id}` es la fuente de verdad: `status`, `progress`, timestamps, un `error` con forma de problem details si falla, y una `resultUrl` (por ejemplo, un enlace prefirmado de S3) si tiene éxito. El polling es la base que cualquier cliente puede usar; el servidor envía `Retry-After` para marcar el ritmo. Para la app web agrego Server-Sent Events en `GET /exports/{id}/events` para el progreso o los tokens en streaming: SSE es HTTP simple, unidireccional y se reconecta solo con `Last-Event-ID`, que es todo lo que necesita el progreso; WebSockets solo si el cliente también tiene que enviar mensajes a mitad de la tarea. Para los partners ofrezco webhooks: registran una URL, yo hago POST de un payload firmado (HMAC sobre el body más un timestamp) con reintentos y backoff, y el payload lleva un id de evento para que su handler pueda deduplicar, ya que la entrega es at-least-once. Los webhooks son una notificación, no el contrato de datos: los receptores deberían volver a consultar el recurso del job.',
    rubric: [
      '202 Accepted + Location de un recurso de job, con el recurso de job como única fuente de verdad',
      'Idempotency key en el envío para que los reintentos no creen jobs duplicados',
      'Polling con Retry-After como base, SSE para el progreso en vivo (con una razón frente a WebSockets)',
      'Webhooks con firmas, reintentos y entrega at-least-once manejada con deduplicación por id de evento',
      'El trabajo corre en una cola/worker, no dentro de la petición HTTP, por los timeouts del gateway',
    ],
    explanation:
      'Esta es la pregunta de "API agéntica" disfrazada: una llamada larga a un LLM o a un agente es solo un job de larga duración. La forma siempre es la misma: **aceptar rápido, procesar en segundo plano, exponer el estado como un recurso, y enviar notificaciones push como una optimización encima del polling**.\n\n| Canal | Dirección | Ideal para |\n|---|---|---|\n| Polling | el cliente consulta | Cualquier cliente, lo más simple, amigable con el caché |\n| SSE | del servidor al navegador | Progreso, tokens de LLM en streaming |\n| WebSocket | en ambos sentidos | Sesiones interactivas, chat |\n| Webhook | de servidor a servidor | Sistemas de partners, eventos de finalización |\n\n**Dilo en voz alta:** "Devuelvo 202 con un recurso de job que es la fuente de verdad, ejecuto el trabajo en una cola, dejo que los clientes lo consulten con polling, transmito el progreso con SSE y notifico a los partners con webhooks firmados y con reintentos que ellos deduplican por id de evento."',
  },
};
