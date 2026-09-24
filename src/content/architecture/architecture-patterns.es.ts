// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  'architecture-patterns-layered-dependency-direction': {
    prompt: 'En un backend por capas (controllers → services → repositories), ¿cuál de estas es una **violación de capas**?',
    options: {
      a: 'Un controller parsea la solicitud y llama a `orderService.place(dto)`',
      b: 'Un service llama a `orderRepository.save(order)` dentro de una transacción',
      c: 'Un repository importa el tipo `Request` de Express para leer `req.user.tenantId` en su consulta',
      d: 'Un service lanza `OrderNotFoundError` y el controller lo traduce a un 404',
    },
    explanation:
      'Las dependencias solo deben apuntar **hacia abajo**: presentación → negocio → acceso a datos. Un repository que conoce HTTP acopla la persistencia a un único mecanismo de entrega, así que la misma consulta no se puede reutilizar desde un consumidor de cola o un cron job, y no se puede probar sin simular una solicitud. Pasa `tenantId` como un argumento simple. Lanzar un error de dominio y traducirlo a un código HTTP en el borde es la forma correcta de mantener HTTP fuera de la capa de servicios.',
    hint: 'Sigue la dirección de cada dependencia: ¿qué capa termina conociendo un detalle de una capa superior?',
  },
  'architecture-patterns-hexagonal-ports': {
    prompt: 'En una arquitectura hexagonal (puertos y adaptadores), ¿dónde van la interfaz `OrderRepository` y la clase `PostgresOrderRepository`?',
    options: {
      a: 'Ambas en la capa de infraestructura, porque las dos tratan sobre la base de datos',
      b: 'La interfaz es un puerto que pertenece al núcleo de la aplicación; la clase de Postgres es un adaptador secundario (driven) fuera del núcleo que depende hacia adentro de ese puerto',
      c: 'La interfaz en la capa de infraestructura, y el dominio la importa desde ahí',
      d: 'Ambas dentro del dominio, para que el dominio controle el SQL que necesita',
    },
    explanation:
      'El núcleo define los puertos que necesita, en su propio lenguaje (`findById`, `save`), y no sabe nada de Postgres, HTTP ni Kafka. Los adaptadores viven afuera y dependen hacia adentro: los adaptadores **primarios** (driving), como un controller REST o una CLI, llaman al núcleo; los adaptadores **secundarios** (driven), como el repository de Postgres o un cliente de email, implementan puertos que define el núcleo. Es el principio de inversión de dependencias aplicado a escala de arquitectura, y por eso el núcleo se puede probar con adaptadores en memoria.',
    hint: 'Pregúntate quién es dueño del contrato en puertos y adaptadores, y hacia dónde deben apuntar las flechas de dependencia respecto al núcleo.',
  },
  'architecture-patterns-hexagonal-vs-layered': {
    prompt: 'Compara una arquitectura clásica por capas con la arquitectura hexagonal. ¿Cuándo elegirías cada una para un servicio nuevo en Node/TypeScript?',
    modelAnswer:
      'En una arquitectura clásica por capas, la capa de negocio depende hacia abajo de la capa de datos, así que el dominio suele terminar moldeado por el ORM y la base de datos. La hexagonal invierte eso: el núcleo es dueño de los puertos (interfaces) y toda tecnología es un adaptador que se conecta desde afuera, ya sea primario (driving, como un controller REST que llama al núcleo) o secundario (driven, como un repository de Postgres que implementa un puerto que define el núcleo), de modo que todas las flechas de dependencia apuntan al dominio. Eso te da testabilidad (el núcleo corre contra adaptadores en memoria, sin base de datos para la mayoría de las pruebas), la posibilidad de agregar un segundo punto de entrada, como un consumidor de cola junto a REST, sin duplicar lógica, y una forma limpia de cambiar la infraestructura. El costo son más interfaces, el mapeo entre modelos de dominio y modelos de persistencia, y más ceremonia para un CRUD simple. Yo elegiría una estructura por capas simple para un servicio con mucho CRUD y reglas delgadas, y hexagonal cuando la lógica de dominio es rica, hay varios canales de entrada o es probable que cambie la infraestructura. En NestJS obtengo la mayor parte del beneficio definiendo las interfaces de repository en el módulo de dominio y enlazando las implementaciones con providers.',
    rubric: [
      'Explica la diferencia en la dirección de las dependencias: las capas dependen hacia abajo, la hexagonal apunta todo al núcleo',
      'Nombra los puertos (propiedad del núcleo) y los adaptadores primarios frente a los secundarios',
      'Cita como beneficios concretos la testabilidad con adaptadores en memoria y los múltiples puntos de entrada',
      'Reconoce el costo: mapeo y ceremonia, excesivo para un CRUD delgado',
      'Da una regla de decisión ligada a la complejidad del dominio o al número de canales',
    ],
    explanation:
      'Los entrevistadores buscan la idea de la dirección de las dependencias y una regla de decisión pragmática, no que recites un diagrama. La arquitectura limpia (clean architecture) y la arquitectura cebolla (onion) son variaciones de la misma idea de dependencias hacia adentro.\n\n**Dilo en voz alta:** "La hexagonal es inversión de dependencias a nivel de arquitectura: el dominio es dueño de los puertos y cada tecnología es un adaptador. La uso cuando la lógica de dominio es rica o hay varios puntos de entrada; para un CRUD delgado, basta con capas simples."',
    hint: 'Cubre la dirección de las dependencias en cada estilo, qué te da invertirla (testabilidad, más puntos de entrada), cuánto cuesta y una regla para elegir.',
  },
  'architecture-patterns-bff-purpose': {
    prompt: '¿Qué problema resuelve principalmente el patrón Backend-for-Frontend (BFF)?',
    options: {
      a: 'Una única API de propósito general obliga a cada cliente (móvil, web) a traer datos de más o de menos y a orquestar varias llamadas; un BFF por experiencia de cliente agrega y da forma a los datos para ese cliente',
      b: 'Reemplaza al API gateway para la terminación TLS, la autenticación y el rate limiting',
      c: 'Es el lugar donde poner las reglas de negocio compartidas por todos los clientes para que se mantengan consistentes',
      d: 'Sirve el bundle de JavaScript estático y las imágenes del frontend desde un CDN',
    },
    explanation:
      'Un BFF es una capa delgada del lado del servidor, propiedad de un equipo de frontend (o cercana a él), que llama a los servicios de abajo, agrega y recorta las respuestas, y devuelve exactamente lo que necesita una experiencia, a menudo en un solo viaje de ida y vuelta. Eso importa sobre todo en móvil, donde la latencia y el tamaño del payload duelen. Complementa a un gateway en lugar de reemplazar las responsabilidades transversales del borde, y las reglas de negocio compartidas pertenecen a los servicios de dominio que están detrás: ponerlas en varios BFF duplica lógica que luego diverge. Un servidor de Next.js o una capa GraphQL suelen cumplir el rol de BFF.',
    hint: 'Piensa en lo distinto que una pantalla móvil y una página de escritorio consumen la misma API de propósito general, y quién da forma al payload.',
  },
  'architecture-patterns-bff-design': {
    prompt:
      'Tu app web y una nueva app móvil llaman directamente desde el cliente a cinco microservicios. Las pantallas móviles necesitan una fracción de los datos y sufren en redes lentas. ¿Introducirías un BFF, y cómo lo diseñarías y quién sería su dueño?',
    modelAnswer:
      'Sí, introduciría un BFF por experiencia de cliente (uno para web, uno para móvil) en lugar de una "API para todas las UI" compartida, porque la idea es que cada frontend dé forma a su propio contrato. Cada BFF agrega en paralelo las llamadas que necesita una pantalla, recorta campos y devuelve una sola respuesta, con timeouts por llamada y manejo de fallas parciales para que un servicio lento degrade un widget en vez de la página. Se mantiene delgado: orquestación, mapeo, caché y traducción de sesión a token (manteniendo los tokens fuera del navegador con una sesión en cookie httpOnly), mientras las reglas de negocio se quedan en los servicios de dominio para que no diverjan entre BFF. El equipo dueño del frontend es dueño de su BFF, lo que le permite publicar cambios de UI sin esperar a los equipos de backend. Los riesgos que gestionaría son la lógica duplicada entre BFF, que un BFF crezca hasta ser un monolito y un salto más que operar, así que propagaría correlation IDs y trazaría a través de él, y consideraría GraphQL si muchos clientes necesitan formas flexibles sobre los mismos datos.',
    rubric: [
      'Elige un BFF por experiencia de cliente y explica por qué uno compartido anula el propósito',
      'Describe la agregación con llamadas en paralelo, timeouts y manejo de fallas parciales',
      'Mantiene las reglas de negocio en los servicios de dominio y el BFF delgado',
      'Asigna la propiedad al equipo de frontend',
      'Nombra los riesgos (duplicación, salto extra, BFF inflado) y una mitigación operativa como el tracing',
    ],
    explanation:
      'La señal senior es la propiedad y los límites: un BFF es tanto un patrón organizacional (los equipos de frontend son dueños de su contrato de backend) como uno técnico.\n\n**Dilo en voz alta:** "Un BFF por experiencia, propiedad del equipo de frontend, delgado por diseño: orquesta y da forma a los datos, y las reglas de negocio se quedan en los servicios que tiene detrás."',
    hint: 'Cubre cuántos BFF, qué va dentro de uno frente a los servicios de atrás, qué equipo es su dueño y cómo manejas llamadas lentas o fallidas aguas abajo.',
  },
  'architecture-patterns-event-driven-consequences': {
    prompt:
      'Reemplazas las llamadas REST síncronas de `orders` a `billing`, `shipping` y `email` por un evento `OrderPlaced` en un broker. ¿Cuáles de estas son consecuencias reales de ese cambio? Selecciona todas las que apliquen.',
    options: {
      a: '`orders` ya no falla ni se vuelve lento cuando `email` está caído; el evento espera hasta que email se recupere',
      b: 'Los consumidores deben tolerar entregas duplicadas, así que los handlers tienen que ser idempotentes',
      c: 'El sistema pasa a ser eventualmente consistente: justo después del checkout, shipping puede no saber todavía de la orden',
      d: 'Seguir una solicitud de punta a punta se vuelve más difícil sin correlation IDs y tracing distribuido',
      e: 'Los eventos ahora quedan ordenados globalmente entre todos los topics y partitions',
    },
    explanation:
      'Los eventos te dan **desacoplamiento temporal** (el productor no necesita que los consumidores estén arriba) y permiten que nuevos consumidores se suscriban sin cambiar al productor. El precio es la consistencia eventual, la entrega at-least-once (un consumidor puede caerse después de hacer su trabajo pero antes de confirmar, así que el broker lo vuelve a entregar y los handlers deben ser idempotentes) y una depuración más difícil, porque el flujo ya no es un call stack. Brokers como Kafka solo ordenan los mensajes **dentro de una partition**, nunca de forma global.',
    hint: 'Compara lo que te da un broker (desacoplamiento temporal) con lo que quita: garantías de entrega, consistencia, depuración y dónde se cumple realmente el orden en Kafka.',
  },
  'architecture-patterns-transactional-outbox': {
    prompt:
      "```ts\nawait db.orders.insert(order);\nawait broker.publish('OrderPlaced', order);\n```\nDe vez en cuando el insert hace commit y el publish falla (o el proceso muere entre las dos líneas), así que los servicios de abajo nunca se enteran de la orden. ¿Qué enfoque elimina esta inconsistencia?",
    options: {
      a: 'Intercambiar las dos líneas para que el evento se publique primero',
      b: 'Envolver ambas líneas en un `try/catch` y reintentar el publish tres veces',
      c: 'Transactional outbox: insertar la orden y una fila de outbox en la misma transacción de base de datos, y que un relay publique las filas del outbox y las marque como enviadas',
      d: 'Usar un two-phase commit distribuido entre la base de datos y cada servicio consumidor',
    },
    explanation:
      'Escribir en dos sistemas sin una transacción compartida (el **problema de la doble escritura**, dual write) siempre puede fallar entre las escrituras. Publicar primero solo invierte la falla (un evento de una orden que nunca hizo commit); los reintentos en proceso no sobreviven a un crash. El outbox hace atómicos el cambio de estado y la intención de publicar, porque ambos son filas en una sola transacción local. Luego un relay (por polling o con change data capture, como Debezium) publica con semántica at-least-once, así que los consumidores deben ser idempotentes. El two-phase commit entre servicios es frágil, lento y rara vez lo soportan los brokers.\n\n**Dilo en voz alta:** "No puedes escribir de forma atómica en una base de datos y en un broker, así que escribo el evento en una tabla outbox en la misma transacción y dejo que un relay lo publique at-least-once, con consumidores idempotentes aguas abajo."',
    hint: 'Es el problema de la doble escritura: busca la opción que hace que el cambio de estado y la intención de publicar se confirmen de forma atómica en una sola transacción local.',
  },
  'architecture-patterns-events-vs-commands': {
    prompt: '¿Cuál es la diferencia clave entre los mensajes `PlaceOrder` y `OrderPlaced`?',
    options: {
      a: '`PlaceOrder` es un comando: una solicitud dirigida a un handler que puede rechazarla. `OrderPlaced` es un evento: un hecho inmutable en tiempo pasado al que puede reaccionar cualquier número de suscriptores',
      b: 'Son lo mismo; el nombre es solo una convención del equipo',
      c: '`OrderPlaced` se envía de forma síncrona por HTTP y `PlaceOrder` de forma asíncrona por un broker',
      d: '`PlaceOrder` puede tener muchos consumidores, mientras que `OrderPlaced` debe tener exactamente uno',
    },
    explanation:
      'Un comando expresa **intención** y acopla al emisor con un receptor específico que es dueño de la decisión (puede decir que no). Un evento anuncia algo que **ya ocurrió**; al publicador no le importa ni sabe quién escucha, y eso es lo que hace gratis agregar un suscriptor nuevo (puntos de lealtad, analítica). Ambos pueden viajar por colas o por HTTP; el transporte no define la semántica. Nombrar los eventos en tiempo pasado mantiene visible la distinción en las revisiones de código.',
    hint: 'Fíjate en el tiempo verbal de cada nombre, y pregúntate quién decide el resultado y cuántos receptores espera cada mensaje.',
  },
};
