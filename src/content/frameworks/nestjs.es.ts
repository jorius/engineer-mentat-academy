// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  'nestjs-module-exports-cross-module': {
    prompt:
      "```ts\n@Module({ providers: [UsersService] })\nexport class UsersModule {}\n\n@Module({ providers: [OrdersService], controllers: [OrdersController] })\nexport class OrdersModule {}\n\n@Injectable()\nexport class OrdersService {\n  constructor(private readonly users: UsersService) {}\n}\n```\nEl arranque falla con *\"Nest can't resolve dependencies of the OrdersService (?). Please make sure that the argument UsersService at index [0] is available in the OrdersModule context.\"* ¿Cuál es la solución correcta?",
    options: {
      a: 'Agrega `exports: [UsersService]` a `UsersModule` e `imports: [UsersModule]` a `OrdersModule`',
      b: 'Agrega `UsersService` también al array `providers` de `OrdersModule`',
      c: "Decora `UsersService` así:\n\n```ts\n@Injectable({ providedIn: 'root' })\nexport class UsersService {}\n```",
      d: 'Agrega `UsersModule` al array `exports` de `OrdersModule`',
    },
    explanation:
      "Los providers están **encapsulados** en el módulo que los declara. Otro módulo puede inyectar un provider solo si el módulo dueño lo incluye en `exports` y el consumidor incluye ese módulo en `imports`. Agregar `UsersService` a los `providers` de `OrdersModule` compila, pero crea una **segunda instancia independiente** de `UsersService` (y obliga a `OrdersModule` a satisfacer todas sus dependencias), lo que rompe cualquier estado en memoria o caché. `providedIn: 'root'` es de Angular, no de Nest. Los módulos `@Global()` existen, pero están pensados para unos pocos providers realmente transversales, como la configuración o el logging.",
  },
  'nestjs-unhandled-error-default-response': {
    prompt:
      "```ts\n@Get(':id')\nfindOne(@Param('id') id: string) {\n  const user = this.users.get(id);\n  if (!user) throw new Error(`User ${id} not found`);\n  return user;\n}\n```\nNo hay ningún exception filter personalizado registrado. ¿Qué recibe el cliente en `GET /users/42` cuando el usuario no existe?",
    options: {
      a: '`404` con este body:\n\n```json\n{\n  "message": "User 42 not found"\n}\n```',
      b: '`500` con este body:\n\n```json\n{\n  "statusCode": 500,\n  "message": "Internal server error"\n}\n```',
      c: '`500` con el mensaje de error y el stack trace, porque `NODE_ENV` no es `production`',
      d: 'Nada: la petición se queda colgada porque la excepción no es una `HttpException`',
    },
    explanation:
      "El exception filter global integrado de Nest convierte cualquier excepción que **no** sea una `HttpException` en un 500 genérico y la registra en el log, así que los detalles internos nunca se filtran. Para controlar el estado y el body, lanza una subclase de `HttpException`: `` throw new NotFoundException(`User ${id} not found`) `` produce `404` con `{ \"message\": \"User 42 not found\", \"error\": \"Not Found\", \"statusCode\": 404 }`. Los exception filters personalizados con `@Catch()` te permiten remodelar los errores de forma global (por ejemplo, mapear un `UserNotFoundError` de dominio o un código `P2025` de Prisma a 404) sin acoplar los servicios a HTTP.",
  },
  'nestjs-request-lifecycle-order': {
    prompt: '¿En qué orden pasa una petición HTTP de NestJS por los enhancers del framework?',
    options: {
      a: 'Middleware → Guards → Interceptors (antes) → Pipes → Handler de la ruta → Interceptors (después) → Exception filters (si hay error)',
      b: 'Middleware → Pipes → Guards → Interceptors (antes) → Handler de la ruta → Interceptors (después) → Exception filters (si hay error)',
      c: 'Guards → Middleware → Interceptors (antes) → Pipes → Handler de la ruta → Interceptors (después) → Exception filters (si hay error)',
      d: 'Middleware → Interceptors (antes) → Guards → Pipes → Handler de la ruta → Interceptors (después) → Exception filters (si hay error)',
    },
    explanation:
      "El middleware se ejecuta primero; es middleware normal de Express/Fastify y no sabe qué handler de Nest se va a ejecutar. Los **guards** deciden si la petición puede continuar, así que se ejecutan antes de cualquier trabajo de interceptors o pipes. Los **interceptors** envuelven al handler (código antes de `next.handle()` y operadores de RxJS después). Los **pipes** validan y transforman los argumentos del handler justo antes de la llamada. Las excepciones lanzadas por guards, interceptors, pipes o el handler van a los **exception filters**, que se resuelven desde el binding más específico hacia afuera (ruta, luego controller, luego global). Dentro de cada tipo de enhancer, el orden es global → controller → ruta. Una consecuencia que vale la pena mencionar: un guard ve la petición **cruda, sin validar**, porque los pipes de validación se ejecutan después.",
  },
  'nestjs-validation-pipe-query-transform': {
    prompt:
      "```ts\n// main.ts\napp.useGlobalPipes(new ValidationPipe());\n\n// list-query.dto.ts\nexport class ListQueryDto {\n  @IsInt()\n  @Min(1)\n  page: number;\n}\n\n// controller\n@Get()\nlist(@Query() query: ListQueryDto) { ... }\n```\n¿Qué pasa con `GET /products?page=2` y cuál es la solución?",
    options: {
      a: 'Funciona y `query.page` es el número `2`, porque el tipo de TypeScript le indica a Nest que lo convierta',
      b: 'Falla con 400 (`page must be an integer number`): los valores del query llegan como strings. Habilita `transform: true`, junto con la conversión implícita o con `@Type` en la propiedad:\n\n```ts\nnew ValidationPipe({\n  transform: true,\n  transformOptions: { enableImplicitConversion: true },\n});\n// or keep transform: true and add\n@Type(() => Number)\npage: number;\n```',
      c: 'Falla con 400; se soluciona poniendo `ParseIntPipe` en la propiedad `page` del DTO',
      d: 'Funciona, pero `query.page` es el string `"2"` porque los validadores ignoran los parámetros de query',
    },
    explanation:
      "Los tipos de TypeScript se borran en tiempo de ejecución; todo lo que viene en un query string o en la ruta es un string. `ValidationPipe` construye una instancia del DTO con class-transformer y ejecuta class-validator sobre ella, así que `@IsInt()` ve `\"2\"` y falla (`@Min(1)` también falla, así que el 400 lista ambos mensajes). `transform: true` hace que el pipe le pase al handler la **instancia transformada** (y convierte parámetros primitivos como `@Query('page') page: number`), mientras que `enableImplicitConversion` (que usa la metadata `design:type` reflejada) o un `@Type(() => Number)` explícito convierten la propiedad del DTO. `@Type` sin `transform: true` solo hace que la validación pase: el pipe le sigue entregando al handler el objeto plano original, así que `query.page` sigue siendo el string `\"2\"`. `ParseIntPipe` es un pipe de parámetro (`@Query('page', ParseIntPipe)`), no un decorador de propiedad. En producción agrega también `whitelist: true` (elimina las propiedades desconocidas) y a menudo `forbidNonWhitelisted: true` para bloquear la asignación masiva (mass assignment).",
  },
  'nestjs-guards-vs-middleware-roles': {
    prompt:
      "Quieres que `@Roles('admin')` en métodos individuales de un controller bloquee a los usuarios que no son admin. ¿Por qué se implementa como un **guard** y no como middleware?",
    options: {
      a: 'Los guards se ejecutan antes que el middleware, así que las peticiones no autorizadas se rechazan antes',
      b: 'Los guards reciben un `ExecutionContext` que expone el handler de destino y la clase del controller, así que pueden leer la metadata de `@Roles` con `Reflector`; el middleware se ejecuta antes de que Nest sepa qué handler se va a ejecutar',
      c: 'El middleware no puede leer cabeceras de la petición como `Authorization`',
      d: 'Los guards pueden modificar el body de la respuesta después de que se ejecuta el handler, algo que la autorización requiere',
    },
    explanation:
      "El `canActivate(context)` de un guard puede llamar a `this.reflector.getAllAndOverride(ROLES_KEY, [context.getHandler(), context.getClass()])` y comparar el resultado con `request.user.roles`. Devolver `false` produce `403 Forbidden`; lanzar `UnauthorizedException` produce un 401. El middleware sirve para la plomería de la autenticación (parsear el token, adjuntar `req.user`), pero no tiene idea de qué ruta ni qué decoradores aplican. La misma abstracción `ExecutionContext` también permite que un solo guard funcione para HTTP, WebSockets y microservicios. Registra un guard global con `{ provide: APP_GUARD, useClass: RolesGuard }` en un módulo en lugar de `app.useGlobalGuards(new RolesGuard())`, porque esto último se crea fuera del contenedor de DI y no puede inyectar `Reflector` ni otros providers.",
  },
  'nestjs-injection-scopes': {
    prompt: '¿Qué afirmaciones sobre los **injection scopes** de los providers de NestJS son verdaderas? Selecciona todas las que apliquen.',
    options: {
      a: 'Por defecto los providers son singletons: se crea una instancia al arrancar y la comparten todos los consumidores',
      b: 'Si un servicio es `Scope.REQUEST`, todo controller o provider que lo inyecte (directa o transitivamente) también se vuelve request-scoped y se vuelve a crear en cada petición',
      c: '`Scope.TRANSIENT` significa una instancia por petición entrante, compartida por todos los consumidores durante esa petición',
      d: 'El request scope tiene un costo real de asignación por petición; para contextos multi-tenant, los durable providers con una `ContextIdStrategy` permiten que Nest reutilice un subárbol por tenant en lugar de uno por petición',
      e: 'Un gateway de WebSocket puede depender de forma segura de providers request-scoped para guardar el estado del usuario por mensaje',
    },
    explanation:
      "El scope **se propaga hacia arriba** por la cadena de inyección: un controller que depende de un servicio request-scoped tiene que reconstruirse en cada petición, y así sucesivamente hacia arriba. Por eso un solo `@Injectable({ scope: Scope.REQUEST })` descuidado en lo profundo del grafo puede volver más lenta toda una funcionalidad sin que nadie lo note. `TRANSIENT` le da a **cada consumidor** su propia instancia dedicada, y no se propaga hacia arriba: un singleton que inyecta un provider transient mantiene una sola instancia durante toda su vida. Los gateways, y todo lo que deba comportarse como singleton (cron jobs, estrategias de Passport), no deberían depender de providers request-scoped. Prefiere pasar el contexto de forma explícita o usar `AsyncLocalStorage` (por ejemplo `nestjs-cls`) para datos con alcance de petición, como el id del tenant o un correlation id.\n\n**Dilo en voz alta:** \"Los singletons son el valor por defecto por una razón. El request scope se propaga hacia arriba por toda la cadena de dependencias y cuesta una asignación por petición, así que, para el contexto de la petición, recurro primero a AsyncLocalStorage o a durable providers.\"",
  },
  'nestjs-interceptor-tap-misses-errors': {
    prompt:
      "```ts\n@Injectable()\nexport class TimingInterceptor implements NestInterceptor {\n  constructor(private readonly metrics: Metrics) {}\n\n  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {\n    const start = Date.now();\n    return next.handle().pipe(\n      tap(() => this.metrics.observe(Date.now() - start)),\n    );\n  }\n}\n```\nRegistrado de forma global, este interceptor mide la latencia de las peticiones exitosas, pero no registra nada para las que fallan con un 500 desde el handler o con un 403 desde un guard. ¿Por qué?",
    options: {
      a: 'Los exception filters se ejecutan antes que los interceptors, así que el observable se completa vacío cuando hay un fallo',
      b: 'El callback de `tap` solo se ejecuta con los valores emitidos: una excepción del handler llega al interceptor como una notificación de **error** de RxJS y se lo salta (usa `finalize`, o pásale a `tap` un observer con un callback `error`). El rechazo de un guard ocurre **antes** de que se ejecuten los interceptors, así que el interceptor ni siquiera ve esas peticiones',
      c: 'Nest deshabilita los interceptors globales para las respuestas que no son 2xx, para evitar logs duplicados',
      d: 'Nadie se suscribe a `next.handle()` cuando hay fallos, porque Nest solo se suscribe cuando el handler se resuelve',
    },
    explanation:
      "Un interceptor envuelve al handler como un stream observable: el éxito es un `next` seguido de un `complete`, y el fallo es una notificación `error`. `tap(fn)` solo reacciona a `next`; `finalize(() => ...)` se ejecuta en complete, en error **y** al cancelar la suscripción, lo que lo convierte en el hook correcto para medir tiempos. Los interceptors también pueden transformar errores con `catchError` (por ejemplo, convertir un timeout en `RequestTimeoutException`). Los guards se ejecutan antes en el ciclo de vida, así que ninguna petición que rechacen llega a los interceptors. El logging de latencia o de accesos que deba cubrir todas las peticiones va en middleware (o en la capa del servidor HTTP o del proxy).\n\n**Dilo en voz alta:** \"Los interceptors ven al handler como un Observable, así que mido con `finalize`, no con `tap`. Para las métricas que deban incluir los rechazos de los guards, mido en middleware, porque los guards se ejecutan antes que los interceptors.\"",
  },
  'nestjs-circular-module-design': {
    prompt:
      '`OrdersModule` necesita `PaymentsService` para cobrarle a un cliente, y `PaymentsModule` necesita `OrdersService` para marcar un pedido como pagado cuando llega un webhook. Nest reporta una dependencia circular. ¿Cómo la resuelves y cómo estructuras los módulos para que no siga pasando?',
    modelAnswer:
      "`forwardRef()` en los imports de ambos módulos (`forwardRef(() => PaymentsModule)` en `OrdersModule`, `forwardRef(() => OrdersModule)` en `PaymentsModule`), más `@Inject(forwardRef(() => ...))` en los parámetros del constructor de los dos servicios, hace que arranque, pero solo esconde un problema de diseño y vuelve frágil el orden de inicialización, así que lo trato como último recurso. El ciclo indica que los dos módulos comparten un concepto o que uno se está metiendo en las responsabilidades del otro. Primera opción: invertir una dirección con eventos. Payments emite `PaymentSucceeded` (mediante `@nestjs/event-emitter`, CQRS o un message broker) y Orders se suscribe, así Payments ya no depende de Orders. Segunda opción: extraer la parte compartida (por ejemplo, un port `OrderStatus` o un `BillingModule` que orqueste a ambos) para que las dependencias apunten en un solo sentido. Mantengo los módulos alineados con bounded contexts y exporto solo un servicio facade acotado, nunca repositorios. La infraestructura realmente transversal (configuración, logging, base de datos) vive en módulos registrados una sola vez con `forRoot`/`forRootAsync` y marcados con `@Global()` con moderación. Una regla de lint sobre la dirección de los imports o una verificación del grafo de dependencias en CI (por ejemplo `madge` o `dependency-cruiser`) detecta los ciclos nuevos a tiempo.",
    rubric: [
      'Menciona `forwardRef`, pero explica por qué es un parche y no la solución',
      'Propone romper el ciclo con eventos de dominio (event emitter, CQRS o un broker) para que las dependencias apunten en un solo sentido',
      'Propone extraer un módulo compartido u orquestador, o una interfaz/port que pertenezca a uno de los lados',
      'Habla de los límites de los módulos: bounded contexts, exportar un facade acotado, uso moderado de `@Global()`',
      'Sugiere detección automática de ciclos (madge, dependency-cruiser, reglas de lint)',
    ],
    explanation:
      "Los entrevistadores preguntan esto para ver si tratas un error del framework como una señal de diseño. Los juniors recurren a `forwardRef`; los seniors se preguntan por qué los dos módulos se conocen entre sí y eliminan una de las direcciones de la dependencia.\n\n**Dilo en voz alta:** \"`forwardRef` hace que arranque, pero mantiene el acoplamiento. Rompo el ciclo haciendo que Payments publique un evento `PaymentSucceeded` que maneja Orders, así la dependencia apunta en un solo sentido.\"",
  },
};
