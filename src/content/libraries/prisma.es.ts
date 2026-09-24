// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  'prisma-select-vs-include': {
    prompt: '¿Qué query de Prisma devuelve el `email` de cada usuario y sus `posts`, y **ningún otro** campo de `User`?',
    explanation: '`select` enumera exactamente lo que se devuelve, y una relación dentro de `select` también se carga. `include` significa "todos los campos escalares **más** estas relaciones". Los dos no se pueden usar en el mismo nivel (combinarlos es un error de validación), e `include` solo acepta relaciones, así que `include: { email: true }` falla. La consulta con `where: { posts: { some: {} } }` filtra a los usuarios con posts pero devuelve solo los emails. Seleccionar solo los campos que necesitas también mantiene los secretos como `passwordHash` fuera de las respuestas de la API, y los tipos generados siguen la selección.',
    hint: 'Recuerda qué devuelve `include` por defecto y si `select` e `include` pueden compartir el mismo nivel.',
  },
  'prisma-migrate-deploy': {
    prompt: '¿Qué comando del CLI de Prisma va en el pipeline de despliegue a producción?',
    explanation: '`migrate deploy` aplica las migraciones commiteadas que todavía no se han ejecutado, las registra en `_prisma_migrations` y nunca genera migraciones nuevas ni reinicia nada. `migrate dev` es para desarrollo: usa una shadow database, crea migraciones nuevas a partir de las diferencias del schema y puede ofrecerte **reiniciar** la base de datos. `db push` sincroniza el schema sin ningún historial de migraciones, lo que está bien para prototipos y es peligroso para datos compartidos. `migrate reset` borra la base de datos. Una migración fallida en producción se resuelve con `prisma migrate resolve` después de corregirla a mano, no reiniciando.',
    hint: 'Piensa en qué comandos pueden crear migraciones, borrar datos o saltarse el historial, y cuál es seguro ejecutar sin supervisión.',
  },
  'prisma-include-query-shape': {
    prompt: 'Usando la estrategia clásica de carga de relaciones `query`, ¿qué envía esta llamada a la base de datos?\n```ts\nprisma.user.findMany({\n  take: 100,\n  include: { posts: true },\n});\n```',
    options: {
      a: '101 queries: una para los usuarios y una por usuario para los posts',
      b: 'Una query con un `LEFT JOIN` entre `User` y `Post`',
      c: 'Dos queries: los usuarios y luego `SELECT ... FROM "Post" WHERE "authorId" IN (...)`, unidos en el cliente',
      d: 'Una query por cada autor distinto, ejecutadas en paralelo',
    },
    explanation: 'Prisma resuelve cada relación incluida con una query `IN` extra en batch y une los resultados en el query engine, así que `include` **no** es N+1: son 1 + (número de relaciones) queries. Prisma también ofrece una estrategia `join` (`relationLoadStrategy: "join"`), que usa una sola query SQL con lateral joins y agregación JSON en PostgreSQL. El N+1 vuelve cuando tú mismo haces un bucle y llamas a `findMany`/`findUnique` por cada fila. Prisma Client además agrupa en batch las llamadas a `findUnique` hechas en el mismo tick (su dataloader integrado), por eso los resolvers de GraphQL que llaman a `findUnique` por cada padre siguen siendo eficientes, pero solo con `findUnique`.\n\n**Dilo en voz alta:** "El `include` de Prisma agrupa cada relación en una sola query `IN`, así que el N+1 en Prisma viene de mis propios bucles; lo corrijo con `include`, con una sola query `in`, o me apoyo en el batching de `findUnique` en los resolvers."',
    hint: 'Piensa en cómo el query engine puede cargar una relación para muchos padres a la vez sin escribir un join de SQL.',
  },
  'prisma-chunked-in-batching': {
    prompt: 'Un job nocturno necesita los títulos de los posts para decenas de miles de ids de autores. Un `findMany` por autor es N+1; un solo `findMany` con todos los ids en una sola lista `in` arma una sentencia enorme y carga todas las filas de una vez, y Prisma no siempre puede dividirla por ti. El `findMany` de abajo es un fake de esta llamada que cuenta las queries y lanza un error cuando una llamada enlaza más de `chunkSize` ids:\n```ts\nprisma.post.findMany({\n  where: { authorId: { in: ids } },\n});\n```\n\nDevuelve `{ queries, titles }`, donde `titles[i]` contiene los títulos para `authorIds[i]` (en el orden de la tabla, `[]` cuando no hay ninguno). Elimina los ids duplicados, divídelos en chunks de como máximo `chunkSize` y envía una query por chunk. No envíes ninguna query para una lista vacía.',
    explanation: 'El batching cambia N viajes de ida y vuelta por ceil(únicos / chunkSize). Dividir en chunks importa porque las bases de datos y los drivers limitan los bind parameters por sentencia (el protocolo de PostgreSQL permite 65,535; SQL Server 2,100), y las listas `IN` enormes además producen planes grandes y conjuntos de resultados grandes retenidos en memoria. El query engine de Prisma puede dividir por su cuenta una lista `in` simple demasiado grande en varias queries, pero no cualquier forma de filtro (los filtros negados como `notIn` fallan con el error P2029), y aun así devuelve todo en una sola llamada; los chunks explícitos dejan bajo tu control el tamaño de la sentencia, la memoria y los reintentos. Elimina duplicados primero para que las keys repetidas no desperdicien espacios de parámetros, agrupa con un `Map` y mapea de vuelta al orden del llamador. Para jobs realmente grandes, procesa en streaming con paginación por cursor (`cursor` + `take`) en lugar de cargar todo de una vez.',
    hint: 'Elimina duplicados con un `Set`, divide los ids en chunks de `chunkSize`, agrupa las filas en un `Map` por `authorId` y mapea de vuelta en el orden del llamador.',
  },
  'prisma-interactive-transactions': {
    prompt: 'Un endpoint de checkout debe descontar stock, crear un pedido y cobrar una tarjeta a través de una API de pagos. Bajo carga, el stock a veces queda negativo. ¿Cómo lo implementas con Prisma y qué va dentro de la transacción?',
    modelAnswer: 'El stock negativo es una race condition de actualización perdida: dos requests leen `stock = 1`, las dos pasan la verificación y las dos escriben. La solución es convertir la verificación y la escritura en una sola sentencia atómica: `tx.product.updateMany({ where: { id, stock: { gte: qty } }, data: { stock: { decrement: qty } } })` y tratar `count === 0` como sin stock. Como alternativa, usa concurrencia optimista con una columna `version` en el `where`, o aislamiento `SERIALIZABLE` con reintentos. Envuelvo la actualización del stock y la inserción del pedido en una transacción interactiva, `prisma.$transaction(async (tx) => { ... })`, usando `tx` para cada query; la forma de arreglo `$transaction([a, b])` alcanza cuando las escrituras no dependen de los resultados de las otras. La llamada de pago se queda **fuera** de la transacción: una llamada de red retiene locks y una conexión mientras espera, y de todos modos no se puede revertir. Así que reservo el stock y creo un pedido `PENDING` en la transacción, cobro la tarjeta con una idempotency key y luego marco el pedido como pagado, o libero el stock con un paso de compensación si el cobro falla. Mantengo las transacciones cortas y configuro `timeout`/`maxWait` de forma explícita.',
    rubric: [
      'Diagnostica una race condition de leer y luego escribir (actualización perdida) en lugar de culpar a Prisma',
      'Usa una actualización condicional atómica (`updateMany` con una guarda `gte` / `decrement`) o locking optimista',
      'Conoce la `$transaction(async (tx) => ...)` interactiva frente a la forma de arreglo, y usa `tx` para cada query',
      'Mantiene la llamada al pago externo fuera de la transacción y usa idempotencia y compensación',
    ],
    explanation: 'Los entrevistadores usan esta pregunta para ver si entiendes que una transacción por sí sola no evita una race condition de leer y luego escribir con el nivel de aislamiento por defecto (READ COMMITTED en PostgreSQL; el REPEATABLE READ de MySQL tampoco lo evita), y que los efectos secundarios fuera de la base de datos no van dentro de ella.\n\n**Dilo en voz alta:** "Convierto la verificación y el descuento del stock en una sola actualización condicional, limito la transacción al trabajo de base de datos y manejo el pago fuera de ella con una idempotency key y un paso de compensación."',
    hint: 'Cubre la race condition de leer y luego escribir y cómo la cierra una actualización condicional, y luego por qué la llamada de pago se queda fuera de la transacción.',
  },
};
