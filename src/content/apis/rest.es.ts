// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  'rest-resource-nouns-vs-rpc': {
    prompt: 'Estás exponiendo tickets por HTTP. ¿Qué conjunto de endpoints sigue el estilo **REST** y no el estilo RPC?',
    explanation:
      'En REST el **path nombra un recurso (un sustantivo en plural)** y el **método HTTP es el verbo**. Poner el verbo en el path (`/createTicket`, `/tickets/delete`) es estilo RPC: cada operación se convierte en un POST, así que pierdes la semántica de los métodos de la que dependen los cachés, los proxies, los reintentos y las herramientas (GET es seguro y cacheable, PUT/DELETE son idempotentes).\n\nEl conjunto con `GET /tickets?action=...` es el peor de todos: un `GET` que borra datos rompe la garantía de seguridad, y los crawlers o el prefetch de enlaces pueden dispararlo.\n\nRPC no está mal en general (gRPC y JSON-RPC son legítimos), pero si dices que una API es RESTful, los recursos deberían ser sustantivos.',
    hint: 'Pregúntate dónde vive el verbo en cada conjunto: en el path, en un parámetro de query o en el propio método HTTP.',
  },
  'rest-put-vs-patch-partial-body': {
    prompt:
      'El usuario guardado es:\n\n```json\n{\n  "name": "Ana",\n  "email": "ana@x.io",\n  "role": "admin"\n}\n```\n\nUn cliente envía `PUT /users/7` con este body a un servidor que implementa PUT exactamente como lo define la especificación HTTP:\n\n```json\n{\n  "email": "ana@y.io"\n}\n```\n\n¿Qué queda guardado después?',
    options: {
      a: '```json\n{\n  "name": "Ana",\n  "email": "ana@y.io",\n  "role": "admin"\n}\n```\nPorque PUT fusiona los campos que recibe',
      b: '```json\n{\n  "email": "ana@y.io"\n}\n```\nPorque PUT reemplaza toda la representación con el body',
      c: 'Nada cambia; PUT es idempotente, así que no puede modificar un recurso existente',
      d: 'Se crea un usuario nuevo con un id generado, porque PUT significa crear',
    },
    explanation:
      '**PUT es un reemplazo completo**: el body *es* el nuevo estado del recurso, así que los campos que omites desaparecen (o vuelven a sus valores por defecto). Por eso también PUT es idempotente: enviar el mismo estado completo dos veces deja el mismo resultado.\n\n**PATCH es una actualización parcial**: envías solo el cambio (un JSON Merge Patch como `{ "email": "ana@y.io" }` o una lista de operaciones JSON Patch). Usa PATCH cuando los clientes editan unos pocos campos.\n\nMuchas APIs reales implementan PUT como una fusión, y ese es exactamente el bug que borra `role` en silencio cuando alguien más adelante lo "arregla" para cumplir la especificación. La afirmación de que PUT no puede modificar un recurso existente porque es idempotente confunde idempotente (N llamadas = 1 llamada) con seguro (sin cambio de estado).',
    hint: 'Recuerda si la especificación HTTP trata el body de un PUT como un cambio parcial o como el nuevo estado completo del recurso.',
  },
  'rest-non-crud-actions-design': {
    prompt:
      'Tu API de tickets necesita operaciones que no son CRUD simple: **cerrar** un ticket, **asignarlo** a un agente y **fusionar** el ticket 123 con el ticket 456. ¿Cómo modelas esto en una API REST y cuándo aceptarías un endpoint estilo RPC?',
    modelAnswer:
      'Primero me pregunto si la acción es realmente un cambio de estado de un recurso. Cerrar es `PATCH /tickets/123` con `{ "status": "closed" }`; el servidor valida la transición (no puedes cerrar un ticket que ya fue fusionado) y devuelve `409 Conflict` si es ilegal. La asignación se puede modelar como un subrecurso, `PUT /tickets/123/assignee` con `{ "agentId": 9 }`, o `POST /tickets/123/assignments` si quieres un historial auditable de asignaciones. La fusión toca dos tickets y tiene efectos secundarios, así que la modelo como la creación de un recurso: `POST /ticket-merges` con `{ "source": 123, "target": 456 }`, que devuelve `201` y el registro de la fusión, o `202` si tarda mucho. Si nada de eso se lee de forma natural, un endpoint estilo controlador `POST /tickets/123:merge` o `POST /tickets/123/merge` es una excepción aceptada y documentada (los métodos personalizados de Google AIP hacen esto); debe ser POST porque por defecto no es ni seguro ni idempotente. Lo que evito es usar verbos como paths de primer nivel para todo, y nunca un GET que modifique estado.',
    rubric: [
      'Modela las acciones simples como cambios de estado con PATCH sobre el recurso, con validación de la transición en el servidor',
      'Usa subrecursos o "la acción como recurso creado" (p. ej. POST /ticket-merges) para operaciones sobre varias entidades',
      'Conoce la vía de escape del método personalizado (POST /tickets/123:merge) y usa POST para ella',
      'Nombra los códigos de estado correctos: 409 para transiciones ilegales, 201/202 para acciones creadas o asíncronas',
      'Descarta GET para cualquier cosa que modifique estado',
    ],
    explanation:
      'Los entrevistadores usan esta pregunta para ver si aplicas REST como una herramienta o como una religión. La respuesta sólida mapea la mayoría de las acciones a recursos (campos de estado, subrecursos o la propia acción como un recurso que creas) y admite una excepción estilo RPC claramente acotada cuando el dominio lo exige.\n\n**Dilo en voz alta:** "La mayoría de los verbos son en realidad transiciones de estado, así que hago PATCH del estado y dejo que el servidor valide la transición; para operaciones sobre varios recursos creo un recurso que representa la acción, y solo como último recurso agrego un método POST personalizado y documentado."',
    hint: 'Cubre qué acciones son en realidad transiciones de estado, cuándo encaja un subrecurso o la acción como recurso, la vía de escape del método personalizado y los códigos para transiciones ilegales.',
  },
  'rest-status-401-vs-403': {
    prompt:
      'Una petición a `DELETE /projects/42` llega con un bearer token **válido y no expirado** de un usuario cuyo rol es `viewer`. Los viewers no pueden borrar proyectos. ¿Qué código de estado encaja mejor?',
    explanation:
      'A pesar de su nombre, **401 significa "no autenticado"**: no hay credenciales, o son inválidas o expiraron. Debe venir con un header `WWW-Authenticate` (RFC 9110 §15.5.2) que le diga al cliente cómo autenticarse. **403 significa "autenticado, pero sin permiso"**: reintentar con la misma identidad no va a servir.\n\n`405` es para un método que el recurso no soporta en absoluto (para nadie), y debe incluir un header `Allow`. `400` es para una petición mal formada.\n\nCuando revelar que un recurso *existe* ya es en sí una fuga (el proyecto de otro tenant), muchas APIs devuelven `404` en lugar de `403`. Es una decisión deliberada, no un error.',
    hint: 'Separa "quién llama" de "qué puede hacer", y revisa cuál de las dos cosas ya resuelve un token válido y no expirado.',
  },
  'rest-status-code-choices': {
    prompt: '¿Qué combinaciones de escenario y respuesta son correctas? Selecciona todas las que apliquen.',
    options: {
      a: '`POST /users` crea un usuario de forma síncrona: `201 Created` con un header `Location: /users/88`',
      b: '`DELETE /users/88` tiene éxito y no hay nada que devolver: `204 No Content`',
      c: '`POST /users` con un email que ya existe (restricción de unicidad): `409 Conflict`',
      d: 'El body de la petición no pasa la validación: `200 OK` con este body:\n\n```json\n{\n  "success": false,\n  "error": "email invalid"\n}\n```',
      e: 'El cliente envía JSON mal formado que el parser no puede leer: `500 Internal Server Error`',
      f: 'El cliente superó su cuota: `429 Too Many Requests` con un header `Retry-After`',
    },
    explanation:
      '- **201 + Location** le dice al cliente dónde vive el nuevo recurso.\n- **204** es éxito con body vacío; un `200` con la entidad borrada también está bien.\n- **409** señala un conflicto con el estado actual del recurso (clave duplicada, versión que no coincide, transición de estado ilegal).\n- **429 + Retry-After** permite que los clientes bien portados reduzcan el ritmo.\n\n`200 OK` con `success: false` es el antipatrón clásico: un `200` para un fallo deja ciegos a todos los proxies, políticas de reintento, dashboards de monitoreo y SDKs que dependen de los códigos de estado. Usa `400` o `422` con un body de error. Responder `500` a un JSON mal formado culpa al servidor por un error del cliente; el JSON mal formado es `400`. Un 5xx debería significar "culpa nuestra", y alertar sobre la tasa de 5xx solo funciona si cumples esa promesa.',
    hint: 'Para cada pareja, pregúntate si el código les dice la verdad a los proxies, los reintentos y el monitoreo, y si la falla es del cliente o del servidor.',
  },
  'rest-if-match-412-lost-update': {
    prompt:
      'Dos agentes de soporte abren el ticket 123 al mismo tiempo (ambos reciben `ETag: "v7"`). El agente A guarda primero y el ticket pasa a `v8`. Luego el agente B envía `PUT /tickets/123` con `If-Match: "v7"`. ¿Qué debería hacer el servidor para evitar la actualización perdida?',
    options: {
      a: 'Aplicar la escritura; "la última escritura gana" es el comportamiento por defecto de HTTP y `If-Match` es solo una pista de caché',
      b: 'Rechazarla con `412 Precondition Failed`; el cliente vuelve a leer, concilia y reintenta con el nuevo ETag',
      c: 'Devolver `304 Not Modified`, porque el cliente ya tiene una copia del recurso',
      d: 'Rechazarla con `428 Precondition Required`, porque el ETag está desactualizado',
    },
    explanation:
      '`If-Match` hace que la escritura sea **condicional**: "aplica esto solo si la versión actual sigue siendo `v7`". Como la versión ahora es `v8`, la precondición falla y el servidor responde **412 Precondition Failed** sin cambiar nada. Esto es control de concurrencia optimista sobre HTTP, la misma idea que una columna `version` verificada en `UPDATE ... WHERE version = 7`.\n\n`304` es lo que responde un **GET** condicional con `If-None-Match` (la copia en caché sigue vigente). `428 Precondition Required` es lo que devuelves cuando el cliente **no** envió ningún `If-Match` a un endpoint que lo exige. Muchas APIs usan `409 Conflict` para desajustes de versión que viajan en el body; con precondiciones HTTP, 412 es el código preciso.\n\n**Dilo en voz alta:** "Evito las actualizaciones perdidas con ETags: las lecturas devuelven una versión, las escrituras envían `If-Match`, y una versión desactualizada recibe un 412, así que el cliente tiene que conciliar en lugar de sobrescribir en silencio el cambio de otra persona."',
    hint: 'Trata `If-Match` como una escritura condicional, como el bloqueo optimista con una columna de versión, y recuerda qué código significa que una precondición no se cumplió.',
  },
  'rest-idempotent-but-not-safe': {
    prompt: '¿Qué métodos HTTP son **idempotentes pero no seguros** según los define la especificación HTTP? Selecciona todos los que apliquen.',
    explanation:
      '**Seguro** = no cambia el estado del servidor (solo lectura). **Idempotente** = el efecto de N peticiones idénticas es igual al efecto de una, así que se puede *reintentar* sin riesgo.\n\n| Método | Seguro | Idempotente |\n|---|---|---|\n| GET, HEAD, OPTIONS | sí | sí |\n| PUT | no | sí (reemplazo completo, el mismo estado cada vez) |\n| DELETE | no | sí (borrado dos veces sigue borrado) |\n| PATCH | no | no garantizado (`{ "op": "increment" }` no lo es) |\n| POST | no | no (cada llamada puede crear un recurso nuevo) |\n\nGET es idempotente **y** seguro, así que no califica. Una trampa común: el segundo `DELETE` puede devolver `404` en lugar de `204`. Sigue siendo idempotente, porque la idempotencia trata sobre el **estado del servidor**, no sobre obtener la misma respuesta. Por eso también los clientes y proxies pueden reintentar automáticamente PUT y DELETE tras un timeout, pero no POST sin una idempotency key.',
    hint: 'Define primero ambos términos: seguro significa sin cambio de estado, idempotente significa que N peticiones iguales tienen el efecto de una. Luego evalúa cada método con los dos.',
  },
  'rest-idempotency-key-replay': {
    prompt:
      'Este handler procesa peticiones `POST /payments` que traen un header `Idempotency-Key`. Los clientes móviles reintentan cuando hay timeouts, y a los clientes se les está **cobrando dos veces**. Corrige `solution` para que:\n\n- un reintento con la misma key y el mismo monto **repita la respuesta original** sin volver a cobrar;\n- una key reutilizada con un **monto distinto** reciba `{ status: 422, chargeId: null }` y ningún cobro;\n- `charges` cuente los cobros reales, y los ids de cobro sean `ch_1`, `ch_2`, ... sin huecos.',
    explanation:
      'Hay dos bugs: el starter **cobra antes de revisar la key**, así que cada reintento mueve dinero aunque repita la respuesta anterior, e **ignora el payload**, así que una key reutilizada por accidente para un pago distinto devuelve en silencio el recibo equivocado.\n\nLa corrección es "buscar primero, cobrar solo si no está, y guardar la huella de la petición junto con la respuesta". En producción el almacén es Redis o una tabla de base de datos con una restricción de unicidad sobre la key, las entradas expiran tras un TTL (Stripe las guarda 24 h), las keys se acotan por cliente, y una petición que llega **mientras la primera sigue en curso** recibe `409 Conflict` (el borrador de IETF sobre Idempotency-Key usa 409 para eso y 422 para un payload que no coincide). La key debe escribirse de forma atómica junto con el efecto secundario, o una caída entre ambos vuelve a introducir el doble cobro.\n\n**Dilo en voz alta:** "POST no es idempotente, así que lo hago idempotente con una key generada por el cliente: reviso la key antes del efecto secundario, guardo un hash de la petición con la respuesta, repito la respuesta si coincide, rechazo un payload distinto y hago que la escritura de la key sea atómica con el cobro."',
    hint: 'Busca la clave antes de cualquier efecto secundario, guarda el monto de la petición junto con la respuesta guardada y cobra solo cuando no la encuentres.',
  },
};
