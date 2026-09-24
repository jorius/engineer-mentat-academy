// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  'distributed-systems-microservices-when-not': {
    prompt:
      'Un equipo de ocho ingenieros que construye un producto nuevo pregunta si debería empezar con microservicios. ¿Qué recomiendas y qué te haría separar un servicio más adelante?',
    modelAnswer:
      'Empezaría con un monolito modular: un solo desplegable con límites internos estrictos entre módulos, alineados con bounded contexts, donde cada módulo es dueño de sus tablas y expone una API interna. Los microservicios cambian llamadas en proceso por llamadas de red, así que pagas con latencia, fallas parciales, transacciones distribuidas, consistencia eventual, contratos versionados y mucha más herramienta operativa (tracing, CI/CD por servicio, guardias), algo que ocho personas construyendo un producto no probado no pueden costear. El modo de falla a evitar es el monolito distribuido: servicios que comparten una base de datos o que deben desplegarse juntos, que tiene todos los costos y ninguno de los beneficios. Separaría un módulo cuando haya un motivo concreto: una parte que debe escalar o desplegarse de forma independiente, un perfil distinto de confiabilidad o de seguridad, o un equipo aparte que queda bloqueado por los releases compartidos. Como el módulo ya es dueño de sus datos y tiene una interfaz explícita, extraerlo es una migración estilo strangler y no una reescritura.',
    rubric: [
      'Recomienda un monolito modular con límites de bounded context para un equipo pequeño y un producto nuevo',
      'Nombra costos concretos: fallas de red, latencia, consistencia de datos, carga operativa',
      'Identifica el monolito distribuido (base de datos compartida, despliegues en bloque) como el antipatrón',
      'Da motivos reales para separar: escalado o despliegues independientes, autonomía de equipos, necesidades distintas de confiabilidad',
      'Menciona la propiedad de los datos por servicio y un camino de extracción incremental (strangler)',
    ],
    explanation:
      'Los microservicios son ante todo una herramienta de escalado organizacional: permiten que equipos independientes desplieguen de forma independiente. Sin esa presión, dominan sus costos.\n\n**Dilo en voz alta:** "Los microservicios resuelven el acoplamiento de equipos y de despliegues a cambio de los problemas de los sistemas distribuidos. Empiezo con un monolito modular con una propiedad de datos clara y extraigo un servicio cuando un límite de escalado, de confiabilidad o de equipo realmente lo exige."',
    hint: 'Cubre qué resuelven realmente los microservicios (independencia de equipos y despliegues), cuánto le cuestan a un equipo chico, el antipatrón a evitar y disparadores concretos para dividir.',
  },
  'distributed-systems-shared-database': {
    prompt:
      'Los servicios `orders` e `invoicing` leen y escriben la misma tabla `orders` en una única base de datos Postgres compartida. ¿Cuál es el principal problema de arquitectura?',
    options: {
      a: 'El esquema de la tabla se convirtió en un contrato compartido: ninguno de los dos servicios puede cambiarlo ni desplegarse de forma independiente sin coordinarse, así que están acoplados como un monolito',
      b: 'Postgres no puede manejar conexiones de dos servicios distintos',
      c: 'Obliga a que ambos servicios estén escritos en el mismo lenguaje',
      d: 'Las lecturas pasan a ser eventualmente consistentes entre los dos servicios',
    },
    explanation:
      'Cada microservicio debería ser dueño de sus datos y exponerlos solo a través de su API o de eventos (base de datos por servicio). Una tabla compartida filtra la estructura interna: renombrar una columna, agregar una restricción o cambiar un índice pasa a ser un release coordinado entre equipos, y un servicio puede saltarse las invariantes del otro. Si `invoicing` necesita datos de las órdenes, `orders` debería publicar eventos (e `invoicing` mantener su propio modelo de lectura) o exponer una API. El trade-off de consistencia va en sentido contrario: una base de datos compartida es fuertemente consistente, y justamente por eso resulta tentadora.',
    hint: 'Recuerda la razón principal por la que las guías de microservicios dicen que cada servicio debe ser dueño de sus datos.',
  },
  'distributed-systems-kafka-ordering-keys': {
    prompt:
      'Los eventos `created`, `paid` y `shipped` de una misma orden deben procesarse en orden. El topic tiene 12 partitions y el productor envía los mensajes **sin key**. A veces los consumidores ven `shipped` antes que `paid`. ¿Cuál es la solución correcta que mantiene las 12 partitions consumiéndose en paralelo?',
    options: {
      a: 'Usar el ID de la orden como key del mensaje, para que todos los eventos de una orden caigan en la misma partition, donde Kafka preserva el orden',
      b: 'Reducir el topic a una sola partition',
      c: 'Hacer que el consumidor ordene los mensajes por su timestamp antes de procesarlos',
      d: 'Habilitar transacciones exactly-once en el productor',
    },
    explanation:
      'Kafka solo garantiza el orden **dentro de una partition**. Sin key, los mensajes se reparten entre partitions y se consumen en paralelo, así que se pierde el orden de los eventos de cada orden. Usar como key la entidad cuyo orden importa (`orderId`) envía por hash todos sus eventos a una sola partition, mientras que las distintas órdenes se siguen repartiendo entre las 12, lo que mantiene el paralelismo. Una sola partition restauraría el orden, pero descarta el paralelismo que exige el enunciado (un solo consumidor para todo el topic), y además Kafka no permite reducir las partitions de un topic existente: habría que crear un topic nuevo y migrar. Los timestamps de distintos productores no son un orden confiable. Dos detalles más: mantén habilitado el productor idempotente para que los reintentos no reordenen ni dupliquen dentro de una partition, y recuerda que agregar partitions más adelante cambia el mapeo de key a partition.',
    hint: 'Recuerda exactamente qué garantía de orden da Kafka y a qué nivel, y luego revisa qué opción la mantiene para un pedido sin renunciar al paralelismo.',
  },
  'distributed-systems-kafka-consumer-groups': {
    prompt: 'Un topic tiene 4 partitions. Levantas 6 instancias consumidoras, todas en el mismo consumer group. ¿Qué pasa?',
    options: {
      a: '4 consumidores quedan cada uno con una partition y 2 consumidores quedan ociosos como respaldo',
      b: 'Los 6 consumidores reciben todos los mensajes',
      c: 'Kafka divide las partitions para que cada consumidor reciba dos tercios de una partition',
      d: 'El grupo no arranca porque la cantidad de consumidores debe ser igual a la de partitions',
    },
    explanation:
      'Dentro de un consumer group, cada partition se asigna a **exactamente un** consumidor, así que la cantidad de partitions limita el paralelismo del grupo; los consumidores extra quedan ociosos hasta que un rebalance les asigna una partition (por ejemplo, cuando otra instancia muere). Distintos consumer groups reciben cada uno todos los mensajes de forma independiente, y así es como varios servicios se suscriben al mismo topic. Para escalar más un consumidor agregas partitions, teniendo en cuenta que eso cambia la ubicación de las keys.',
    hint: 'Recuerda cómo asigna Kafka las particiones a los miembros de un mismo consumer group.',
  },
  'distributed-systems-kafka-delivery-semantics': {
    prompt: '¿Qué afirmaciones sobre las garantías de entrega de Kafka son verdaderas? Selecciona todas las que apliquen.',
    options: {
      a: 'Si un consumidor hace commit del offset solo después de que termina su efecto secundario, un crash entre ambos pasos vuelve a entregar el mensaje, así que el handler debe ser idempotente',
      b: 'El productor idempotente (`enable.idempotence=true`) evita los duplicados causados por reintentos del productor dentro de una partition',
      c: 'Las transacciones de Kafka dan procesamiento exactly-once de punta a punta incluso cuando el consumidor escribe en una base de datos Postgres externa',
      d: 'Hacer commit de los offsets antes del procesamiento (o de forma independiente) puede perder mensajes si el consumidor tiene un crash después del commit',
      e: 'Agregar a un grupo más consumidores que partitions aumenta el throughput de forma proporcional',
    },
    explanation:
      'Hacer commit después de procesar es **at-least-once** (puede haber duplicados); hacer commit antes de procesar es **at-most-once** (puede haber pérdidas). El productor idempotente elimina los duplicados de los reintentos por partition usando IDs de productor y números de secuencia. Las transacciones de Kafka dan exactly-once solo para leer-procesar-escribir **dentro de Kafka**; en cuanto un efecto secundario sale de Kafka (una fila en una base de datos, un email, un pago), logras effectively-once haciendo idempotente al consumidor, por ejemplo guardando los IDs de mensajes procesados o el offset consumido en la misma transacción de base de datos. Los consumidores que exceden la cantidad de partitions quedan ociosos.\n\n**Dilo en voz alta:** "Diseño para at-least-once y hago idempotentes a los consumidores; exactly-once es una garantía interna de Kafka, y cualquier cosa con efectos secundarios externos necesita claves de deduplicación u offsets guardados de forma transaccional junto con la escritura."',
    hint: 'Relaciona el momento del commit del offset con las garantías de entrega, y recuerda el alcance exacto del productor idempotente de Kafka, sus transacciones y el paralelismo de un consumer group.',
  },
  'distributed-systems-dlq-routing': {
    prompt:
      "Cada mensaje lista el resultado del handler en cada intento (`'ok'`, `'timeout'` o `'invalid'`; si la lista se acaba, se repite el último resultado). El consumidor debe:\n\n- marcar el mensaje como procesado ante `'ok'`;\n- reintentar una falla **transitoria** (`'timeout'`) hasta haber hecho `maxAttempts` intentos en total, y luego mandarlo a la dead-letter queue con la razón `'retries-exhausted'`;\n- mandar a la dead-letter queue una falla **permanente** (`'invalid'`) de inmediato, sin reintentar, con la razón `'invalid'`.\n\nCada entrada de dead-letter registra:\n```js\n{ id, reason, attempts }\n```\nLa implementación actual tiene dos bugs. Corrígelos.",
    explanation:
      'Bug 1: `attempt > maxAttempts` permite un intento de más (4 intentos con `maxAttempts = 3`). Bug 2: los errores permanentes se reintentan como si fueran transitorios. Reintentar un payload malformado o una validación fallida nunca puede tener éxito: solo quema tiempo, retrasa todos los mensajes que vienen detrás en una partition ordenada y castiga a las dependencias. Primero clasifica los errores: los transitorios (timeouts, 503, throttling) reciben reintentos acotados con backoff; los permanentes (validación, deserialización, rechazos de negocio 4xx) van directo a la dead-letter queue.\n\nUna entrada útil en la DLQ lleva el payload original más metadatos (error, cantidad de intentos, topic y offset de origen, correlation ID) para que alguien pueda inspeccionarla, corregirla y hacerle **redrive**. Alerta sobre la profundidad de la DLQ; una DLQ que nadie vigila es pérdida de datos con pasos extra.',
    hint: 'Revisa el límite de reintentos con `maxAttempts = 3` contando los intentos, y clasifica cada resultado como transitorio o permanente antes de decidir si reintentar.',
  },
  'distributed-systems-poison-message': {
    prompt:
      'Un consumidor lee una partition ordenada de Kafka. Un mensaje contiene JSON malformado: el handler lanza un error, el offset no se confirma, el consumidor se reinicia y vuelve a toparse con el mismo mensaje, para siempre. No se procesa nada de lo que viene detrás. ¿Qué es esto y cuál es el remedio estándar?',
    options: {
      a: 'Un poison message: después de una cantidad acotada de intentos, publicarlo con metadatos del error en un dead-letter topic, hacer commit del offset y alertar, para que la partition siga fluyendo',
      b: 'Consumer lag: agregar más consumidores al grupo para que otro pueda tomar el mensaje',
      c: 'Un bug del broker: borrar y volver a crear el topic',
      d: 'Back-pressure: aumentar la cantidad de reintentos hasta que el mensaje finalmente se pueda parsear',
    },
    explanation:
      'Un mensaje que nunca se puede procesar bloquea todo lo que tiene detrás cuando el consumidor insiste en manejarlo antes de hacer commit. La dead-letter queue (o topic) es donde se estacionan esos mensajes con suficiente contexto para investigarlos y hacerles redrive después. Agregar consumidores no ayuda, porque la partition pertenece a un solo consumidor, y reintentar una falla determinista nunca tiene éxito. SQS lo ofrece de forma nativa con una redrive policy (`maxReceiveCount`); en Kafka lo implementas en el consumidor o en el framework.',
    hint: 'Pregúntate si este fallo es transitorio o determinista, y qué pasa con el resto de la partición mientras un consumidor lo sigue reintentando.',
  },
  'distributed-systems-idempotency-dedupe': {
    prompt:
      'Un endpoint de webhook recibe eventos at-least-once. Implementa `solution(events)` que devuelva los `id` de los eventos a procesar, conservando solo la **primera** aparición de cada `idempotencyKey`, en orden de llegada. Los eventos sin `idempotencyKey` no se pueden deduplicar y siempre se conservan.',
    explanation:
      'La entrega at-least-once significa que los duplicados son normales, así que el consumidor los convierte en no-ops recordando qué keys ya manejó. Un `Set` da verificaciones de pertenencia en O(1) y una sola pasada preserva el orden de llegada. En producción el conjunto de "vistos" no está en memoria: es una tabla con una restricción de unicidad sobre la key (insertar-o-ignorar dentro de la misma transacción que el efecto secundario) o un `SET NX` de Redis con un TTL al menos tan largo como la ventana de reintentos del productor.',
    hint: 'Haz una sola pasada en orden de llegada y recuerda lo que ya aceptaste; cuida los eventos que no traen clave.',
  },
  'distributed-systems-idempotency-keys-api': {
    prompt:
      'Un cliente móvil llama a `POST /payments`, la solicitud da timeout y el cliente reintenta. A algunos clientes se les cobra dos veces. Diseña el soporte del lado del servidor para un header `Idempotency-Key`.',
    modelAnswer:
      'El cliente genera una key única (un UUID) por operación lógica y la envía en cada reintento de esa operación. El servidor guarda la key, acotada a quien llama (tenant o usuario), junto con un hash del cuerpo de la solicitud y un estado, en una tabla con una restricción de unicidad. En la primera solicitud inserta la key como `in-progress` en su propia transacción corta y hace commit antes de llamar al proveedor, así la restricción de unicidad funciona como lock y los reintentos concurrentes la ven; luego realiza el cobro y guarda el código de estado y el cuerpo de la respuesta finales asociados a la key en una segunda transacción. Un reintento con la misma key y el mismo cuerpo devuelve la respuesta guardada sin volver a cobrar; la misma key con un cuerpo distinto es un bug del cliente y recibe un 422; un reintento que llega mientras el original sigue en curso recibe un 409 (o espera), y la restricción de unicidad hace que esto sea seguro ante carreras. Las keys expiran después de una ventana más larga que cualquier política de reintentos del cliente (por ejemplo 24 horas). Aguas abajo, paso la misma key al proveedor de pagos, ya que Stripe y APIs similares también soportan idempotency keys, así la garantía se mantiene de punta a punta.',
    rubric: [
      'Key generada por el cliente para cada operación lógica, reutilizada en los reintentos',
      'El servidor guarda la key con una huella de la solicitud y la respuesta final, y la reproduce en el reintento',
      'Maneja los duplicados concurrentes de forma segura ante carreras (restricción de unicidad o lock, 409 mientras está en curso)',
      'Rechaza la reutilización de una key con un payload distinto y acota las keys por tenant o usuario',
      'Define una ventana de retención y propaga la key a los proveedores de abajo',
    ],
    explanation:
      'POST no es idempotente por definición, y un timeout no le dice al cliente si el cobro ocurrió. Las idempotency keys hacen seguro un reintento haciendo que el **servidor** recuerde los resultados.\n\n**Dilo en voz alta:** "Los reintentos solo son seguros en operaciones idempotentes, así que para POST exijo una idempotency key: el servidor registra la key con el hash de la solicitud y la respuesta, reproduce la respuesta guardada en un reintento, y una restricción de unicidad hace que los duplicados concurrentes sean seguros ante carreras."',
    hint: 'Cubre quién genera la clave, qué guarda el servidor con ella, cómo se responde un reintento, cómo los duplicados concurrentes quedan a salvo de carreras y cuánto viven las claves.',
  },
  'distributed-systems-backoff-full-jitter': {
    prompt:
      'Implementa un calendario de demoras de reintento usando **backoff exponencial con tope y full jitter**. Para el reintento `i` (empezando en 0), el techo es `baseMs` duplicado `i` veces, pero nunca más que `capMs`; la demora es un valor aleatorio entre 0 y ese techo, redondeado hacia abajo a un milisegundo entero.\n\n`draws` reemplaza a una función aleatoria con semilla: `draws[i]` es el valor en `[0, 1)` que se usa para el reintento `i`, lo que hace que el calendario sea determinista en las pruebas. Devuelve las `retries` demoras en orden.',
    explanation:
      'El backoff exponencial le da a una dependencia en problemas espacio para recuperarse; el tope mantiene acotada la espera en el peor caso. El **jitter** es la parte que la gente olvida: sin él, todos los clientes que fallaron en el mismo momento reintentan en el mismo momento (un thundering herd) y recrean el pico que causó la falla. Full jitter (`random(0, min(cap, base * 2^i))`) reparte los reintentos por toda la ventana y, según el análisis de AWS, completa el trabajo total con la menor cantidad de llamadas. El tope debe aplicarse **antes** del jitter: si se aplica después (`min(cap, random * base * 2^i)`), la mayoría de los reintentos tardíos queda fijada exactamente en `cap`, los clientes se vuelven a sincronizar en el tope y se pierde el jitter.\n\nRecibir la aleatoriedad como entrada (un generador con semilla o valores ya sorteados) es lo que hace que la lógica de reintentos se pueda probar unitariamente. Además, acota el total: una cantidad máxima de intentos o un plazo límite, respeta `Retry-After` en 429/503 y reintenta solo operaciones idempotentes.\n\n**Dilo en voz alta:** "Los reintentos usan backoff exponencial con tope y full jitter para evitar tormentas de reintentos sincronizadas, un presupuesto acotado de intentos, y solo en operaciones idempotentes o en solicitudes que llevan una idempotency key."',
    hint: 'Decide si el tope se aplica antes o después del jitter, y cuida el redondeo.',
  },
  'distributed-systems-what-to-retry': {
    prompt:
      'Tu wrapper del cliente HTTP reintenta automáticamente con backoff. La API de pagos deduplica las solicitudes que llevan un header `Idempotency-Key`. ¿Qué fallas debería reintentar? Selecciona todas las que apliquen.',
    options: {
      a: '`503 Service Unavailable` en `GET /orders/42`',
      b: '`429 Too Many Requests` con un header `Retry-After: 2`, esperando al menos 2 segundos',
      c: 'Un connection reset en `POST /payments` que lleva un header `Idempotency-Key`',
      d: '`400 Bad Request` porque falta un campo obligatorio',
      e: 'Un timeout en `POST /payments` enviado **sin** idempotency key',
    },
    explanation:
      'Reintenta cuando la falla es **transitoria** *y* repetir la solicitud es **seguro**. Un 503 en un GET cumple ambas. Un 429 es transitorio por definición y el servidor te dijo cuándo volver. Una falla de red en un POST es segura de reintentar solo porque la idempotency key le permite al servidor deduplicar. Un 400 es determinista: la misma solicitud falla de la misma forma. Un POST que dio timeout sin key puede haber tenido éxito ya, así que reintentar puede cobrar dos veces; expón el error o reconcilia en su lugar. Además, pon un circuit breaker alrededor de la dependencia para que los reintentos se detengan cuando claramente está caída.',
    hint: 'Para cada fallo, hazte dos preguntas: ¿le iría distinto a la misma petición más tarde?, ¿y qué pasa en el servidor si se ejecuta dos veces?',
  },
  'distributed-systems-correlation-propagation': {
    prompt:
      "`solution(incoming, ids)` construye los headers para una llamada hacia abajo. Reglas:\n\n- Reutiliza el correlation ID de quien llama desde el header `x-correlation-id`, buscado **sin distinguir mayúsculas de minúsculas**; si falta o está vacío, usa `ids.correlationId`. Envíalo siempre como `x-correlation-id` en minúsculas.\n- Si el `traceparent` W3C entrante es válido (`<version>-<trace-id>-<parent-id>-<flags>`: campos hex en minúsculas de 2, 32, 16 y 2 caracteres), envía un `traceparent` **hijo**: misma versión, trace-id y flags, pero con `ids.spanId` como parent-id. Si falta o es inválido, omite `traceparent`.\n\nCorrige la implementación actual.",
    explanation:
      'Los nombres de los headers HTTP no distinguen mayúsculas de minúsculas. `req.headers` de Node los pasa a minúsculas por ti, pero los headers que vienen de colas, eventos de Lambda, fixtures de prueba u otros frameworks a menudo no, así que una búsqueda que distingue mayúsculas inicia en silencio un correlation ID nuevo y parte en dos los logs de una misma solicitud.\n\nUn correlation ID une las líneas de log; una traza agrega estructura. En W3C Trace Context el **trace-id** se mantiene constante durante toda la solicitud, mientras que cada salto envía **su propio span ID** como parent-id, y así es como un backend de tracing (OpenTelemetry, Jaeger, X-Ray) reconstruye el árbol de llamadas. Reenviar el `traceparent` entrante sin cambios colgaría el span de abajo del padre equivocado. En la práctica el SDK de OpenTelemetry hace esta propagación por ti; el principio que hay que saber es: acéptalo, valídalo, genéralo si falta, regístralo en cada línea de log y reenvíalo en cada llamada y mensaje salientes.',
    hint: 'Recuerda que los nombres de header no distinguen mayúsculas de minúsculas, y revisa cómo es un `traceparent` válido y cuál de sus campos corresponde al nuevo span.',
  },
};
