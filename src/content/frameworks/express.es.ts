// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  'express-middleware-registration-order': {
    prompt:
      "```js\nconst app = express();\n\napp.get('/health', (req, res) => res.send('ok'));\napp.use(requestLogger);\napp.use(express.json());\napp.post('/orders', (req, res) => res.status(201).json(req.body));\n```\nEl equipo de operaciones se queja de que los health checks nunca aparecen en el log de peticiones. ¿Por qué?",
    options: {
      a: 'El middleware de `app.use` se eleva (hoisting), así que `requestLogger` se ejecuta primero en cada petición; el propio logger debe estar filtrando `/health`',
      b: 'El middleware y las rutas se ejecutan en orden de registro; `/health` termina la respuesta sin llamar a `next()`, así que nunca se llega a `requestLogger`',
      c: '`app.use` solo se aplica a peticiones que no son GET, a menos que le pases una ruta',
      d: '`express.json()` se traga las peticiones GET que no tienen body',
    },
    explanation:
      'Express mantiene una sola pila ordenada de capas (middleware y rutas). Una petición recorre esa pila de arriba abajo y solo avanza cuando la capa actual llama a `next()`. El handler de `/health` envía una respuesta y nunca llama a `next()`, así que no se ejecuta nada de lo registrado después. El middleware transversal (logging, ids de petición, cabeceras de seguridad, parseo del body) va **antes** de las rutas; el handler de 404 y el manejador de errores van **después**.',
  },
  'express-error-handler-arity': {
    prompt:
      "```js\napp.get('/orders/:id', async (req, res) => {\n  throw new Error('db down');\n});\n\napp.use((err, req, res) => {\n  res.status(500).json({ error: err.message });\n});\n```\nEl manejador de errores personalizado nunca se ejecuta; los clientes reciben la página de error HTML por defecto de Express. ¿Qué está mal?",
    options: {
      a: 'El manejador de errores debe registrarse **antes** de las rutas que protege',
      b: 'Los manejadores de errores deben registrarse con `app.error(...)`, no con `app.use(...)`',
      c: 'Express reconoce un manejador de errores solo por su aridad: debe declarar cuatro parámetros `(err, req, res, next)`',
      d: 'Los handlers async no pueden lanzar errores en Express; el error se pierde en silencio',
    },
    explanation:
      'Express comprueba `fn.length === 4` para decidir si una capa es un manejador de errores. Con tres parámetros, esta función se trata como un middleware normal (así que `err` sería en realidad `req`) y se omite mientras se propaga un error. Declara `(err, req, res, next)` aunque nunca llames a `next`, y regístralo **después** de todas las rutas. En Express 5, la promesa rechazada de la ruta async se reenvía automáticamente a `next(err)`, así que, una vez corregida la firma, el manejador sí se ejecuta.',
  },
  'express-async-errors-v4-vs-v5': {
    prompt:
      "```js\napp.get('/users/:id', async (req, res) => {\n  const user = await repo.findById(req.params.id); // rejects: connection refused\n  res.json(user);\n});\n\napp.use((err, req, res, next) => {\n  res.status(500).json({ error: 'internal' });\n});\n```\n¿Qué pasa cuando `repo.findById` se rechaza en **Express 4** frente a **Express 5** (Node 20+)?",
    options: {
      a: 'Ambas versiones reenvían el rechazo al manejador de errores; el cliente recibe un 500 con un body JSON',
      b: 'Express 4 nunca ve el rechazo: se convierte en un unhandled rejection (que por defecto tumba el proceso en Node 15+) y la petición se queda colgada; Express 5 reenvía la promesa rechazada a `next(err)`, así que el manejador de errores responde con un 500',
      c: 'Express 4 lo reenvía al manejador de errores; Express 5 eliminó el reenvío automático de errores en favor de `try/catch`',
      d: 'Ambas versiones devuelven un 500 desde el manejador por defecto porque el manejador personalizado se declara después de la ruta',
    },
    explanation:
      'El router de Express 4 llama al handler e ignora su valor de retorno, así que una promesa rechazada se le escapa por completo. Las soluciones habituales en Express 4 eran envolver cada handler en `try/catch` + `next(err)`, un wrapper `asyncHandler(fn)` que hace `.catch(next)`, o el parche `express-async-errors`. Express 5 comprueba si un handler devuelve una promesa y llama a `next(err)` cuando se rechaza, tanto en middleware como en handlers de ruta. Aun así, **no** captura los errores lanzados más tarde dentro de callbacks como `setTimeout` o un event emitter, porque no forman parte de la promesa devuelta.',
  },
  'express-next-semantics': {
    prompt: '¿Qué afirmaciones sobre `next` en Express son verdaderas? Selecciona todas las que apliquen.',
    options: {
      a: '`next()` cede el control a la siguiente capa que coincide, en orden de registro',
      b: '`next(err)` con un `Error` se salta todo el middleware y las rutas que no son de error restantes y salta al middleware de manejo de errores',
      c: "`next('route')` se salta los callbacks restantes de la ruta actual; solo funciona dentro de handlers `app.METHOD` / `router.METHOD`, no en middleware de `app.use`",
      d: 'Llamar a `next()` después de `res.json()` es inofensivo porque Express detiene la cadena una vez que se envió la respuesta',
      e: 'Llamar a `next()` termina la función actual, así que el código escrito después nunca se ejecuta',
    },
    explanation:
      "Express no lleva la cuenta de si ya respondiste: si haces `res.json()` y luego `next()`, una capa posterior puede intentar escribir de nuevo y obtienes `ERR_HTTP_HEADERS_SENT` (\"Cannot set headers after they are sent to the client\"). `next()` es una llamada a función normal, así que el resto de tu función sigue ejecutándose cuando retorna; escribe `return next()` cuando quieras decir \"detente aquí\". `next('router')` es el hermano de `next('route')`: sale por completo de la instancia actual de `Router`.",
  },
  'express-route-order-param-shadowing': {
    prompt:
      "```js\nconst router = express.Router();\nrouter.get('/users/:id', getUserById);\nrouter.get('/users/me', getCurrentUser);\napp.use('/api', router);\n```\n¿Qué pasa con `GET /api/users/me`?",
    options: {
      a: 'Se ejecuta `getCurrentUser` porque los segmentos estáticos siempre les ganan a los parámetros',
      b: 'Se ejecuta `getUserById` con `req.params.id === "me"`, porque gana la primera ruta que coincide en orden de registro',
      c: 'Express lanza un error al arrancar porque las dos rutas son ambiguas',
      d: 'Se ejecutan ambos handlers, primero `getUserById` y luego `getCurrentUser`',
    },
    explanation:
      "Express no tiene un ranking de especificidad de rutas (a diferencia del router de radix tree de Fastify o del enrutamiento por archivos de Next.js, donde ganan los segmentos estáticos): prueba las capas en orden y ejecuta la primera coincidencia. Entonces `getUserById` responde (probablemente con un 404 o un error de conversión en la base de datos) y `getCurrentUser` queda inalcanzable. Soluciones: registra `/users/me` primero, o valida `id` dentro del handler. Express 5 usa path-to-regexp v8, que **eliminó** las restricciones con regex en línea como `/:id(\\\\d+)`, eliminó los parámetros opcionales con `?` en favor de llaves (`/users{/:id}`) y exige que los comodines tengan nombre (`/*splat`), así que el orden y la validación explícita importan todavía más después de actualizar.",
  },
  'express-error-handler-headers-sent': {
    prompt:
      "```js\napp.get('/export.csv', async (req, res) => {\n  res.setHeader('Content-Type', 'text/csv');\n  for await (const row of db.streamRows()) {\n    res.write(toCsv(row)); // the DB connection drops half-way\n  }\n  res.end();\n});\n\napp.use((err, req, res, next) => {\n  logger.error(err);\n  res.status(500).json({ error: 'internal' });\n});\n```\n¿Qué debería hacer el manejador de errores ante este fallo?",
    options: {
      a: 'Nada cambia; `res.status(500)` reemplazará el CSV parcial por un body JSON',
      b: 'Llamar a `res.end()` para que el cliente reciba una descarga 200 truncada pero "exitosa"',
      c: 'Comprobar primero `res.headersSent` y, si es true, delegar con `return next(err)` para que el manejador por defecto de Express destruya la conexión; enviar el JSON 500 solo cuando las cabeceras todavía no se hayan enviado',
      d: 'Reintentar el stream desde el principio dentro del manejador de errores',
    },
    explanation:
      "Una vez que la línea de estado y las cabeceras están en el cable, ya no puedes cambiar el código de estado. Intentarlo produce `ERR_HTTP_HEADERS_SENT` dentro de tu manejador de errores. La documentación de Express prescribe exactamente esta comprobación: si `res.headersSent`, llama a `next(err)` y deja que el manejador integrado cierre el socket. Así el cliente ve una transferencia abortada en lugar de un archivo truncado que parece completo. Terminar la respuesta limpiamente con `res.end()` es la peor opción, porque convierte un fallo en una pérdida silenciosa de datos.\n\n**Dilo en voz alta:** \"Un manejador de errores tiene que comprobar `res.headersSent`; una vez que empezó el streaming, la única señal honesta que queda es abortar la conexión, así que delego en el manejador por defecto de Express.\"",
  },
  'express-compose-middleware-fix': {
    prompt:
      "Este es un `compose` al estilo de Koa (el modelo detrás de las pilas de middleware que entienden promesas). Cada middleware recibe `(ctx, next)` y `next()` devuelve una promesa para **todo el resto de la cadena**. Tiene dos bugs:\n\n1. `await next()` no espera al middleware async posterior, así que la mitad \"de salida\" de la cebolla se ejecuta demasiado pronto.\n2. Llamar a `next()` dos veces desde el mismo middleware vuelve a ejecutar en silencio la cadena posterior; debe rechazar con `Error('next() called multiple times')`.\n\nCorrige **solo `compose`**. Los escenarios y `solution` que aparecen debajo son el arnés de pruebas. Los errores posteriores (síncronos o async) deben poder capturarse desde un `try { await next() } catch {}` anterior en la cadena.",
    explanation:
      "El `next` que se pasa a cada middleware debe **devolver** `dispatch(i + 1)`. Si no, quien llama espera `undefined`, que se resuelve en la siguiente microtarea mientras el trabajo posterior sigue pendiente. Devolver la promesa también es lo que permite que un rechazo posterior viaje de vuelta hasta el `try/catch` de quien llama; una promesa descartada, en cambio, se convierte en un unhandled rejection. La comprobación con `lastIndex` detecta la reentrada: `next()` desde el middleware `i` debe avanzar el índice más allá de `i` exactamente una vez. El `try/catch` alrededor de `fn(...)` convierte un throw síncrono en una promesa rechazada, así que quienes llaman ven un solo canal de errores.\n\nEl propio `next` de Express es de estilo callback y no devuelve nada; por eso Express 4 no podía ver los errores async y por eso Express 5 agregó el manejo de promesas rechazadas en el router.\n\n**Dilo en voz alta:** \"La composición de middleware es una cebolla: `next()` tiene que devolver una promesa para toda la cadena posterior; si no, el post-procesamiento se ejecuta demasiado pronto y los errores posteriores se escapan como unhandled rejections.\"",
  },
  'express-production-hardening': {
    prompt:
      'Una API en Express 5 va a salir a producción detrás de un balanceador de carga en Kubernetes. Explica qué agregas o configuras para endurecerla: cabeceras de seguridad, protección contra abuso, límites de peticiones, exposición de errores y comportamiento de apagado.',
    modelAnswer:
      "Las cabeceras de seguridad vienen de `helmet()`, registrado primero, más una allow-list estricta de CORS en lugar de `origin: '*'` con credenciales. Como la app está detrás de un proxy, configuro `app.set('trust proxy', 1)` (el número exacto de saltos) para que `req.ip` y `req.secure` sean correctos. Sin eso, el rate limiting basado en IP solo ve el balanceador. Agrego rate limiting (`express-rate-limit` respaldado por Redis para que los límites se mantengan entre réplicas), más estricto en las rutas de login y de restablecimiento de contraseña, y limito el tamaño de los bodies con `express.json({ limit: '100kb' })`. La validación ocurre en el borde con una librería de esquemas (zod o Joi), y un manejador de errores final devuelve un mensaje genérico sin stack traces mientras registra el error completo con un request id. `NODE_ENV=production`, `x-powered-by` deshabilitado y los timeouts del servidor (`headersTimeout`, `requestTimeout`, `keepAliveTimeout` más largo que el idle timeout del LB) completan el cuadro. Para el apagado ordenado manejo `SIGTERM`: pongo la readiness en fallo para que el LB deje de enrutar, llamo a `server.close()` para dejar de aceptar conexiones y drenar las peticiones en curso, cierro los pools de base de datos y las colas, y fuerzo la salida tras un plazo más corto que `terminationGracePeriodSeconds`. Las excepciones no capturadas se registran y el proceso termina para que el orquestador lo reinicie, en lugar de seguir corriendo en un estado desconocido.",
    rubric: [
      'Menciona helmet (cabeceras de seguridad) y una política de CORS restrictiva',
      'Agrega rate limiting con un store compartido y explica `trust proxy` para que las IPs de los clientes sean correctas detrás del LB',
      'Limita el tamaño del body, valida la entrada y oculta los stack traces en las respuestas de error mientras los registra con un correlation id',
      'Describe el apagado ordenado: SIGTERM, readiness en fallo, `server.close()` para drenar, cierre de recursos, salida forzada tras un timeout',
      'Menciona keep-alive/timeouts ajustados en relación con el balanceador de carga, o crash-and-restart ante excepciones no capturadas',
    ],
    explanation:
      "Los entrevistadores buscan defensa en capas y conciencia operativa, no una lista de paquetes de npm. Los dos detalles que distinguen a un senior son `trust proxy` (sin él, el rate limiting y las cookies seguras fallan en silencio) y una secuencia de apagado coordinada con el orquestador (primero la readiness, luego drenar, luego forzar la salida antes del SIGKILL).\n\n**Dilo en voz alta:** \"Con SIGTERM pongo la readiness en fallo, dejo de aceptar conexiones con `server.close()`, dreno las peticiones en curso, cierro los pools y salgo antes de que termine el periodo de gracia. Detrás de un proxy configuro `trust proxy` para que el rate limiting use la IP real del cliente.\"",
  },
};
