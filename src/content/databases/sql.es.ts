// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  'sql-total-per-customer-with-zero': {
    prompt:
      'Devuelve el nombre de cada cliente con el monto total de sus pedidos, **incluidos los clientes sin pedidos** (como 0). Columnas: `name`, `spent`. Ordena por `spent` de forma descendente y luego por `name`.',
    explanation:
      'Un inner join dejaría fuera a Tom. `COALESCE` convierte la suma `NULL` en 0. Agrupa por `c.id`, no solo por `name`, para que dos clientes con el mismo nombre no se mezclen; `c.name` también está en el `GROUP BY`, así que la consulta es válida en cualquier motor (Postgres y MySQL 5.7+ aceptarían solo `GROUP BY c.id`, porque `name` depende funcionalmente de la primary key).',
  },
  'sql-countries-over-threshold': {
    prompt: 'Devuelve los países cuyos clientes gastaron más de 250 en total. Columnas: `country`, `spent`. En cualquier orden.',
    explanation:
      '`WHERE` filtra filas antes de la agregación; `HAVING` filtra grupos después de ella. Aquí `HAVING` descarta a CO (240). Filtrar pedidos sueltos con `WHERE o.total > 250` en cambio conservaría solo el pedido de 300 de Mia y reportaría 300, no 320. Poner `SUM(o.total) > 250` en `WHERE` es un error (SQLite: "misuse of aggregate"; Postgres: "aggregate functions are not allowed in WHERE") porque en esa etapa el agregado todavía no existe.',
  },
  'sql-null-not-equal-trap': {
    prompt:
      'Devuelve el `name` de cada empleado que **no** está a cargo de Ada (`manager_id = 1`). Un empleado sin ningún manager también cuenta como "no está a cargo de Ada". En cualquier orden.',
    explanation:
      'SQL usa lógica de tres valores: `NULL <> 1` es `NULL` (desconocido), no `true`, y `WHERE` conserva solo las filas donde el predicado es `true`. Por eso `WHERE manager_id <> 1` descarta a Ada sin avisar. Maneja el `NULL` de forma explícita con `IS NULL OR ...`, o usa el operador null-safe de tu motor: `IS NOT 1` en SQLite, `IS DISTINCT FROM 1` en Postgres, `NOT (manager_id <=> 1)` en MySQL.',
  },
  'sql-not-in-with-null-subquery': {
    prompt:
      'Devuelve el `name` de cada empleado que **no es manager de nadie** (ningún otro empleado lo tiene como `manager_id`). En cualquier orden. Ojo: un empleado tiene un `NULL` en `manager_id`.',
    explanation:
      'El tentador `WHERE id NOT IN (SELECT manager_id FROM employees)` devuelve **cero filas**. `x NOT IN (1, 2, 4, NULL)` se expande a `x <> 1 AND x <> 2 AND x <> 4 AND x <> NULL`; el último término es desconocido, así que el predicado completo nunca puede ser `true`. `NOT EXISTS` (o `LEFT JOIN ... WHERE r.id IS NULL`) es null-safe y además es la forma que los optimizadores convierten en anti-join con más fiabilidad. Si tienes que usar `NOT IN`, filtra la subconsulta con `WHERE manager_id IS NOT NULL`.\n\n**Dilo en voz alta:** "Por defecto uso `NOT EXISTS` para los anti-joins, porque un solo `NULL` en una subconsulta de `NOT IN` vuelve desconocido todo el predicado y la consulta no devuelve nada."',
  },
  'sql-employee-earns-more-than-manager': {
    prompt:
      'Devuelve cada empleado que gana **estrictamente más** que su manager directo. Columnas: `employee`, `manager` (ambos nombres). En cualquier orden.',
    explanation:
      'Un self-join usa dos alias para la misma tabla: `e` es la fila del empleado y `m` es la fila del manager, que se encuentra a través de `e.manager_id`. Aquí lo correcto es un inner join, porque un empleado sin manager (Ada) no puede ganar más que uno. Eve gana exactamente lo mismo que Dee, así que `>` la excluye; con `>=` sería otra pregunta. Fíjate en que Finn no tiene departamento, lo cual no importa porque no se hace join con los departamentos.',
  },
  'sql-headcount-count-variants': {
    prompt:
      'En una sola fila, devuelve: el número de empleados (`employees`), el número de empleados que tienen manager (`with_manager`) y el número de personas distintas que son manager de alguien (`managers`).',
    explanation:
      '`COUNT(*)` cuenta filas. `COUNT(col)` cuenta las filas donde `col` no es `NULL`, así que Ada queda fuera. `COUNT(DISTINCT col)` también ignora los `NULL` y elimina los duplicados: los ids de manager son 1, 2 y 4. Todos los agregados excepto `COUNT(*)` ignoran los `NULL`, y por eso `AVG(col)` no es lo mismo que `SUM(col) / COUNT(*)`.',
  },
  'sql-payroll-share-integer-division': {
    prompt:
      'Para cada departamento que tenga al menos un empleado, devuelve su participación en la **nómina total de la empresa** (incluidos los empleados sin departamento) como un porcentaje entero, redondeado hacia abajo. Columnas: `department`, `pct`. En cualquier orden. `salary` es una columna `INTEGER`.',
    explanation:
      'La nómina total es 980. Engineering suma 510 y Sales 330. En SQLite, Postgres y SQL Server, `INTEGER / INTEGER` es división entera, así que `SUM(e.salary) / 980 * 100` da `0 * 100 = 0` para ambos. Multiplica primero (`51000 / 980 = 52`), o convierte uno de los lados a real (`SUM(e.salary) * 100.0 / ...`) y trunca al final. MySQL es la excepción: su `/` siempre devuelve un decimal, y `DIV` es la división entera. La subconsulta escalar da el denominador sin una segunda pasada en el código de la aplicación.',
  },
  'sql-running-total-by-date': {
    prompt:
      'Devuelve cada pedido con el total acumulado de ingresos hasta ese pedido inclusive, en orden de fecha. Columnas: `id`, `created_at`, `running_total`. Ordena por `created_at`. Las fechas son únicas.',
    explanation:
      'La subconsulta correlacionada suma todos los pedidos con fecha igual o anterior a la del pedido actual. Funciona en cualquier motor, pero es O(n²): cada fila vuelve a recorrer la tabla (un índice sobre `created_at` convierte cada recorrido en un range scan, lo que ayuda pero no cambia la forma). Con window functions (SQLite 3.25+, Postgres, MySQL 8) escribe `SUM(total) OVER (ORDER BY created_at)`, que lo calcula en una sola pasada ordenada. Si las fechas pudieran repetirse, el frame `RANGE` por defecto daría el mismo total a las filas empatadas; agrega un criterio de desempate y `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` para obtener un total estricto por fila.',
  },
  'sql-salary-bands-case': {
    prompt:
      'Agrupa a los empleados por rango salarial: `low` (menos de 100), `mid` (de 100 a 149), `high` (150 o más). Devuelve cada rango con su número de empleados. Columnas: `band`, `headcount`. En cualquier orden.',
    explanation:
      '`CASE` evalúa sus ramas `WHEN` de arriba hacia abajo y se detiene en la primera coincidencia, así que la segunda rama solo necesita `< 150`. Agrupar por la expresión `CASE` (o por su alias, que SQLite, Postgres y MySQL permiten en `GROUP BY`) convierte un valor derivado en una clave de agrupación. Un rango sin empleados simplemente no aparecería; para mostrarlo con 0 tendrías que hacer un left join desde una lista de rangos.',
  },
  'sql-bare-column-group-by': {
    prompt:
      'Un compañero quiere el empleado mejor pagado de cada departamento y escribe:\n\n```sql\nSELECT dept_id, name, MAX(salary)\nFROM employees\nGROUP BY dept_id;\n```\n\n¿Qué pasa?',
    options: {
      a: 'Es un error de sintaxis en todos los motores principales, porque `name` no está agrupado ni agregado.',
      b: 'SQLite lo ejecuta y devuelve el `name` de la fila que tiene el máximo; Postgres lo rechaza; MySQL lo rechaza con el `ONLY_FULL_GROUP_BY` por defecto.',
      c: 'Todos los motores lo ejecutan y devuelven el nombre de la primera fila de cada grupo, así que es portable pero poco confiable.',
      d: 'Devuelve una fila por empleado, porque `name` está en la lista del select y se suma implícitamente a la clave de agrupación.',
    },
    explanation:
      'El SQL estándar solo permite en la lista del select columnas agrupadas, agregadas o funcionalmente dependientes de la clave de agrupación (Postgres acepta columnas no agrupadas de una tabla cuya primary key está agrupada). SQLite tiene un caso especial documentado: con un solo `MIN()` o `MAX()`, las columnas sueltas salen de la fila que produjo el valor extremo; si hay empates, o con cualquier otro agregado, la fila es arbitraria. MySQL sin `ONLY_FULL_GROUP_BY` devuelve un valor arbitrario. La respuesta portable es una subconsulta correlacionada, un join con una subconsulta agrupada o `RANK()` sobre una partición.\n\n**Dilo en voz alta:** "Una columna suelta en una consulta agrupada no es portable y no es determinista cuando hay empates; resuelvo el greatest-per-group con una window function o con un join de vuelta al máximo agrupado."',
  },
  'sql-top-earner-per-department-ties': {
    prompt:
      'Devuelve el empleado mejor pagado de cada departamento. **Si varias personas empatan en el salario más alto, devuélvelas a todas.** Omite a los empleados sin departamento. Columnas: `department`, `name`, `salary`. Ordena por `department` y luego por `name`.',
    explanation:
      'Este es el problema greatest-n-per-group. Opciones: una subconsulta correlacionada contra el máximo por departamento (la de arriba), un join con `SELECT dept_id, MAX(salary) ... GROUP BY dept_id`, o `RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) = 1` dentro de una subconsulta. La regla de empates decide la función: `RANK`/`DENSE_RANK` conservan a Dee y a Eve, `ROW_NUMBER` elige a una de forma arbitraria. Un `name` suelto junto a `MAX(salary)` también devolvería solo a una de ellas. Finn tiene `dept_id NULL`, así que el inner join lo descarta, y de todos modos `x.dept_id = NULL` nunca coincidiría.\n\n**Dilo en voz alta:** "Primero pregunto cómo deben comportarse los empates, porque eso decide entre `ROW_NUMBER` y `RANK`; después elijo una window function o un join con el máximo agrupado."',
  },
  'sql-composite-index-leftmost-prefix': {
    prompt:
      'La tabla `orders` tiene este índice B-tree, y `customer_id` tiene muchos valores distintos:\n\n```sql\nCREATE INDEX ix_orders_cust_created\n  ON orders (customer_id, created_at);\n```\n\nSuponiendo un acceso B-tree clásico (sin skip scan), ¿qué consultas pueden usarlo para hacer **seek a un único rango contiguo** del índice, en lugar de recorrer toda la tabla o todo el índice? Selecciona todas las que apliquen.',
    options: {
      d: '```sql\nWHERE customer_id = 7\nORDER BY created_at DESC\nLIMIT 10\n```\n(y además evita un ordenamiento)',
      e: "```sql\nWHERE customer_id > 7\n  AND created_at = '2026-09-01'\n```\n(hace seek en ambas columnas)",
    },
    explanation:
      'Un B-tree compuesto está ordenado por `customer_id` y, dentro de cada cliente, por `created_at`. Puede hacer seek sobre cualquier **prefijo izquierdo** de sus columnas: igualdad solo en `customer_id`, o igualdad y luego un rango en `created_at`. Dentro de un mismo cliente las entradas ya están en orden de `created_at`, así que `ORDER BY created_at DESC LIMIT 10` recorre el índice hacia atrás y se detiene tras 10 filas sin paso de ordenamiento. Filtrar solo por `created_at` se salta la columna inicial, así que no hay un rango contiguo al que hacer seek. El skip scan (Oracle, MySQL 8.0.13+, SQLite, Postgres 18) puede convertirlo en un seek por cada `customer_id` distinto, lo que solo compensa cuando la columna inicial tiene pocos valores distintos, no con un id de cliente. En `customer_id > 7 AND created_at = ...`, el rango sobre la primera columna cierra el prefijo contiguo: un B-tree clásico hace seek a `customer_id > 7` y revisa `created_at` en cada entrada del índice a partir de ahí (el skip scan de Postgres 18 puede en cambio volver a hacer seek por cliente, de nuevo solo rentable con pocos clientes distintos). Regla práctica: primero las columnas de igualdad, luego la columna de rango o de ordenamiento.\n\n**Dilo en voz alta:** "Ordeno las columnas de un índice compuesto con los predicados de igualdad primero y luego la columna de rango o de `ORDER BY`, porque el índice solo puede hacer seek sobre un prefijo izquierdo y un rango corta ese prefijo."',
  },
  'sql-like-leading-wildcard': {
    prompt:
      "`customers.email` tiene un índice B-tree. ¿Por qué `WHERE email LIKE '%@example.com'` sigue recorriendo todas las filas, mientras que `WHERE email LIKE 'ana%'` puede usar el índice?",
    options: {
      a: '`LIKE` nunca usa índices; la segunda consulta es rápida solo gracias a la caché de resultados.',
      b: 'Un B-tree está ordenado por el valor a partir de su primer carácter, así que un prefijo conocido corresponde a un único rango contiguo de claves, mientras que un comodín inicial no da ningún punto de partida para el seek.',
      c: 'El optimizador ignora los índices siempre que el patrón contiene un carácter especial como `@`.',
      d: 'Los comodines iniciales obligan a una comparación que no distingue mayúsculas de minúsculas, y esas comparaciones desactivan los índices.',
    },
    explanation:
      "`LIKE 'ana%'` se reescribe como el rango `email >= 'ana' AND email < 'anb'`, que es un seek. `'%@example.com'` podría empezar en cualquier parte, así que el motor tiene que evaluar cada fila (en el mejor caso, un full index scan). Soluciones para buscar por sufijo: indexar una copia invertida de la columna y buscar `LIKE reverse('%@example.com')` como prefijo, guardar el dominio en su propia columna indexada, o usar un índice de trigramas (`pg_trgm` GIN en Postgres) o búsqueda de texto completo para coincidencias en medio del texto. Salvedades según el motor: el `LIKE` por prefijo también necesita una collation compatible (Postgres necesita `text_pattern_ops` con un locale distinto de C; SQLite necesita que la collation del índice coincida con su `LIKE`, que no distingue mayúsculas de minúsculas).",
  },
  'sql-covering-index-tradeoffs': {
    prompt:
      'Un endpoint muy usado ejecuta esta consulta:\n\n```sql\nSELECT id, total\nFROM orders\nWHERE customer_id = ?\nORDER BY created_at DESC\nLIMIT 20\n```\n\nYa existe un índice sobre `customer_id`. ¿Qué es un covering index, lo agregarías aquí y qué cuesta?',
    modelAnswer:
      'Un covering index contiene todas las columnas que necesita la consulta, así que el motor responde solo con el índice (un index-only scan) y nunca lee las filas de la tabla. Aquí reemplazaría el índice de una sola columna por `(customer_id, created_at DESC)` y llevaría en él las columnas proyectadas. En Postgres eso significa `INCLUDE (total, id)`, porque un índice de Postgres guarda punteros al heap, no la primary key. En InnoDB, y en SQL Server cuando `id` es la clave clustered, todo índice secundario ya lleva la primary key, así que basta con `(customer_id, created_at, total)` o `INCLUDE (total)`; SQLite guarda el rowid, del que `id INTEGER PRIMARY KEY` es un alias. Eso convierte "seek, luego ordenamiento, luego 20 lecturas aleatorias a la tabla" en una sola lectura de rango ordenada que se detiene tras 20 entradas. Los costos: cada insert y cada update de esas columnas ahora escribe un índice más, el índice ocupa disco y espacio en el buffer cache, y una lista de `INCLUDE` muy ancha convierte el índice casi en una copia de la tabla. En Postgres, un index-only scan también depende del visibility map, así que una tabla con mucha rotación y un vacuum atrasado igual visita el heap. Confirmaría la mejora con `EXPLAIN ANALYZE` antes y después, y eliminaría el índice sobre `customer_id`, que queda redundante porque el nuevo atiende las mismas búsquedas.',
    rubric: [
      'Define covering index como responder la consulta desde el índice sin leer la tabla (index-only scan)',
      'Pone `customer_id` y luego `created_at` en la clave para que el índice también resuelva el `ORDER BY ... LIMIT` sin ordenar',
      'Menciona la amplificación de escritura y el costo de almacenamiento, no solo el beneficio en lecturas',
      'Menciona verificar con `EXPLAIN` / `EXPLAIN ANALYZE` y eliminar el índice redundante de una sola columna',
    ],
    explanation:
      'La señal de seniority es tratar un índice como un intercambio: diseñarlo para la ruta de acceso exacta (filtro, orden, proyección) y luego pagarlo en cada escritura. La regla del prefijo izquierdo hace que el nuevo índice compuesto vuelva redundante al anterior de una sola columna.\n\n**Dilo en voz alta:** "Diseño el índice para toda la ruta de acceso, primero el filtro, luego el orden y luego las columnas proyectadas, para que la consulta sea una sola lectura de rango del índice; y recuerdo que cada índice que agrego lo pago en cada escritura."',
  },
  'sql-n-plus-one-at-sql-layer': {
    prompt:
      'El log de la base de datos para una sola carga de página muestra:\n\n```sql\nSELECT id, name FROM customers WHERE country = \'CO\';\nSELECT * FROM orders WHERE customer_id = 1;\nSELECT * FROM orders WHERE customer_id = 2;\n-- ... one more per customer\n```\n\n¿Qué cambio resuelve el problema de fondo?',
    options: {
      a: 'Agregar un índice sobre `orders.customer_id` para que cada consulta por cliente sea más rápida.',
      b: 'Traer los pedidos de todos los clientes en una sola sentencia, ya sea con un `JOIN` o con `WHERE customer_id IN (...)`, y agruparlos en la aplicación.',
      c: 'Ejecutar las consultas por cliente en paralelo con `Promise.all`.',
      d: 'Aumentar el tamaño del connection pool para que las consultas no hagan cola.',
    },
    explanation:
      'Este es el patrón N+1: una consulta para la lista de padres más una por cada padre. Cada sentencia paga un viaje de ida y vuelta por la red, el parseo y la planificación, así que la latencia crece linealmente con N aunque cada consulta sea rápida. La solución elimina viajes de ida y vuelta: un solo `JOIN`, o dos consultas en total (los padres y luego `IN (...)` para los hijos, que es lo que hacen el eager loading de los ORM y el DataLoader de GraphQL). El índice sobre `orders.customer_id` vale la pena, pero sigue dejando N viajes de ida y vuelta. Ejecutar las consultas en paralelo con `Promise.all` y agrandar el pool trasladan la carga a la base de datos y agotan las conexiones cuando hay concurrencia.',
  },
  'sql-non-sargable-predicates': {
    prompt:
      '`orders.created_at` (un `TIMESTAMP`) y `customers.email` (un `VARCHAR`) tienen cada uno un índice B-tree simple, y no hay índices de expresión. ¿Qué predicados **impiden** que el motor haga seek sobre esos índices? Selecciona todos los que apliquen.',
    explanation:
      'Un índice guarda el valor crudo de la columna, así que un predicado solo puede hacer seek cuando la columna aparece sola en un lado de la comparación ("sargable"). Envolver la columna en una función (`DATE(created_at)`, `LOWER(email)`) o hacer aritmética con ella (`created_at + INTERVAL ...`) obliga al motor a calcular la expresión en cada fila. Reescribe el filtro con `DATE(created_at)` como el rango semiabierto `created_at >= ... AND created_at < ...`, y el de aritmética como `created_at > NOW() - INTERVAL \'1 day\'`. Para búsquedas de email que no distingan mayúsculas de minúsculas, agrega un índice de expresión sobre `LOWER(email)` o usa un tipo o una collation que no las distinga (`citext` en Postgres). Otra causa silenciosa es un cast implícito, como comparar una columna `VARCHAR` con un número en MySQL.',
  },
  'sql-diagnose-slow-query-explain': {
    prompt:
      'Una consulta de reporte que antes tardaba 200 ms ahora tarda 12 s en producción. No cambió nada en el código. Explícame paso a paso cómo lo diagnosticas y lo arreglas.',
    modelAnswer:
      'Primero lo reproduzco con los parámetros reales y capturo el plan con `EXPLAIN (ANALYZE, BUFFERS)` en Postgres o `EXPLAIN ANALYZE` en MySQL 8, idealmente en una réplica con volumen de producción, y lo comparo con el plan anterior si existe historial en `pg_stat_statements` o `auto_explain`. Leo el plan desde el nodo más costoso hacia afuera, buscando un sequential scan sobre una tabla grande, un nested loop sobre muchas más filas de las esperadas, o un sort o hash que se desborda a disco. La pista más importante es comparar las filas estimadas con las reales: una diferencia grande suele indicar estadísticas desactualizadas o insuficientes tras el crecimiento de los datos, así que ejecuto `ANALYZE` (o subo el statistics target de una columna sesgada) y reviso si el plan vuelve a cambiar. Si es un plan sensible a parámetros (un plan genérico en caché elegido para un valor sesgado), lo abordo de forma específica. Luego reviso los predicados: filtros no sargables, casts implícitos o un índice compuesto que falta para la nueva distribución de los datos. También descarto causas ajenas al plan: esperas por locks, bloat de tablas o índices, y una caché fría después de un failover. La solución es la más pequeña que ataque la causa (estadísticas frescas, un índice puntual o un predicado reescrito), verificada con un plan nuevo, y después agrego monitoreo para detectar la próxima regresión antes de que la reporten los usuarios.',
    rubric: [
      'Usa `EXPLAIN ANALYZE` (ejecución real), no solo `EXPLAIN`, y lo lee desde el nodo más costoso',
      'Compara filas estimadas contra reales y relaciona una diferencia grande con estadísticas desactualizadas o con crecimiento o sesgo de los datos',
      'Revisa que los predicados sean sargables y que los índices coincidan con el patrón de acceso',
      'Descarta causas ajenas al plan, como locks, bloat o una caché fría',
      'Verifica la solución con un plan nuevo y agrega monitoreo (por ejemplo `pg_stat_statements` o un slow-query log)',
    ],
    explanation:
      '"No cambió nada" suele significar que cambiaron los datos: el crecimiento o el sesgo llevaron al optimizador más allá de un umbral de costo, o las estadísticas quedaron desactualizadas y calculó mal las cardinalidades. Una respuesta sólida es un método (medir, leer el plan, formular una hipótesis, aplicar la solución más pequeña, verificar), no una lista de trucos de tuning.\n\n**Dilo en voz alta:** "Si el código no cambió, asumo que cambiaron los datos o las estadísticas; comparo las filas estimadas y las reales en `EXPLAIN ANALYZE` para encontrar dónde se equivocó el optimizador."',
  },
};
