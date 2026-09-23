// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  'nosql-document-store-fit': {
    prompt: '¿Qué carga de trabajo encaja de forma más natural en una base de datos documental como MongoDB?',
    options: {
      a: 'Un catálogo de productos donde cada categoría tiene atributos distintos y la página de un producto lee ese producto con sus variantes y especificaciones en una sola petición.',
      b: 'Un libro contable de partida doble donde cada transferencia debe debitar una cuenta y acreditar otra de forma atómica.',
      c: 'Una carga de BI donde los analistas escriben consultas ad hoc que unen diez tablas de maneras que nadie previó.',
      d: 'Una recomendación de amigos de amigos que recorre relaciones hasta cuatro saltos de profundidad.',
    },
    explanation:
      'Los document stores brillan cuando la unidad que lees y escribes es un agregado autocontenido y de forma variable: un documento guarda el producto, sus variantes y sus especificaciones, así que la página se resuelve con una sola lectura y sin joins. El libro contable (b) necesita invariantes ACID sobre varias filas y restricciones, el terreno natural de una base de datos relacional (MongoDB tiene transacciones multidocumento, pero no son su punto fuerte). La analítica ad hoc (c) pide SQL y un data warehouse columnar. Recorrer relaciones de varios saltos (d) es justo para lo que están hechas las bases de datos de grafos como Neo4j o Neptune.',
  },
  'nosql-store-families': {
    prompt: '¿Qué combinación de familia NoSQL y caso de uso es la más adecuada?',
    options: {
      a: 'Key-value store (Redis) para sesiones, caché y contadores de rate limiting con TTL.',
      b: 'Base de datos de grafos (Neo4j) para lecturas de sensores de alto volumen con marca de tiempo, consultadas por rango de tiempo.',
      c: 'Wide-column store (Cassandra) para unir entidades arbitrarias en reportes ad hoc.',
      d: 'Document store (MongoDB) para contadores atómicos de menos de un milisegundo compartidos por todas las instancias de la API.',
    },
    explanation:
      'Redis es un key-value store en memoria con TTL por clave y operaciones atómicas como `INCR`, que es justo lo que necesitan las sesiones, las cachés y los rate limiters. La ingesta de series de tiempo (b) encaja en un wide-column store como Cassandra o en una base de datos de series de tiempo, con clave por dispositivo y bloque de tiempo. Los wide-column stores (c) se diseñan en torno a consultas conocidas y no tienen joins. Los document stores (d) pueden guardar contadores, pero un contador compartido y muy disputado con latencia de menos de un milisegundo es trabajo de un key-value store.',
  },
  'nosql-schemaless-myth': {
    prompt:
      'Un compañero dice: "elegimos una base de datos NoSQL, así que nunca vamos a necesitar migraciones de esquema". ¿Cuál es la respuesta más precisa?',
    options: {
      a: 'Correcto: sin un esquema declarado, los documentos viejos y los nuevos son igual de válidos y no hay nada que cambiar.',
      b: 'El esquema sigue existiendo; se movió de la base de datos a la aplicación (schema-on-read). Las formas antiguas de los documentos se deben manejar en el código o migrar, por ejemplo con un campo de versión y migraciones perezosas o de backfill.',
      c: 'Las migraciones solo hacen falta si agregas índices secundarios; los cambios de campos siempre son gratis.',
      d: 'Las bases de datos NoSQL rechazan los documentos cuya forma difiere del primer documento insertado, así que las migraciones se aplican automáticamente.',
    },
    explanation:
      '"Schemaless" significa que la base de datos no impone el esquema; cada lector sigue asumiendo uno. Después de renombrar un campo, los documentos viejos conservan el nombre anterior para siempre a menos que los migres, así que el código tiene que manejar ambas formas. Patrones comunes: un campo `schemaVersion` con actualizaciones al leer, migración perezosa al escribir o un backfill en segundo plano. MongoDB también puede imponer validación con JSON Schema por colección cuando quieres recuperar esa protección. La flexibilidad es real, pero es una decisión sobre dónde imponer el esquema, no la ausencia de uno.',
  },
  'nosql-cap-and-pacelc': {
    prompt: '¿Qué afirmación sobre el teorema CAP es correcta?',
    options: {
      a: 'Una base de datos distribuida elige dos cualesquiera entre consistencia, disponibilidad y tolerancia a particiones, y mantiene esa elección en todo momento.',
      b: 'Durante una partición de red, un sistema debe elegir entre consistencia y disponibilidad; cuando no hay partición, el trade-off práctico es latencia contra consistencia (PACELC).',
      c: 'Las bases de datos NoSQL son AP y las relacionales son CA, y por eso las bases de datos relacionales no escalan horizontalmente.',
      d: 'La consistencia en CAP significa lo mismo que la C de ACID: las transacciones preservan las restricciones de integridad.',
    },
    explanation:
      'En una red real las particiones no son opcionales, así que "CA" no es una opción para un sistema distribuido. CAP solo obliga a decidir mientras ocurre una partición: rechazar algunas peticiones (CP) o responder con datos posiblemente desactualizados (AP). PACELC agrega el caso cotidiano: si no hay partición (la "E" de else), cambias latencia por consistencia. Los productos son configurables en lugar de etiquetas fijas: las lecturas de DynamoDB son eventualmente consistentes por defecto y fuertemente consistentes si lo pides; Cassandra decide por consulta con niveles de consistencia; MongoDB usa read concerns y write concerns. La consistencia de CAP significa linealizabilidad, que no tiene relación con la consistencia de ACID.\n\n**Dilo en voz alta:** "CAP solo aprieta durante una partición, y ahí elijo entre rechazar peticiones o servir datos desactualizados; el resto del tiempo el verdadero trade-off es latencia contra consistencia, y la mayoría de los stores modernos me dejan ajustarlo por petición."',
  },
  'nosql-embed-vs-reference': {
    prompt:
      'En una base de datos documental, ¿cómo decides si embeber los datos relacionados dentro de un documento o guardarlos aparte y referenciarlos por id? Usa como ejemplo los posts de un blog y sus comentarios.',
    modelAnswer:
      'Modelo en torno a los patrones de acceso: los datos que se leen juntos y cambian juntos se embeben, y los datos que crecen sin límite o se leen de forma independiente se referencian. Embeber da una sola lectura y una escritura atómica sobre un solo documento, pero duplica datos y el documento no deja de crecer. En un blog, el nombre y el avatar del autor se pueden embeber como una instantánea en el post, mientras que el perfil del autor vive en su propia colección. Los comentarios son la trampa clásica: un post popular puede tener decenas de miles, así que un arreglo embebido sin límite chocará con el límite de tamaño del documento (16 MB en MongoDB, 400 KB por item en DynamoDB) y hará más pesada cada lectura y escritura del post. Guardaría los comentarios en su propia colección con clave por id del post y un timestamp, y opcionalmente embebería en el post los últimos comentarios y un contador para el primer render (el subset pattern). Las copias desnormalizadas necesitan una estrategia de actualización: aceptar que queden desactualizadas o hacer una actualización en fan-out cuando cambia la fuente.',
    rubric: [
      'Decide a partir de los patrones de acceso (se leen juntos, cambian juntos) y no solo de las relaciones entre entidades',
      'Identifica el crecimiento sin límite y el límite de tamaño del documento como la razón para no embeber todos los comentarios',
      'Propone un enfoque híbrido, como embeber un subconjunto acotado o un resumen y referenciar el conjunto completo',
      'Explica cómo se mantienen sincronizados los datos duplicados o acepta de forma explícita que queden desactualizados',
    ],
    explanation:
      'El modelado relacional normaliza primero y optimiza después; el modelado documental parte de las consultas. La pregunta de seguimiento clave es "qué pasa cuando este arreglo llega a 50,000 entradas", y la respuesta debería incluir un embebido acotado más una colección separada.',
  },
  'nosql-polyglot-persistence-design': {
    prompt:
      'Estás diseñando el backend de un e-commerce con checkout y pagos, un catálogo de productos con atributos específicos por categoría, un carrito de compras y un feed de actividad por usuario. ¿Qué almacenamiento elegirías para cada parte, y cuándo te opondrías a usar más de una base de datos?',
    modelAnswer:
      'Los pedidos y los pagos van en una base de datos relacional (Postgres, o RDS/Aurora en AWS): necesitan transacciones sobre varias filas, foreign keys, restricciones de unicidad para las idempotency keys y reportes ad hoc. El catálogo también puede vivir en Postgres, usando `JSONB` para los atributos específicos por categoría con un índice GIN; lo movería a un document store solo si su volumen de lecturas o la frecuencia de cambios en su esquema lo justificaran claramente, y la búsqueda va a OpenSearch, alimentado con change data capture. El carrito son datos key-value de vida corta que se leen por id de usuario, así que encaja Redis con un TTL o DynamoDB con clave por usuario, siempre que perder un carrito abandonado sea aceptable. El feed de actividad tiene muchas escrituras de tipo append y se lee por usuario y por tiempo, lo que encaja en DynamoDB o Cassandra con el usuario como partition key y un timestamp como sort key. Me opongo a sumar bases de datos cuando el equipo es pequeño o la carga es moderada: cada store nuevo agrega operación, backups, revisión de seguridad y una frontera de consistencia donde los datos se deben sincronizar mediante eventos o un outbox. Empezar con Postgres para todo y separar un store cuando un patrón de acceso concreto o un límite de escala lo exija suele ser la decisión senior.',
    rubric: [
      'Mantiene el dinero y el estado de los pedidos en un store relacional transaccional y explica por qué (ACID, restricciones)',
      'Asocia cada uno de los otros stores a un patrón de acceso concreto (carrito key-value, feed ordenado por tiempo, catálogo flexible)',
      'Menciona que `JSONB` de Postgres puede cubrir esquemas flexibles antes de agregar una base de datos documental',
      'Nombra el costo operativo y de consistencia de la persistencia políglota (sincronización por CDC u outbox, backups, guardias)',
      'Defiende empezar simple y separar con base en evidencia',
    ],
    explanation:
      'Los entrevistadores evalúan criterio, no conocimiento de productos: cada elección debe justificarse con un patrón de acceso o una garantía, y hay que nombrar el costo de cada datastore adicional.\n\n**Dilo en voz alta:** "Elijo el store según el patrón de acceso y la garantía: el dinero necesita transacciones, los feeds necesitan escrituras baratas ordenadas por tiempo; pero cada base de datos extra es otra frontera de consistencia que operar, así que empiezo con Postgres y separo con base en evidencia."',
  },
};
