// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  'graphql-over-under-fetching': {
    prompt:
      'Una pantalla móvil muestra el nombre de un usuario y los títulos de sus últimas 3 órdenes. Con la API REST llama a `GET /users/7` (devuelve 40 campos) y luego a `GET /users/7/orders` (devuelve las órdenes completas con sus líneas). ¿Qué problemas resuelve una query GraphQL como esta?\n\n```plain\n{\n  user(id: 7) {\n    name\n    orders(last: 3) {\n      title\n    }\n  }\n}\n```',
    options: {
      a: 'Solo el over-fetching: el cliente recibe menos campos, pero sigue necesitando dos viajes de ida y vuelta',
      b: 'Tanto el over-fetching (campos innecesarios) como el under-fetching (viajes de ida y vuelta extra), porque el cliente selecciona exactamente los campos y los datos anidados que necesita en una sola petición',
      c: 'Ninguno; GraphQL solo cambia el transporte de JSON a un formato binario',
      d: 'Solo el under-fetching; el servidor sigue enviando todos los campos del tipo usuario',
    },
    explanation:
      '**Over-fetching**: el endpoint devuelve más de lo que necesita la pantalla (40 campos del usuario, líneas completas), lo que desperdicia ancho de banda, algo que importa en móvil. **Under-fetching**: un endpoint no devuelve lo suficiente, así que el cliente hace viajes de ida y vuelta extra (usuario, luego órdenes), lo que suma latencia.\n\nEn GraphQL el **cliente declara la forma** de la respuesta y el servidor resuelve los campos anidados en una sola petición, así que ambos problemas desaparecen desde el punto de vista del cliente. El trabajo no se esfuma; se mueve al servidor, donde los resolvers anidados pueden causar consultas N+1 a menos que agrupes en batch. GraphQL sigue siendo JSON sobre HTTP (normalmente POST); la idea de que cambia a un transporte binario describe gRPC/protobuf, no GraphQL.',
    hint: 'Define over-fetching y under-fetching en el flujo REST, y luego revisa qué cambia un selection set anidado en los campos y los viajes de ida y vuelta.',
  },
  'graphql-dataloader-per-request-context': {
    prompt:
      'Los resolvers reciben `(parent, args, context, info)`. Agregas un DataLoader para los registros `User` (agrupa en batch y **cachea** por id). ¿Dónde debería crearse la instancia del DataLoader?',
    options: {
      a: 'Una sola vez a nivel de módulo, para que todas las peticiones compartan el caché y la tasa de aciertos sea la más alta',
      b: 'En la factory del context, para que cada petición entrante reciba instancias nuevas de los loaders',
      c: 'Dentro de cada field resolver, justo antes de llamar a `load`',
      d: 'En `info`, porque contiene la query parseada y puede ver todos los ids solicitados',
    },
    explanation:
      '`context` es el objeto por petición que comparten todos los resolvers de una operación: ahí viven el usuario autenticado, los handles de la base de datos y los loaders. Crear los loaders ahí acota tanto la **ventana de batch** como el **caché de memoización** a una sola petición.\n\n- **A nivel de módulo** es el distractor peligroso: un caché compartido nunca se invalida (datos obsoletos después de las escrituras), crece sin límite y puede servirle a un usuario datos cargados con los permisos de otro.\n- **Dentro de cada field resolver** se crea un loader nuevo por cada llamada a un campo, así que no hay nada con qué agrupar y el N+1 vuelve.\n- **`info`** es el AST de la query y metadatos del schema, no un lugar para estado por petición.\n\nPara un caché entre peticiones, pon Redis (o caché HTTP) *debajo* del loader, con TTLs e invalidación explícitos.',
    hint: 'DataLoader cachea por id: piensa en quién podría ver un registro cacheado si ese caché sobreviviera a una petición, y qué argumento del resolver se construye una vez por petición.',
  },
  'graphql-n-plus-one-batching-predict': {
    prompt:
      'Esto simula resolver `posts { author { id } }` dos veces: una con una búsqueda ingenua por post y otra a través de un DataLoader mínimo que recolecta las keys durante el tick actual y despacha un solo batch. `queries` cuenta los viajes de ida y vuelta a la base de datos. ¿Qué imprime, una línea por log?',
    explanation:
      'Ingenuo: 1 consulta para la lista de posts + 1 consulta **por post** para su autor = 1 + 4 = **5**. Ese es el problema N+1, y en GraphQL ocurre por defecto porque cada resolver del campo `author` se ejecuta de forma independiente y no sabe nada de sus hermanos.\n\nCon batch: las cuatro llamadas a `loadAuthor` ocurren de forma síncrona dentro de `posts.map`. La primera llamada programa un despacho en la cola de microtareas; las siguientes solo se encolan. La key repetida `10` encuentra el caché de memoización y devuelve la misma promesa, así que el batch queda deduplicado en `[10,20,30]`. Resultado: 1 + 1 = **2** consultas, sin importar el número de posts. El paquete real `dataloader` hace lo mismo (programa el despacho después del tick actual de trabajos de promesas).\n\n**Dilo en voz alta:** "Los field resolvers son independientes, así que las listas anidadas producen consultas N+1; DataLoader lo resuelve recolectando cada key pedida en el mismo tick, deduplicando y emitiendo una sola consulta `WHERE id IN (...)`, con un loader por petición."',
    hint: 'Cuenta un viaje para la lista más uno por elemento en el camino ingenuo; en el camino por lotes, pregúntate cuántas claves se juntan antes de que termine el tick.',
  },
  'graphql-batch-function-contract': {
    prompt:
      'Una batch function de DataLoader recibe `keys` y debe devolver un array del **mismo largo y en el mismo orden**, una entrada por key. Tu consulta a la base de datos `SELECT * FROM authors WHERE id IN (...)` devuelve `rows` en orden arbitrario, sin duplicados, y omite los ids que no existen.\n\nImplementa `solution(keys, rows)` para que devuelva las filas alineadas con `keys`, con `null` para los ids faltantes. Las keys duplicadas reciben cada una la fila.',
    explanation:
      'DataLoader resuelve la promesa de `keys[i]` con `result[i]`. Si devuelves las filas tal cual, un id faltante desplaza en uno todos los resultados siguientes y **los autores quedan asociados a los posts equivocados**, un bug silencioso de datos en lugar de un crash (DataLoader solo lanza un error cuando los largos difieren).\n\nIndexa las filas en un `Map` (O(n + k)) en lugar de llamar a `rows.find` por cada key (O(n * k)). Devuelve `null` para un registro faltante, o una instancia de `Error` si esa key debe rechazarse individualmente.',
    hint: 'Indexa las filas en un `Map` por id y luego recorre `keys` con map para que el orden y la longitud sigan a las claves, no a las filas.',
  },
  'graphql-operational-costs': {
    prompt: 'Tu equipo está migrando una API REST pública a GraphQL. ¿Cuáles de estos son **costos operativos reales** que asumes? Selecciona todos los que apliquen.',
    options: {
      a: 'El caché HTTP/CDN se vuelve más difícil: la mayoría de las queries son `POST /graphql`, así que el caché basado en URL deja de funcionar sin persisted queries o queries por GET',
      b: 'Los errores suelen llegar como `200 OK` con un array `errors`, así que el monitoreo y las alertas basados en códigos de estado no los detectan',
      c: 'Una sola petición puede ser arbitrariamente costosa (anidamiento profundo, listas enormes), así que necesitas límites de profundidad/complejidad en lugar de un simple rate limiting por endpoint',
      d: 'Los resolvers anidados producen consultas N+1 a la base de datos a menos que agregues batching',
      e: 'Ya no puedes evolucionar el schema sin versionar el endpoint como `/v2/graphql`',
    },
    explanation:
      '**Caché HTTP/CDN más difícil**: los GET de REST se pueden cachear por URL en todas las capas (navegador, CDN, reverse proxy). Un único endpoint POST anula eso; las persisted queries (un hash en lugar de la query completa) recuperan el caché por GET.\n\n**Errores dentro de `200 OK`**: el éxito parcial es normal en GraphQL (`data` más `errors`), así que monitoreas el array `errors` y las métricas a nivel de resolver, no solo los códigos HTTP.\n\n**Peticiones arbitrariamente costosas**: "peticiones por minuto" significa poco cuando una sola query puede expandirse a millones de filas. Agregas límites de profundidad de query, análisis de costo, topes de paginación y, para APIs públicas, allowlists de persisted queries.\n\n**Consultas N+1**: cada field resolver anidado se ejecuta por su cuenta, así que una lista de posts dispara una búsqueda de autor por post a menos que un DataLoader por petición las agrupe en una sola consulta `WHERE id IN (...)`.\n\nLo de `/v2/graphql` es falso: las APIs GraphQL normalmente evolucionan **sin** versiones. Agregas campos libremente y marcas los viejos como obsoletos con `@deprecated`, y luego los eliminas cuando la telemetría de uso por campo muestra que ningún cliente los usa.',
    hint: 'Para cada punto, revisa el mecanismo detrás: cómo los cachés usan la URL como clave, cómo se reportan los errores, cómo se acota el costo, cómo leen los resolvers y cómo evolucionan los schemas.',
  },
  'graphql-when-wrong-choice': {
    prompt: 'Un líder técnico propone GraphQL para todos los servicios nuevos, incluidas las llamadas internas entre servicios y un catálogo de productos público, mayormente de lectura. ¿Cuándo es GraphQL la opción **equivocada** y qué usarías en su lugar?',
    modelAnswer:
      'GraphQL vale la pena cuando muchos clientes distintos (web, móvil, partners) necesitan formas diferentes de datos ricos y anidados y quieres evolucionar un solo schema sin versiones; una capa de agregación tipo BFF es su punto fuerte. Para un catálogo público con mucha lectura, REST suele ser mejor: los recursos se mapean de forma natural a URLs, y las respuestas GET se pueden cachear en la CDN y el navegador con `Cache-Control` y ETags, algo que GraphQL pierde sin persisted queries. Para las llamadas internas entre servicios, gRPC da contratos tipados, codificación binaria, deadlines y streaming, y la flexibilidad de consulta que ofrece GraphQL no hace falta entre dos servicios que son tuyos. GraphQL también tiene un costo: los resolvers N+1 necesitan DataLoader, las queries arbitrarias necesitan límites de profundidad y complejidad, los errores se esconden dentro de respuestas `200`, y la subida de archivos y los webhooks simples son incómodos. Así que elegiría por frontera: GraphQL (o un BFF) en el borde para las UIs de producto, REST para recursos públicos cacheables y CRUD, gRPC o eventos entre servicios.',
    rubric: [
      'Nombra dónde encaja GraphQL: muchos clientes con necesidades de datos distintas, datos anidados, evolucionar un solo schema',
      'Explica la pérdida del caché HTTP y por qué REST encaja en un catálogo público con mucha lectura',
      'Propone gRPC (o eventos asíncronos) para el tráfico interno entre servicios',
      'Enumera los costos operativos de GraphQL: N+1, límites de costo de las queries, errores en respuestas 200',
      'Elige por frontera en lugar de un solo estilo para todo',
    ],
    explanation:
      'El entrevistador está evaluando si puedes argumentar **en contra** de una tecnología de moda con mecanismos concretos (caché HTTP, RPC binario tipado, control del costo de las queries) en lugar de gustos.\n\n| Estilo | Fortaleza | Úsalo cuando |\n|---|---|---|\n| REST | Simple, cacheable, omnipresente | APIs públicas y CRUD |\n| GraphQL | El cliente elige los campos, un solo viaje de ida y vuelta | Muchos clientes, datos anidados, móvil |\n| gRPC | Binario rápido, streaming, contratos estrictos | Comunicación interna entre servicios |\n\n**Dilo en voz alta:** "Elijo el estilo de API por frontera: GraphQL en el borde del producto, donde muchos clientes necesitan formas distintas, REST donde importan el caché HTTP y la simplicidad, y gRPC o eventos entre servicios que son míos."',
    hint: 'Argumenta con mecanismos: caché HTTP/CDN, RPC binario tipado entre servicios, control del costo de las queries y quiénes consumen la API. Nombra qué usarías en cada caso.',
  },
};
