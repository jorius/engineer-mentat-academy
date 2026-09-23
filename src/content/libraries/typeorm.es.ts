// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  'typeorm-n-plus-one-count': {
    prompt: '```ts\nconst authors = await authorRepo.find(); // returns 100 authors\nfor (const author of authors) {\n  author.posts = await postRepo.find({ where: { authorId: author.id } });\n}\n```\n¿Cuántas queries SQL envía esto?',
    options: {
      a: '1, porque TypeORM las combina en un join',
    },
    explanation: 'Una query para la lista más una por fila: el problema N+1. Cada `await` dentro del bucle también es un viaje de ida y vuelta por la red, secuencial, así que la latencia crece de forma lineal con N. Soluciones: carga la relación junto con el padre (`find({ relations: { posts: true } })`, un solo `LEFT JOIN`), o agrupa los hijos en una sola query `WHERE "authorId" IN (...)` (`In(ids)`) y agrúpalos en memoria. En los resolvers de GraphQL, donde el bucle queda oculto entre llamadas a resolvers, un DataLoader hace ese batching por request.',
  },
  'typeorm-batch-posts-by-author': {
    prompt: 'Escribe la función de batch que llamaría un DataLoader para `Author.posts`. `postRepo.find` es un fake del repositorio de TypeORM: cada llamada cuenta como una query SQL, y soporta `where: { authorId: In(ids) }`.\n\nDevuelve `{ queries, postIds }`, donde `postIds[i]` es la lista de ids de posts para `authorIds[i]` (en el orden de la tabla, `[]` cuando el autor no tiene ninguno). Este es el contrato de DataLoader: un resultado por key, en el mismo orden que las keys. Usa **una** query para cualquier entrada no vacía, y no envíes **ninguna** query para una vacía.',
    explanation: 'El patrón siempre es: recolectar las keys, eliminar duplicados, ejecutar **una** query `IN`, agrupar por la foreign key en un `Map` (O(n), no un `filter` anidado por key) y mapear de vuelta al orden original de las keys, con `[]` para las keys sin filas. DataLoader exige que el arreglo de resultados se alinee con las keys, porque resuelve la promesa de cada llamador por posición. Saltarse la query para una lista de keys vacía ahorra un viaje de ida y vuelta. En un resolver real creas el DataLoader **por request**, para que su caché nunca filtre datos entre usuarios.',
  },
  'typeorm-lazy-relation-n-plus-one': {
    prompt: '```ts\n@Entity()\nclass Post {\n  @ManyToOne(() => User, { lazy: true })\n  author: Promise<User>;\n}\n\nconst posts = await postRepo.find({ take: 50 });\nconst names = await Promise.all(posts.map(async (p) => (await p.author).name));\n```\n¿Qué hace TypeORM aquí?',
    options: {
      a: 'Una query con un join; `find` ignora `lazy`',
      b: 'Una query para los posts y luego una query por cada `await p.author`: 51 en total, disparadas de forma concurrente',
      c: 'Dos queries: TypeORM agrupa en batch las cargas lazy hechas en el mismo tick',
      d: 'Lanza un error, porque las relaciones lazy deben listarse en `relations`',
    },
    explanation: 'Una relación lazy es un getter que devuelve una promesa: cada primer acceso ejecuta su propio `SELECT`. TypeORM no las agrupa, así que esto es un N+1 escondido detrás del acceso a una propiedad. `Promise.all` solo lo vuelve concurrente, lo que además puede agotar el pool de conexiones bajo carga. Usa `relations: { author: true }` (o `leftJoinAndSelect`) para esta query, o recolecta los `authorId` y carga los usuarios con una sola query `In(ids)`. `eager: true` es el trade-off opuesto: siempre hace el join, incluso cuando no necesitas los datos, y solo aplica a los métodos `find*`, no al QueryBuilder.\n\n**Dilo en voz alta:** "Las relaciones lazy convierten el N+1 en el acceso a una propiedad, así que las evito en los caminos críticos y cargo las relaciones de forma explícita con un join o con una sola query `IN` en batch."',
  },
  'typeorm-leftjoin-vs-leftjoinandselect': {
    prompt: '```ts\nconst users = await dataSource\n  .getRepository(User)\n  .createQueryBuilder(\'user\')\n  .leftJoin(\'user.photos\', \'photo\')\n  .where(\'photo.isPublished = :published\', { published: true })\n  .getMany();\n```\n`users[0].photos` es `undefined`. ¿Por qué?',
    options: {
      a: '`leftJoin` solo hace el join para filtrar; se necesita `leftJoinAndSelect` para seleccionar e hidratar `photos`',
      b: 'La relación `photos` debe declararse con `eager: true`',
      c: '`getMany` descarta las relaciones; se requiere `getRawMany`',
      d: 'Los parámetros con nombre no se enlazan en `where`, así que el join se descarta',
    },
    explanation: '`leftJoin` agrega el join al SQL, pero no agrega las columnas del join al `SELECT`, así que no hay nada que mapear en `user.photos`. `leftJoinAndSelect` las selecciona e hidrata la relación. Hay un segundo bug más sutil: una condición sobre la tabla del join en el `WHERE` elimina a los usuarios sin fotos publicadas, lo que en la práctica convierte el left join en un inner join. Para conservar a todos los usuarios y adjuntar solo las fotos publicadas, pon la condición en el join: `.leftJoinAndSelect("user.photos", "photo", "photo.isPublished = :published", { published: true })`.',
  },
  'typeorm-synchronize-and-migrations': {
    prompt: 'Un servicio de NestJS usa TypeORM con `synchronize: true` en todos los entornos "porque es cómodo". ¿Cuáles son los riesgos y qué flujo de cambios de schema y de transacciones implementas en su lugar?',
    modelAnswer: '`synchronize` compara las entidades con el schema en vivo en cada arranque y aplica los cambios directamente: renombrar una propiedad se convierte en borrar la columna más agregar otra, lo que elimina datos sin avisar. Los cambios no se revisan, no se versionan y no son repetibles, y varias instancias arrancando a la vez pueden competir en el DDL. Lo dejo solo para bases de datos locales desechables y tests. En su lugar, genera migraciones con `typeorm migration:generate`, revisa el SQL en el pull request (en especial los drops, los renombres y las operaciones que toman locks, como agregar un índice en una tabla grande, que en Postgres debería usar `CONCURRENTLY`), haz commit de ellas y ejecútalas una vez por deploy como un paso separado, no desde cada instancia de la app. Los cambios riesgosos siguen expand-and-contract: agrega la columna nueva, rellena los datos, cambia el código y luego elimina la vieja en un release posterior, para que el código viejo y el nuevo puedan correr lado a lado. Las escrituras de varias sentencias van en una transacción: `dataSource.transaction(async (manager) => ...)` usando ese `manager` para cada query (un bug común es usar el repositorio global dentro del callback, que se ejecuta fuera de la transacción), o un `QueryRunner` cuando necesito control explícito.',
    rubric: [
      'Explica el riesgo de pérdida de datos (los renombres se vuelven drop más add) y la falta de revisión/versionado',
      'Genera, revisa y hace commit de las migraciones, y las ejecuta una vez por deploy',
      'Menciona expand-and-contract / cambios de schema compatibles hacia atrás',
      'Usa `dataSource.transaction` o un QueryRunner y sabe que debe usar el `manager` transaccional',
    ],
    explanation: 'La señal de nivel senior es tratar los cambios de schema como artefactos desplegables y revisables que deben ser compatibles con la versión del código que sigue corriendo.\n\n**Dilo en voz alta:** "`synchronize` es solo para prototipos locales; en entornos compartidos, los cambios de schema son migraciones revisadas que se ejecutan una vez por deploy, escritas con expand-and-contract para que el código viejo y el nuevo puedan correr a la vez."',
  },
};
