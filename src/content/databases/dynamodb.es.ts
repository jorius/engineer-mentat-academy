// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  'dynamodb-valid-key-condition': {
    prompt:
      'Una tabla tiene partition key `PK` y sort key `SK`. ¿Qué `KeyConditionExpression` es válida para un `Query` (no un `Scan`)?',
    explanation:
      'Un `Query` debe apuntar exactamente a una partición con **igualdad** sobre la partition key, porque la partition key se pasa por un hash para encontrar la partición de almacenamiento; no hay un orden sobre el que hacer una búsqueda por prefijo o por rango, así que `begins_with(PK, ...)` no es válido. La sort key se guarda ordenada dentro de una partición, así que admite `=`, `<`, `<=`, `>`, `>=`, `BETWEEN` y `begins_with`. `contains` no es una condición de clave; solo se permite en una `FilterExpression`, que se ejecuta después de leer los items. Consultar solo por sort key (`SK = :sk`) requiere un GSI que tenga ese atributo como partition key, o un `Scan`.',
  },
  'dynamodb-gsi-vs-lsi': {
    prompt: '¿Qué afirmaciones sobre los índices secundarios de DynamoDB son verdaderas? Selecciona todas las que apliquen.',
    options: {
      a: 'Un local secondary index (LSI) solo se puede definir al crear la tabla.',
      b: 'Un global secondary index (GSI) admite lecturas fuertemente consistentes si pasas `ConsistentRead: true`.',
      c: 'Un LSI conserva la partition key de la tabla base y ofrece una sort key alternativa.',
      d: 'En una tabla con un LSI, todos los items que comparten un mismo valor de partition key (la item collection, incluidas las entradas del índice) tienen un tope de 10 GB.',
      e: 'Los valores de clave de un GSI deben ser únicos entre items, como una restricción de unicidad.',
    },
    explanation:
      'Un LSI es "local" porque vive en la misma partición que los items base: misma partition key, otra sort key, solo se crea junto con la tabla y agrega el límite de 10 GB por item collection. Un GSI tiene su propia partition key y sort key, se puede agregar o quitar en cualquier momento, tiene su propia capacidad y se replica de forma asíncrona, así que sus lecturas son **solo eventualmente consistentes** y la afirmación de `ConsistentRead: true` es falsa. Las claves de un GSI no son únicas, así que la afirmación de la restricción única también es falsa: muchos items pueden compartir la misma partition key y sort key del GSI, y DynamoDB no tiene restricciones de unicidad más allá de la primary key (la unicidad se emula con un put condicional sobre un item aparte dentro de una transacción). Un GSI con capacidad insuficiente también puede provocar throttling en las escrituras a la tabla base.',
  },
  'dynamodb-filter-after-limit': {
    prompt:
      "Un `Query` sobre los pedidos de un cliente usa `Limit: 10` y `FilterExpression: '#status = :shipped'`. Devuelve 3 items y un `LastEvaluatedKey`, aunque el cliente tiene 40 pedidos enviados. ¿Por qué?",
    options: {
      a: '`Limit` limita la cantidad de items **leídos** antes de aplicar el filtro; se leyeron 10 items, 3 coincidieron y el resto se debe traer en las páginas siguientes.',
      b: 'El filtro se aplicó sobre una réplica eventualmente consistente que todavía no había recibido los demás pedidos enviados.',
      c: 'DynamoDB devuelve como máximo 3 items cuando hay una `FilterExpression`, a menos que subas el límite en la tabla.',
      d: '`LastEvaluatedKey` significa que la consulta alcanzó el límite de página de 1 MB, así que el filtro se omitió para el resto de los items.',
    },
    explanation:
      'DynamoDB lee los items que cumplen la condición de clave, se detiene al llegar a `Limit` items o a 1 MB, y luego aplica la `FilterExpression` a esa página. Pagas capacidad de lectura por todo lo leído, no por lo que conserva el filtro. Por eso un filtro es una comodidad, no un patrón de acceso: si "pedidos enviados de un cliente" es una consulta real, pon el estado en la clave (por ejemplo `SK = ORDER#SHIPPED#<date>`, o un GSI con clave por estado). Itera siempre sobre `LastEvaluatedKey` hasta que ya no aparezca.',
  },
  'dynamodb-order-keys-builder': {
    prompt:
      'Una tabla de pedidos (single-table design) debe atender dos patrones de acceso:\n\n1. Los pedidos de un cliente, del más reciente al más antiguo, opcionalmente dentro de un rango de fechas.\n2. Todos los pedidos en un estado dado, de todos los clientes, dentro de un rango de fechas (mediante `GSI1`).\n\nImplementa `solution(order)` para que devuelva los cuatro atributos de clave:\n\n- `PK`: `CUSTOMER#<customerId>`\n- `SK`: `ORDER#<createdAt>#<orderId>`\n- `GSI1PK`: `STATUS#<status>`, con el estado en mayúsculas\n- `GSI1SK`: `<createdAt>#<orderId>`\n\n`createdAt` es un string ISO-8601 en UTC. Como las claves se comparan como strings, `orderId` (un número) debe **rellenarse con ceros a la izquierda hasta 8 dígitos**.',
    explanation:
      "Las sort keys se comparan byte a byte, así que `'10' < '9'`; el relleno con ceros hace que los ids numéricos se ordenen numéricamente, y los timestamps ISO-8601 en UTC ya se ordenan cronológicamente. Con estas claves, el patrón 1 es `Query PK = 'CUSTOMER#c-42' AND begins_with(SK, 'ORDER#')` con `ScanIndexForward: false` para ver primero los más recientes, o `SK BETWEEN 'ORDER#2026-09-01' AND 'ORDER#2026-09-30~'` para un rango. El patrón 2 es un `Query` sobre `GSI1` con `GSI1PK = 'STATUS#SHIPPED'` y un rango sobre `GSI1SK`. El prefijo `ORDER#` deja espacio para otros tipos de entidad (perfil, direcciones) en la misma partición. Cuidado con el GSI: un estado tiene pocos valores distintos, así que `STATUS#PENDING` puede convertirse en una partición caliente a escala; divídelo en shards (`STATUS#PENDING#3`) o vuelve el índice sparse escribiendo `GSI1PK` solo para los estados que realmente consultas.",
  },
  'dynamodb-hot-partition-throttling': {
    prompt:
      'Una tabla de ingesta de eventos usa la fecha del evento (`2026-09-23`) como partition key y un UUID como sort key. La tabla está en modo on-demand y el tráfico total está muy por debajo de los límites de la cuenta, pero aun así las escrituras sufren throttling todas las tardes. Explica qué está pasando y cómo lo arreglarías.',
    modelAnswer:
      'Todas las escrituras del día caen en una sola partition key, y un único valor de partition key lo atiende una sola partición física, que soporta unas 1,000 unidades de escritura y 3,000 unidades de lectura por segundo, sin importar cuánta capacidad tenga la tabla en total. El modo on-demand y la adaptive capacity redistribuyen el throughput entre particiones, y el split for heat puede terminar repartiendo los items de una clave entre varias particiones según la sort key (solo en tablas sin LSI), pero necesita minutos de carga sostenida, no está garantizado y cada fecha nueva es una clave nueva que empieza en una sola partición; por eso cada pico de la tarde choca con el límite por partición antes de que la tabla se adapte. La solución es una clave de mayor cardinalidad. Si los eventos se leen por origen, usa `sourceId` (o el id del tenant) como partition key y el timestamp como sort key. Si la fecha realmente es el patrón de acceso, usa write sharding: `PK = 2026-09-23#<n>`, con `n` elegido al azar o con un hash del id del evento sobre, por ejemplo, 10 a 20 shards, y lee un día con una consulta en paralelo sobre todos los shards, combinada por timestamp. Hacer hash del id del evento permite calcular el shard para lecturas puntuales. Confirmaría el diagnóstico con CloudWatch Contributor Insights para DynamoDB, que muestra las claves más accedidas, antes de cambiar el modelo.',
    rubric: [
      'Identifica la partición caliente: un valor de clave está limitado por el throughput por partición (unas 1,000 WCU / 3,000 RCU)',
      'Explica que no se puede contar con el modo on-demand, la adaptive capacity ni el split for heat para superar el límite por clave (reaccionan lento, no están garantizados y una clave de fecha nueva empieza en frío)',
      'Propone una partition key de mayor cardinalidad o write sharding con un sufijo',
      'Describe el costo del sharding en las lecturas (consultas scatter-gather combinadas en la aplicación)',
      'Menciona confirmarlo con CloudWatch Contributor Insights o con las métricas de throttling',
    ],
    explanation:
      'La trampa es pensar que la capacidad es un número a nivel de tabla. El throughput se reparte entre particiones según el hash de la partition key, así que una clave de baja cardinalidad concentra la carga sin importar cuánta capacidad tenga aprovisionada la tabla.\n\n**Dilo en voz alta:** "La capacidad es por partición, no por tabla: una fecha como partition key pone un día entero en una sola clave, así que subo la cardinalidad o hago sharding de la clave, y lo pago con una lectura scatter-gather."',
  },
  'dynamodb-single-table-design-tradeoffs': {
    prompt: '¿Qué es el single-table design en DynamoDB, por qué se usa y cuándo **no** lo usarías?',
    modelAnswer:
      'El single-table design guarda varios tipos de entidad (clientes, pedidos, líneas de pedido) en una sola tabla con atributos de clave genéricos como `PK` y `SK`, para que los items relacionados compartan partición: `PK = CUSTOMER#42` contiene el item del perfil y los items `ORDER#...`. Así, un solo `Query` puede devolver un cliente junto con sus pedidos recientes, lo que reemplaza los joins que DynamoDB no tiene, y los GSI sobrecargados (`GSI1PK`/`GSI1SK` con un significado distinto según la entidad) atienden los demás patrones de acceso. Exige listar todos los patrones de acceso de antemano y diseñar las claves para ellos, que es a la vez su principal fortaleza y su principal costo. Lo evitaría, o usaría unas pocas tablas, cuando los patrones de acceso todavía están cambiando (etapas tempranas del producto), cuando las entidades se consultan casi siempre por separado y la co-ubicación no aporta nada, cuando el equipo no domina el modelo (la tabla es difícil de leer y depurar), o cuando importan la analítica y las consultas ad hoc (exportar a S3 y consultar con Athena, o usar una base de datos relacional). Herramientas como los resolvers de GraphQL, que traen un solo tipo de entidad por resolver, también sacan poco provecho de la co-ubicación. Agregar un nuevo patrón de acceso más adelante suele implicar hacer backfill de nuevos atributos de clave en los items existentes.',
    rubric: [
      'Explica cómo se ubican distintos tipos de entidad bajo una misma partition key para que un solo `Query` traiga items relacionados (datos pre-unidos)',
      'Menciona los atributos de clave genéricos y sobrecargados, y los GSI',
      'Indica que los patrones de acceso deben conocerse de antemano y que los nuevos pueden requerir backfills',
      'Da casos concretos en contra: requisitos cambiantes, acceso independiente a las entidades, analítica o consultas ad hoc, familiaridad del equipo',
    ],
    explanation:
      'El modelado en DynamoDB se hace al revés, partiendo de las consultas. El single-table design es la conclusión lógica de ese enfoque, pero es una optimización para patrones de acceso conocidos, estables y críticos en latencia, no una regla por defecto. Incluso la guía de AWS presenta hoy los diseños con varias tablas como válidos cuando las entidades se acceden de forma independiente.\n\n**Dilo en voz alta:** "El single-table design pre-une los datos al compartir una partition key, así que vale la pena cuando conozco mis patrones de acceso y necesito items relacionados en una sola consulta; cuando los patrones todavía se mueven o necesito consultas ad hoc, uso tablas separadas o una base de datos relacional."',
  },
};
