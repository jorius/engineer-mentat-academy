// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  'aws-lambda-layer-cold-start-myth': {
    prompt:
      'Una Lambda de Node.js tiene un paquete de despliegue de 45 MB, casi todo `node_modules`. Para reducir la latencia de cold start, un compañero mueve todas las dependencias a una **Lambda layer** y vuelve a desplegar un zip de función de 200 KB. ¿Cuál es el efecto realista sobre los cold starts?',
    options: {
      a: 'Los cold starts bajan mucho, porque las layers quedan en caché en el host de Lambda y se saltan el paso de descarga',
      b: 'Ninguna mejora significativa: la layer igual se descomprime en `/opt` cuando se crea el entorno de ejecución, y los mismos módulos se siguen cargando con `require` durante el init',
      c: 'Los cold starts desaparecen, porque las layers se cargan una vez por cuenta y las comparten todos los entornos de ejecución',
      d: 'Los cold starts empeoran, porque cada layer agrega un viaje de red separado en cada invocación',
    },
    explanation:
      'Un cold start es el tiempo que toma crear un entorno de ejecución: descargar y descomprimir el código (la función **más** las layers), arrancar el runtime y luego ejecutar tu código de init (imports de nivel superior, clientes del SDK). Las layers cambian *dónde* viven los bytes, no cuántos se cargan, así que el tiempo de init es prácticamente el mismo. Las layers sirven para **compartir** código o binarios entre funciones y mantener pequeño el artefacto de la función al desplegar; los límites son 5 layers por función y 250 MB descomprimidos para la función más las layers (las imágenes de contenedor llegan hasta 10 GB). Lo que de verdad acorta los cold starts: un bundle más pequeño (con tree-shaking, solo los clientes del SDK v3 que usas), imports diferidos en rutas poco frecuentes, más memoria (la CPU escala con ella) o provisioned concurrency. SnapStart no es una opción aquí: cubre los runtimes administrados de Java, Python y .NET, no una función zip de Node.js. Las layers no se recargan en cada invocación, así que la afirmación de que cada layer agrega un viaje de red en cada invocación también es incorrecta.',
    hint: 'Piensa en qué se gasta realmente el tiempo de un cold start y dónde terminan los contenidos de una layer cuando se crea un entorno de ejecución.',
  },
  'aws-lambda-concurrency-controls': {
    prompt:
      'Una función de pagos comparte región con otras 40 funciones. ¿Qué afirmaciones sobre la concurrencia de Lambda son verdaderas? Selecciona todas las que apliquen.',
    options: {
      a: 'La reserved concurrency garantiza y a la vez limita la función: esa cantidad se aparta del pool regional, así que ninguna otra función puede usarla',
      b: 'La provisioned concurrency es gratis siempre que también configures la reserved concurrency con el mismo valor',
      c: 'Poner la reserved concurrency en 0 hace throttling de cada invocación, lo que la convierte en un interruptor de apagado rápido durante un incidente',
      d: 'Cuando una invocación síncrona (API Gateway) sufre throttling, Lambda la encola y la reintenta automáticamente hasta por 6 horas',
    },
    explanation:
      'La concurrencia es el número de invocaciones en curso; la cuota regional por defecto es 1,000 (límite blando) compartida por todas las funciones. La **reserved concurrency** es gratis y es a la vez un piso (reservado para esta función) y un techo (no puede superarlo), lo que además protege a una base de datos aguas abajo de una estampida al escalar. Ponerla en 0 es la forma documentada de detener una función. La **provisioned concurrency** mantiene N entornos inicializados para eliminar los cold starts y se cobra por el tiempo que está configurada, se use o no. El throttling se comporta distinto según el tipo de invocación: los llamadores **síncronos** reciben `429 TooManyRequestsException` y deben reintentar por su cuenta; los eventos **asíncronos** (S3, SNS, EventBridge) esperan en la cola interna y se reintentan hasta por 6 horas antes de ir a una DLQ o a un destino on-failure.\n\n**Dilo en voz alta:** "La reserved concurrency es una garantía gratuita y un tope, la provisioned concurrency es precalentamiento pagado, y una llamada síncrona con throttling es problema del llamador, mientras que un evento asíncrono con throttling lo reintenta Lambda."',
    hint:
      'Separa lo que hace la reserved concurrency de lo que cuesta la provisioned concurrency, y recuerda quién reintenta una llamada con throttling en invocaciones síncronas frente a asíncronas.',
  },
  'aws-lambda-timeout-sqs-visibility': {
    prompt:
      'Una cola SQS dispara una Lambda cuyo timeout es de 5 minutos; un lote típico tarda unos 2 minutos. El event source mapping se creó cuando el visibility timeout de la cola era de 10 minutos; la semana pasada alguien lo bajó a 30 segundos para "acelerar los reintentos". De vez en cuando los pedidos se procesan **dos veces**. ¿Cuál es la causa raíz y la corrección adecuada?',
    options: {
      a: 'Lambda reintenta por defecto una vez más cada lote exitoso para cubrirse de fallos parciales; configura en 0 el máximo de reintentos del event source mapping',
      b: 'El visibility timeout de 30 s vence a mitad del lote, así que otro poller recibe los mismos mensajes; súbelo a al menos seis veces el timeout de la función y haz el handler idempotente',
      c: 'Las colas estándar entregan cada mensaje dos veces por diseño, porque cada copia se guarda en varios servidores; cambia a una cola FIFO y los duplicados desaparecen',
      d: 'El timeout de la función es demasiado largo, así que Lambda mantiene abierto el lote y SQS asume que falló; bájalo a 30 s para que coincida con el visibility timeout',
    },
    explanation:
      'El visibility timeout es el tiempo que un mensaje recibido permanece oculto. Si el procesamiento dura más, el mensaje reaparece y una invocación concurrente lo vuelve a recibir. Lambda verifica que el timeout de la función no supere el visibility timeout cuando creas o actualizas el event source mapping, pero no vigila la cola después, así que un cambio posterior en la cola reintroduce el problema en silencio. AWS recomienda un visibility timeout de la cola de **al menos 6 veces el timeout de la función** (más cualquier ventana de batching) para que los reintentos después de un throttling también quepan. Aun así, SQS estándar es at-least-once, así que el handler debe ser idempotente (por ejemplo, una escritura condicional sobre el id del pedido), y los fallos parciales del lote se deben reportar con `ReportBatchItemFailures` en lugar de fallar el lote completo. FIFO reduce los duplicados dentro de una ventana de deduplicación de 5 minutos, pero no corrige un visibility timeout más corto que el trabajo. Bajar el timeout de la función a 30 s solo mataría los lotes de 2 minutos. Recuerda los techos: el timeout máximo de Lambda es de 15 minutos, y las integraciones de API Gateway expiran mucho antes (29 s por defecto en REST, 30 s como máximo en HTTP APIs).\n\n**Dilo en voz alta:** "El visibility timeout debe superar con holgura el tiempo de procesamiento, AWS dice seis veces el timeout de la función, y el consumidor tiene que ser idempotente de todos modos porque SQS es at-least-once."',
    hint: 'Recuerda qué controla el visibility timeout de SQS y qué pasa con un mensaje recibido que no se borra a tiempo.',
  },
  'aws-api-gateway-rest-vs-http-features': {
    prompt:
      'Estás eligiendo entre una **REST API (v1)** y una **HTTP API (v2)** de API Gateway. ¿Cuáles de estos requisitos te obligan a usar una REST API? Selecciona todas las que apliquen.',
    options: {
      a: 'API keys por cliente con usage plans (cuotas y throttling por cliente)',
      b: 'Validar JWT de cualquier emisor OIDC (Auth0, Entra ID, Cognito) sin escribir un Lambda authorizer',
      c: 'Caché de respuestas a nivel de stage',
      d: 'Asociar un web ACL de AWS WAF directamente a la API',
    },
    explanation:
      'Las HTTP APIs son la opción más barata y de menor latencia (aproximadamente $1.00 frente a $3.50 por millón de solicitudes), con un **JWT authorizer nativo**, integraciones simples de proxy a Lambda y proxy HTTP, y despliegues automáticos. Las REST APIs conservan el conjunto de funciones más rico: API keys y usage plans, caché por stage, asociación directa con WAF, validación de solicitudes, mapping templates (VTL) para transformar solicitudes y respuestas, endpoints privados dentro de una VPC, endpoints edge-optimized e integraciones directas con muchos servicios de AWS. Regla práctica: empieza con HTTP API salvo que necesites una de esas funciones exclusivas de REST. Validar JWTs de cualquier emisor OIDC es lo que las HTTP APIs hacen de forma nativa; REST solo tiene un authorizer específico de Cognito, y fuera de eso escribes un Lambda authorizer.',
    hint: 'Las HTTP APIs son la opción ligera y más barata; recuerda qué funciones del gateway soporta cada tipo de API, incluida la autorización.',
  },
  'aws-api-gateway-throttling-status': {
    prompt:
      'Un cliente supera los límites de rate y burst configurados en un stage de API Gateway. ¿Qué recibe el cliente y qué debería hacer?',
    options: {
      a: '`503 Service Unavailable`; el backend está caído, así que el cliente debería hacer failover a otra región',
      b: '`429 Too Many Requests`; el cliente debería reintentar con backoff exponencial y jitter',
      c: '`504 Gateway Timeout`; el cliente debería aumentar su propio timeout',
      d: '`403 Forbidden`; el cliente necesita una API key nueva',
    },
    explanation:
      'API Gateway aplica throttling con un **token bucket**: el *rate* es la recarga constante en solicitudes por segundo y el *burst* es el tamaño del bucket. Los límites se aplican en varios niveles: la cuenta por región (10,000 rps constantes con un burst de 5,000 por defecto), la configuración del stage y del método, y los usage plans por cliente en las REST APIs. Las solicitudes excedentes se rechazan con `429` antes de llegar a Lambda, así que no cuestan nada aguas abajo. Los clientes deberían hacer backoff exponencial con jitter. `504` significa que la integración tardó más que el timeout de integración, que es otro problema.',
    hint: 'Recuerda qué códigos de estado devuelve el propio API Gateway cuando rechaza una solicitud, qué significa cada uno y cómo debería reaccionar un cliente bien portado.',
  },
  'aws-api-gateway-authorizer-choice': {
    prompt:
      'Tu API está detrás de API Gateway. Los usuarios inician sesión a través de un proveedor OIDC, y algunas rutas también necesitan una verificación de permisos a nivel de tenant que vive en tu base de datos. ¿Qué tipos de authorizer usarías y cuáles son las trampas del caché de authorizers?',
    modelAnswer:
      'Para la validación simple del token usaría el **JWT authorizer** en una HTTP API (o el authorizer de Cognito user pool en una REST API): API Gateway valida la firma, el emisor, la audiencia y la expiración, y verifica los scopes por ruta, sin código y sin la latencia extra de una Lambda. Para el permiso de tenant usaría un **Lambda authorizer** solo donde hace falta, que devuelva una política IAM (REST) o una respuesta simple de allow/deny con contexto (HTTP API), y pasaría el id de tenant resuelto al backend a través del contexto del authorizer. Los resultados del authorizer se guardan en caché por identity source (por ejemplo, el header `Authorization`) con un TTL de hasta una hora. El bug clásico es un Lambda authorizer de REST que devuelve una política solo para el ARN del método **específico** que se está llamando; esa política queda en caché y el mismo token se rechaza luego en todas las demás rutas, así que o devuelves una política con recurso comodín o incluyes la ruta en la clave de caché. El riesgo inverso es dejar en caché un allow después de que se revocó un permiso, así que mantén el TTL corto para las verificaciones sensibles. El backend igual debe aplicar la autorización sobre los datos que devuelve; la verificación del gateway es gruesa.',
    rubric: [
      'Elige el authorizer integrado de JWT o de Cognito para validar el token en lugar de código propio',
      'Usa un Lambda authorizer solo para lógica personalizada y pasa contexto al backend',
      'Explica el caché de resultados por identity source y TTL (máximo una hora)',
      'Menciona el bug de caché de políticas por método o el riesgo de un allow obsoleto después de una revocación',
      'Afirma que el backend sigue aplicando la autorización de grano fino',
    ],
    explanation:
      'Señal de senior: separar la autenticación (validación de JWT barata y declarativa en el borde) de la autorización (personalizada y basada en datos), y saber que las respuestas del authorizer en caché son la fuente de 403 intermitentes y confusos.\n\n**Dilo en voz alta:** "Deja que el gateway valide el JWT gratis, usa un Lambda authorizer solo para reglas personalizadas, y recuerda que la política en caché se indexa por el token, así que una política limitada a un método va a rechazar la siguiente ruta."',
    hint:
      'Separa autenticación de autorización: qué puede validar el gateway de forma declarativa, qué necesita código propio y qué sale mal cuando los resultados del authorizer se guardan en caché por token.',
  },
  'aws-s3-strong-consistency': {
    prompt:
      'Un servicio sobrescribe `reports/latest.json` en S3 con un `PutObject` exitoso, e inmediatamente después otro servicio hace un `GetObject` sobre la misma key. ¿Qué obtiene el lector?',
    options: {
      a: 'Posiblemente la versión anterior durante unos segundos, porque las sobrescrituras son eventualmente consistentes',
      b: 'La versión nueva: S3 tiene consistencia fuerte de lectura después de escritura para los PUT (incluidas las sobrescrituras) y los DELETE, y LIST también los refleja',
      c: 'Un `409 Conflict` hasta que termine la replicación entre Availability Zones',
      d: 'La versión nueva solo si el versionado está habilitado en el bucket',
    },
    explanation:
      'Desde diciembre de 2020, toda lectura en S3 después de una escritura exitosa devuelve los datos más recientes, para objetos nuevos, sobrescrituras, borrados y operaciones de listado, sin costo adicional. La respuesta de "sobrescrituras eventualmente consistentes" describe el modelo antiguo que muchos posts de blog todavía repiten. Consistencia fuerte no significa bloqueo: dos escritores concurrentes siguen produciendo last-writer-wins. Para concurrencia optimista usa **escrituras condicionales** (`If-None-Match: *` para crear solo si no existe, `If-Match` con un ETag para actualizar solo la versión que leíste).',
    hint: 'Recuerda el modelo de consistencia actual de S3 para los PUT que sobrescriben, y verifica que lo que recuerdas no esté desactualizado.',
  },
  'aws-s3-static-spa-hosting': {
    prompt:
      'Despliegas una single-page app de React en S3 y la sirves en `https://app.example.com`. ¿Qué afirmaciones son verdaderas? Selecciona todas las que apliquen.',
    options: {
      a: 'El **website endpoint** de S3 sirve solo HTTP, así que HTTPS en un dominio propio requiere CloudFront (u otra CDN) al frente',
      b: 'Con CloudFront y **Origin Access Control** apuntando al endpoint REST del bucket, el bucket puede seguir privado con Block Public Access activado',
      c: 'Los deep links como `/orders/42` funcionan automáticamente, porque S3 recurre a `index.html` para keys desconocidas',
      d: 'Activar el static website hosting hace que todos los objetos del bucket sean de lectura pública',
    },
    explanation:
      'La configuración moderna es un bucket **privado**, CloudFront con OAC (el sucesor de Origin Access Identity) y una bucket policy que permite `s3:GetObject` solo al service principal `cloudfront.amazonaws.com` con `aws:SourceArn` igual a tu distribución. Así ya no necesitas el website endpoint. Las rutas del lado del cliente no existen como objetos, así que S3 devuelve 403/404; lo corriges con una custom error response de CloudFront (403 y 404 hacia `/index.html` con status 200) o con una reescritura en una CloudFront Function. El website hosting solo cambia cómo se sirve el bucket; los objetos se vuelven públicos solo si además desactivas Block Public Access y agregas una política de lectura pública. Los despliegues deberían subir los assets con hash con un `Cache-Control` largo e `index.html` con `no-cache`, y luego invalidar `/index.html`.',
    hint: 'Separa el website endpoint de S3 del REST endpoint detrás de CloudFront, y sigue qué devuelve S3 cuando un navegador pide un deep link directamente.',
  },
  'aws-s3-presigned-url-behavior': {
    prompt:
      'Una Lambda genera presigned URLs para que los navegadores suban avatares directamente a S3. ¿Qué afirmaciones son verdaderas? Selecciona todas las que apliquen.',
    options: {
      a: 'La URL lleva los permisos de las credenciales que la firmaron, evaluados cuando se usa; si el firmante pierde `s3:PutObject`, la URL deja de funcionar',
      b: 'Una URL firmada con las credenciales temporales del rol de la Lambda deja de funcionar cuando esa sesión expira, aunque `X-Amz-Expires` sea más largo',
      c: 'Una presigned URL de PUT es la herramienta correcta para imponer un rango de tamaño de subida, como de 0 a 5 MB',
      d: 'Una presigned URL SigV4 firmada por un usuario IAM puede seguir siendo válida hasta por 30 días',
    },
    explanation:
      'Una presigned URL es un bearer token: cualquiera que la tenga puede ejecutar exactamente esa operación sobre exactamente esa key hasta que expire, con los permisos del firmante. La validez máxima con SigV4 es de **7 días**, y con credenciales temporales (roles de Lambda, STS) termina cuando terminan las credenciales, a menudo en cuestión de horas. Un PUT prefirmado no puede expresar un *rango* de tamaño; usa un **presigned POST** con una política que contenga `content-length-range` (y condiciones de prefijo de key y de `Content-Type`), o firma un `Content-Length` exacto. Mantén expiraciones cortas, genera la key en el servidor (nunca confíes en el nombre de archivo del cliente) y procesa la subida de forma asíncrona a partir de un evento de S3.\n\n**Dilo en voz alta:** "Una presigned URL es una credencial bearer de corta duración con los derechos del firmante; para subidas uso presigned POST para que la política pueda limitar el tamaño y el content type."',
    hint:
      'Una URL prefirmada toma prestada la identidad de quien la firmó en el momento de la solicitud; piensa en qué limita su vida útil y qué mecanismo de subida puede llevar una política con condiciones.',
  },
  'aws-s3-event-parse-records': {
    prompt:
      'Una Lambda recibe notificaciones de eventos de S3. Implementa `solution(event)` para que devuelva una entrada por cada registro cuyo `eventName` empiece con `ObjectCreated:`, en el orden de los registros, con esta forma:\n\n```ts\n[\n  { bucket: \'uploads\', key: \'invoices/March 2026.pdf\' },\n]\n```\n\nLas keys de los objetos llegan **codificadas como URL**, con los espacios codificados como `+`; tu decodificador también debe aceptar `%20`. Decodifícalas para obtener la key real. Ignora otros tipos de evento y devuelve `[]` cuando falte `Records`.',
    explanation:
      'S3 codifica las keys de los objetos en las notificaciones como un formulario HTML: los espacios se convierten en `+` y los caracteres reservados o no ASCII se codifican con porcentaje (letras, dígitos y `/` quedan igual), así que un `+` literal llega como `%2B`. El orden importa: reemplaza `+` por un espacio **primero** y luego aplica `decodeURIComponent`; si decodificas primero, `%2B` se convertiría en `+` y después, por error, en un espacio. Olvidar esto es un bug clásico de producción: `GetObject` con la key cruda devuelve `NoSuchKey` solo para los archivos cuyo nombre tiene espacios, acentos u otros caracteres codificados. Además, filtra por `eventName` (o configura la notificación solo para `s3:ObjectCreated:*`), y recuerda que una invocación puede traer varios registros.',
    hint:
      'Filtra por `eventName`, usa un arreglo vacío cuando falte `Records` y decide con cuidado si tratas el `+` antes o después de `decodeURIComponent`.',
  },
  'aws-s3-event-delivery-semantics': {
    prompt:
      'Construyes un pipeline de imágenes sobre notificaciones de eventos de S3. ¿Qué afirmaciones son verdaderas? Selecciona todas las que apliquen.',
    options: {
      a: 'Las notificaciones se entregan at-least-once, así que el consumidor debe tolerar duplicados',
      b: 'Los eventos de una misma key siempre llegan en el orden en que ocurrieron las escrituras',
      c: 'Una Lambda disparada por `ObjectCreated` en `uploads/` que escribe su miniatura de vuelta bajo `uploads/` puede dispararse a sí misma en un bucle',
      d: 'Puedes agregar dos configuraciones de notificación con prefijos superpuestos para el mismo tipo de evento, cada una apuntando a una Lambda distinta',
    },
    explanation:
      'Las notificaciones de S3 son **at-least-once** y suelen llegar en segundos, pero pueden tardar más y pueden duplicarse. El orden no está garantizado: los registros de creación y borrado traen un `sequencer` hexadecimal; rellena con ceros a la izquierda el más corto y compáralos lexicográficamente para descartar eventos obsoletos de la misma key. Escribir la salida en el prefijo que dispara la función crea un bucle recursivo que escala y factura rápido (la detección de bucles recursivos de Lambda ya corta los bucles con S3 tras unas 16 invocaciones, pero no dependas de ella); escribe en otro prefijo o bucket y filtra por prefijo/sufijo. S3 rechaza filtros de prefijo/sufijo superpuestos para el mismo tipo de evento, así que para repartir a varios consumidores publica en un topic de SNS (y suscribe varias colas) o habilita **EventBridge** en el bucket y usa reglas, lo que además te da filtrado por contenido, archivo y replay.\n\n**Dilo en voz alta:** "Los eventos de S3 son at-least-once y sin orden, así que hago idempotentes a los consumidores, uso el sequencer para el orden, nunca escribo de vuelta en el prefijo que dispara, y uso SNS o EventBridge cuando más de un consumidor necesita el mismo evento."',
    hint: 'Recuerda las garantías de entrega y de orden de las notificaciones de S3, las reglas para configuraciones de notificación que se solapan y qué pueden disparar las escrituras de la propia función.',
  },
  'aws-sns-fan-out-vs-sqs': {
    prompt:
      'Cuando se crea un pedido, los servicios de email, facturación y analítica deben recibir **cada uno** todos los eventos de pedido, y cualquiera de ellos puede estar caído una hora sin perder mensajes. ¿Qué diseño encaja?',
    options: {
      a: 'Una cola SQS que los tres servicios consultan',
      b: 'Un topic de SNS con tres colas SQS suscritas, una por servicio',
      c: 'Un topic de SNS con cada servicio suscrito directamente por HTTPS',
      d: 'Tres topics de SNS que cada servicio consulta cuando vuelve a estar en línea',
    },
    explanation:
      '**SNS** es pub/sub basado en push: una publicación se copia a cada suscripción, pero SNS no guarda mensajes para leerlos después. **SQS** es una cola basada en pull con retención (hasta 14 días); los consumidores de una misma cola *compiten*, así que cada mensaje va solo a uno de ellos (la cola única compartida le da cada pedido a un servicio, no a los tres). El patrón fan-out los combina: SNS copia el evento, cada cola SQS lo guarda para su propio servicio, y cada servicio escala y falla de forma independiente. Las suscripciones HTTPS directas tienen reintentos limitados, así que un servicio caído durante una hora pierde eventos. Los topics no se pueden consultar en absoluto.',
    hint: 'Divide el requisito en dos, cada servicio recibe cada evento y nada se pierde mientras un servicio está caído, y recuerda qué servicio de mensajería de AWS da cada propiedad.',
  },
  'aws-s3-to-sns-required-wiring': {
    prompt:
      'Llamas a `PutBucketNotificationConfiguration` para publicar `s3:ObjectCreated:*` del bucket `my-uploads` al topic de SNS `uploads`, que está cifrado con SSE-KMS, y falla con *"Unable to validate the following destination configurations"*. ¿Cuáles de estos elementos son realmente necesarios para que la conexión funcione? Selecciona todas las que apliquen.',
    options: {
      a: 'Un statement en la **access policy del topic de SNS** que permita al principal `s3.amazonaws.com` hacer `sns:Publish`, limitado con `aws:SourceArn` = el ARN del bucket y `aws:SourceAccount`',
      b: 'Una **bucket policy** que otorgue a `sns.amazonaws.com` permiso de `s3:GetObject` para que SNS pueda leer los objetos nuevos',
      c: 'Como el topic usa SSE-KMS, una customer managed key cuya key policy permita a `s3.amazonaws.com` llamar a `kms:GenerateDataKey*` y `kms:Decrypt`',
      d: 'Un rol IAM que S3 asume para publicar, referenciado por ARN en la configuración de notificación',
    },
    explanation:
      'S3 publica como un **service principal** gobernado por la resource policy del destino; no hay ningún rol que asumir y no interviene ninguna bucket policy (la bucket policy controla el acceso *al* bucket, y SNS nunca lee objetos). Cuando guardas la configuración, S3 envía un evento de prueba, y falla con ese error de validación si la política del topic no lo permite. El statement de la política del topic se ve así:\n\n```json\n{\n  "Effect": "Allow",\n  "Principal": { "Service": "s3.amazonaws.com" },\n  "Action": "SNS:Publish",\n  "Resource": "arn:aws:sns:us-east-1:111122223333:uploads",\n  "Condition": {\n    "ArnLike": { "aws:SourceArn": "arn:aws:s3:::my-uploads" },\n    "StringEquals": { "aws:SourceAccount": "111122223333" }\n  }\n}\n```\n\nLas condiciones evitan el problema del confused deputy (que el bucket de otra persona publique en tu topic). Un topic cifrado necesita una KMS key **customer managed**, porque la key policy de la key administrada por AWS `aws/sns` no se puede editar para admitir a S3. El topic debe ser un topic estándar (los topics FIFO no se soportan como destinos de S3) en la misma región que el bucket. Aguas abajo, cada cola SQS suscrita al topic necesita su propia queue policy que permita a `sns.amazonaws.com` con `aws:SourceArn` = el ARN del topic, y la **raw message delivery** les ahorra a los consumidores desenvolver el sobre de SNS alrededor del JSON del evento de S3.\n\n**Dilo en voz alta:** "S3 hacia SNS es una conexión por resource policies: la política del topic deja publicar al service principal de S3, limitado por SourceArn y SourceAccount, más una key policy de KMS customer managed si el topic está cifrado; sin bucket policy y sin rol."',
    hint:
      'Pregúntate qué política autoriza a un service principal a publicar, y qué necesita además un destino cifrado para que ese principal pueda usar la clave.',
  },
  'aws-ecs-task-role-vs-execution-role': {
    prompt:
      'Un servicio de ECS ejecuta una API de Node.js. Su task definition descarga una imagen de ECR privado, lee una contraseña de base de datos de Secrets Manager mediante el campo `secrets`, envía logs a CloudWatch, y el **código de la aplicación** escribe en DynamoDB con el AWS SDK. ¿Dónde se debe otorgar `dynamodb:PutItem`?',
    options: {
      a: 'En el **task execution role**, porque ya tiene los permisos de ECR y CloudWatch',
      b: 'En el **task role**, que el SDK dentro del contenedor toma automáticamente del endpoint de credenciales del contenedor',
      c: 'En el instance profile de la instancia de contenedor EC2, para que todas las tareas del host puedan usarlo',
      d: 'En un usuario IAM cuyas access keys se inyectan como variables de entorno',
    },
    explanation:
      'ECS tiene dos roles con consumidores distintos. El **task execution role** lo usa el agente de ECS / Fargate *antes y alrededor* de tu código: descargar de ECR, obtener los `secrets` de Secrets Manager o SSM para inyectarlos como variables de entorno y escribir logs. El **task role** lo asume tu aplicación; el SDK encuentra sus credenciales a través de `AWS_CONTAINER_CREDENTIALS_RELATIVE_URI`. Mezclarlos o rompe el arranque (`CannotPullContainerError`, errores de secrets) o da privilegios de más. El instance profile solo funciona con el launch type EC2 y filtra el permiso a todas las tareas del host; las access keys de larga duración nunca son la respuesta. Repaso de vocabulario: una *task definition* es el plano versionado, una *task* es una instancia en ejecución de ella, un *service* mantiene N tareas corriendo detrás de un balanceador de carga, y un *cluster* es la agrupación lógica de capacidad.',
    hint:
      'Pregúntate quién hace la llamada: el agente de ECS que prepara la tarea, o el código de tu aplicación a través del SDK en tiempo de ejecución.',
  },
  'aws-fargate-vs-ec2-launch-type': {
    prompt:
      'Estás moviendo un conjunto de servicios en contenedores a ECS. ¿Cómo decides entre los launch types **Fargate** y **EC2** (o capacity providers)? Da criterios concretos.',
    modelAnswer:
      '**Fargate** es cómputo serverless para contenedores: declaras CPU y memoria por tarea y AWS la ejecuta en una micro-VM aislada, así que no hay instancias que parchear, escalar ni empaquetar (bin-packing), y cada tarea recibe su propia ENI (red `awsvpc`). Es mi opción por defecto para la mayoría de los servicios web y workers porque elimina toda una capa operativa y escala por tarea. **EC2** tiene sentido cuando necesito cosas que Fargate no me da: GPUs, familias de instancias específicas, tareas muy grandes, acceso a nivel de host o daemons, o cuando una utilización alta y constante hace que el bin-packing en instancias Reserved o con Savings Plan sea notablemente más barato. El costo en EC2 es hacerse cargo del parcheo de AMIs, del auto scaling del cluster mediante capacity providers y del drenado de instancias durante los despliegues. Fargate cuesta más por vCPU-hora y tiene un arranque de tareas más lento (descarga la imagen cada vez, sin caché caliente en el host), pero Fargate Spot y Graviton (ARM) cierran buena parte de la brecha para cargas interrumpibles o listas para ARM. Una mezcla común es Fargate para los servicios y una capacity provider strategy que agrega Spot para batch.',
    rubric: [
      'Explica que Fargate elimina la gestión de instancias (parcheo, escalado, bin-packing) con aislamiento por tarea',
      'Menciona necesidades concretas exclusivas de EC2, como GPUs, acceso al host, daemons o tipos de instancia específicos',
      'Compara costos: el sobreprecio de Fargate frente a EC2 con bin-packing a una utilización alta y constante',
      'Menciona Fargate Spot, Graviton o capacity providers como palancas',
      'Señala el costo operativo de EC2 (parcheo de AMIs, drenado, autoscaling del cluster)',
    ],
    explanation:
      'Señal de senior: plantearlo como "quién es dueño de los hosts" más un argumento de costo según la utilización, no como "Fargate es serverless, así que es mejor".\n\n**Dilo en voz alta:** "Fargate por defecto porque elimina la operación de hosts; EC2 solo cuando necesito GPUs o control a nivel de host, o cuando una utilización constante hace que la capacidad reservada con bin-packing sea claramente más barata."',
    hint:
      'Plantéalo como quién es dueño de los hosts, y luego cubre las necesidades que solo resuelven las instancias, el costo con utilización constante y palancas como Spot, Graviton y capacity providers.',
  },
  'aws-cognito-user-pool-vs-identity-pool': {
    prompt:
      'Una app móvil inicia la sesión de los usuarios con email y contraseña, y luego sube fotos **directamente a S3**, cada usuario limitado a su propio prefijo `users/<id>/`. ¿Qué configuración de Cognito es la correcta?',
    options: {
      a: 'Solo un user pool: S3 acepta su ID token como credencial cuando la bucket policy nombra al user pool como principal federado',
      b: 'Un user pool para autenticar y emitir JWT, más un identity pool que intercambia el token por credenciales temporales de AWS de un rol IAM que limita a cada usuario a un prefijo con el nombre de su identity ID',
      c: 'Solo un identity pool: guarda los usuarios y las contraseñas, emite JWT, y su rol no autenticado ya limita cada dispositivo a su propio prefijo',
      d: 'Un user pool más un Cognito authorizer de API Gateway, que cambia el token validado por permisos sobre S3 que la app luego usa para subir directamente',
    },
    explanation:
      'Los **user pools** son el directorio de usuarios y el proveedor de identidad OIDC: registro, inicio de sesión, MFA, federación con proveedores sociales o SAML, y emiten tokens de ID, de acceso y de refresco (JWT) para *tus* APIs. Los **identity pools** (identidades federadas) no guardan usuarios; toman un token de un user pool o de otro proveedor y llaman a STS para entregar **credenciales temporales de AWS** de un rol IAM, de modo que el cliente pueda llamar directamente a los servicios de AWS. Las variables de política como `${cognito-identity.amazonaws.com:sub}` en la política del rol restringen cada identidad a su propio prefijo. S3 y las demás APIs de servicios de AWS solo aceptan solicitudes firmadas con SigV4, así que un JWT de user pool nunca es una credencial para S3 (solo puertas de entrada como API Gateway y AppSync lo validan), y un authorizer de API Gateway solo protege las rutas de tu API. Ojo: `${cognito-identity.amazonaws.com:sub}` es el identity ID del identity pool (por ejemplo `us-east-1:1a2b...`), no el `sub` del user pool, así que la app debe armar el prefijo `users/<id>/` con el identity ID. A menudo la alternativa más simple es omitir los identity pools y hacer que tu API devuelva presigned URLs.',
    hint:
      'Distingue el servicio que guarda usuarios y emite JWT del que cambia un token por credenciales temporales de AWS, y recuerda qué acepta S3 como credencial.',
  },
};
