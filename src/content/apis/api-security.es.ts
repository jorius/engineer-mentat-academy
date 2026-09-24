// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  'api-security-jwt-payload-readable': {
    prompt:
      'Después del login tu API devuelve un JWT firmado (`header.payload.signature`, HS256 o RS256) que el cliente envía como `Authorization: Bearer <token>`. ¿Qué afirmación es verdadera?',
    options: {
      a: 'El payload está cifrado, así que es seguro poner en él el hash de la contraseña del usuario o datos personales (PII)',
      b: 'Cualquiera que tenga el token puede leer el payload (es base64url); la firma solo le permite al servidor detectar manipulaciones y verificar quién lo emitió',
      c: 'El servidor debe buscar el token en su base de datos en cada petición; de lo contrario, no puede saber si el token es válido',
      d: 'Cerrar la sesión del usuario invalida de inmediato todas las copias del token',
    },
    explanation:
      'Un JWT está **firmado, no cifrado** (a menos que uses JWE). Pega uno en cualquier decodificador y los claims están ahí a la vista, así que nunca pongas secretos en él. La firma (HMAC con un secreto compartido, o RSA/ECDSA con un par de claves) prueba que el token lo emitió alguien que tiene la clave y que no fue modificado.\n\nEso hace que los JWT sean **stateless**: el servidor verifica la firma, `exp`, `iss` y `aud` sin consultar la base de datos, así que no hace falta una verificación en la base de datos por petición. La contracara es que cerrar la sesión **no** invalida las copias ya emitidas: un token robado sigue siendo válido hasta que expira. Lo mitigas con access tokens de vida corta (de 5 a 15 min), rotación de refresh tokens y una denylist de ids de token (`jti`) solo cuando necesitas revocación instantánea.\n\nLa autenticación responde *quién eres*; los claims del token (roles, scopes) son entradas para la autorización, que igual debes aplicar en cada petición.',
    hint: 'Recuerda si base64url es codificación o cifrado, y qué puede y qué no puede garantizar una firma sobre un token sin estado.',
  },
  'api-security-bola-object-level-authz': {
    prompt:
      'Un cliente inicia sesión, abre `GET /api/invoices/1041` (su propia factura), luego edita la URL a `/api/invoices/1042` y ve la factura de otra empresa. El token era válido y no había expirado. ¿Qué falló y cuál es la solución?',
    options: {
      a: 'Falló la autenticación; agrega MFA para que los atacantes no puedan iniciar sesión',
      b: 'Falló la autorización a nivel de objeto (BOLA/IDOR); cada búsqueda debe verificar que la factura pertenece al tenant de quien llama, p. ej. `WHERE id = :id AND tenant_id = :tokenTenant`',
      c: 'Los ids son adivinables; cambiar a UUIDs corrige la vulnerabilidad',
      d: 'CORS está mal configurado; restringir los orígenes permitidos bloquearía la petición',
    },
    explanation:
      'La **autenticación** (quién eres) funcionó: el token era auténtico. La **autorización** (qué puedes hacer *con este objeto*) nunca se verificó. Esto es **Broken Object Level Authorization**, el #1 del OWASP API Security Top 10, también conocido como IDOR.\n\nLa corrección va en la ruta de acceso a los datos, no en la UI: acota cada consulta por el tenant o la propiedad de quien llama, tomados **del token verificado**, nunca de un parámetro de la petición, y devuelve `404` (no `403`) para no confirmar que el objeto existe. Row-level security en Postgres es un buen respaldo.\n\nCambiar a UUIDs es solo defensa en profundidad: hacen que los ids sean más difíciles de adivinar, pero se filtran por logs, enlaces compartidos y otros endpoints, y no agregan ninguna verificación de permisos. Restringir los orígenes de CORS es irrelevante; CORS no impide que un usuario con sesión iniciada llame a la API directamente.',
    hint: 'Separa la autenticación de la autorización, y pregúntate cuál de las dos prueba el token válido y cuál más necesitaba esta petición.',
  },
  'api-security-cognito-authorizer-scope': {
    prompt:
      'API Gateway está delante de tu Lambda con un **Cognito user pool authorizer**. Los usuarios inician sesión con Cognito y envían el ID token o el access token en cada llamada. ¿Cuál de estas cosas **sigue siendo responsabilidad de tu código**?',
    options: {
      a: 'Verificar la firma del token contra el JWKS del user pool',
      b: 'Rechazar los tokens expirados',
      c: 'Verificar que quien llama puede actuar sobre el recurso específico, p. ej. que la orden 55 pertenece a `claims.sub` o que el usuario está en el grupo `admins`',
      d: 'Guardar y hashear las contraseñas de los usuarios',
    },
    explanation:
      '**Cognito** es el proveedor de identidad: guarda los usuarios y los hashes de las contraseñas, maneja el registro, el inicio de sesión y MFA, federa con proveedores sociales y SAML/OIDC, y emite JWTs (ID, access y refresh tokens). El **authorizer de Cognito en API Gateway** valida el token (la firma con el JWKS del pool, la expiración, el emisor y, para los access tokens, los scopes de OAuth que configures) antes de que se ejecute tu Lambda, y pasa los claims en `requestContext.authorizer`.\n\nLo que ninguno de los dos puede saber es tu regla de dominio: *este* usuario puede leer *esta* orden. Esa verificación a nivel de objeto, más las verificaciones de rol a partir de `cognito:groups` o de claims personalizados, vive en tu servicio. En resumen: Cognito te da autenticación y scopes de grano grueso; tú eres responsable de la autorización de grano fino.',
    hint: 'Recuerda qué administra un user pool de Cognito y qué verifica el authorizer de API Gateway antes de que tu Lambda se ejecute.',
  },
  'api-security-fixed-window-boundary-burst': {
    prompt:
      'Tu limitador permite **100 peticiones por minuto** usando un contador de **ventana fija** con la key `apiKey:currentMinute`. Un cliente envía 100 peticiones a las 12:00:59 y otras 100 a las 12:01:00. ¿Cuántas se aceptan y qué algoritmo evita esto?',
    options: {
      a: '100; una ventana fija ya garantiza como máximo 100 peticiones en cualquier intervalo de 60 segundos',
      b: '200; el contador se reinicia en el límite del minuto. Una ventana deslizante (log o contador ponderado) o un token bucket acota la ráfaga',
      c: '101; se deja pasar una petición cuando la ventana cambia',
      d: '200; solo un límite por IP en lugar de un límite por API key evita esto',
    },
    explanation:
      'Una ventana fija cuenta por bloque de calendario, así que un cliente puede gastar una cuota completa al final de una ventana y otra cuota completa al inicio de la siguiente: **2 veces el límite en dos segundos**.\n\n- **Sliding window log**: guarda el timestamp de cada petición y cuenta las de los últimos 60 s. Es exacto, pero la memoria crece con el límite.\n- **Sliding window counter**: pondera el conteo de la ventana anterior según cuánto de ella todavía se superpone (`prev * (1 - elapsed/60) + current`). Barato y suficientemente preciso; común con Redis.\n- **Token bucket**: un bucket de `capacity` tokens que se rellena a una tasa constante; cada petición consume uno. **Permite ráfagas hasta la capacidad** de forma deliberada mientras impone el promedio a largo plazo, que normalmente es lo que quieres para las APIs (el throttling de AWS API Gateway lo usa).\n\nLa elección de la key (API key, usuario, IP) es una decisión separada del algoritmo.',
    hint: 'Imagina el contador a cada lado del cambio de minuto, y luego revisa si cada solución propuesta cambia lo que mide la ventana o solo a quién se cuenta.',
  },
  'api-security-token-bucket-allow': {
    prompt:
      'Implementa la función de decisión de un rate limiter de **token bucket**, `allow(timestamps, capacity, refillPerSec)`, exportada como `solution`.\n\n- `timestamps` son los tiempos de llegada de las peticiones en **milisegundos**, en orden ascendente.\n- El bucket empieza **lleno**, con `capacity` tokens, en el tiempo de la primera petición.\n- Los tokens se rellenan de forma continua a `refillPerSec` tokens por segundo, nunca por encima de `capacity`.\n- Una petición se permite si hay al menos 1 token disponible, y entonces consume 1 token. Las peticiones rechazadas no consumen nada.\n\nDevuelve un boolean por petición.',
    explanation:
      'El truco es el **relleno perezoso**: ningún temporizador va agregando tokens. En cada petición calculas cuántos tokens se acumularon desde la anterior, `elapsed * rate`, los sumas y **los limitas a la capacidad** (sin ese tope, un cliente inactivo durante una hora podría disparar miles de peticiones de golpe). Luego gastas un token o rechazas.\n\nPor eso el estado por key son solo dos números, `tokens` y `lastRefill`, que caben en un hash de Redis. En un entorno distribuido, el leer-rellenar-decrementar debe ser **atómico** (un script Lua, o `WATCH` más `MULTI`/`EXEC` con reintento ante conflicto; `MULTI` por sí solo no puede leer el conteo y decidir según él), o dos instancias compiten y ambas gastan el último token. Una llamada rechazada devuelve `429` con `Retry-After = ceil((1 - tokens) / rate)` segundos.\n\n**Dilo en voz alta:** "Un token bucket guarda solo los tokens y un timestamp por key, se rellena de forma perezosa en cada petición con tope en la capacidad, lo que permite ráfagas controladas mientras impone la tasa promedio, y en Redis el verificar-y-decrementar tiene que ser un único script atómico."',
    hint: 'Recarga según el tiempo transcurrido desde la petición anterior en vez de usar un temporizador, y cuida la conversión de milisegundos a segundos.',
  },
  'api-security-distributed-rate-limiting': {
    prompt:
      'Tu API corre en 12 contenedores detrás de un load balancer. Cada instancia tiene un limitador en memoria de 100 req/min por API key; aun así, un partner reporta que puede enviar ~1 000 req/min, y un cliente abusivo ataca tu endpoint de login desde miles de IPs. ¿Cómo rediseñas el rate limiting?',
    modelAnswer:
      'Los limitadores en memoria se multiplican por el número de instancias (12 x 100), y el load balancer reparte las peticiones, así que el límite tiene que vivir en estado compartido: un token bucket o un sliding window counter en Redis, actualizado de forma atómica con un script Lua, con la key de la identidad a la que pertenece la cuota (API key o id de usuario, no solo la IP, por culpa del NAT y la rotación de IPv6). La protección gruesa y barata va en el borde: las reglas basadas en tasa de AWS WAF y el throttling de API Gateway absorben las avalanchas antes de que consuman cómputo (los usage plans agregan cuotas por key, pero AWS los documenta como best-effort, así que WAF es el control duro en el borde). Para el endpoint de login limito por cuenta (intentos fallidos por nombre de usuario) además de por IP, agrego bloqueo exponencial o CAPTCHA después de los fallos, y alerto sobre patrones de credential stuffing. Las respuestas usan `429` con `Retry-After` y headers `RateLimit` para que los buenos clientes reduzcan el ritmo. Decido explícitamente qué pasa cuando Redis está caído: normalmente fail open con un limitador local de respaldo para el tráfico general, y fail closed para las rutas costosas o sensibles. Por último, las distintas rutas tienen distintos presupuestos: una exportación de reportes o una llamada a un LLM cuesta mucho más que un GET, así que las pondero.',
    rubric: [
      'Explica por qué los límites en memoria por instancia se multiplican con el escalado horizontal',
      'Usa estado compartido y atómico (Redis + Lua) con la key correcta (API key/usuario, no solo IP)',
      'Pone límites en capas: borde (reglas basadas en tasa de WAF, throttling de API Gateway) más nivel de aplicación',
      'Defensas específicas del login: límites por cuenta, bloqueo/CAPTCHA, detección de credential stuffing',
      'Devuelve 429 + Retry-After y tiene una decisión explícita de fail open/fail closed',
    ],
    explanation:
      'El bug es de arquitectura, no de algoritmo: un limitador es tan global como su estado. Las respuestas senior también separan la **aplicación de cuotas** (equidad entre clientes, con la API key como key) de la **defensa contra abusos** (por cuenta, reputación de IP, dispositivo), porque un solo algoritmo con la IP como key no hace bien ninguna de las dos cosas.\n\n**Dilo en voz alta:** "Los rate limits tienen que vivir en estado compartido y atómico, con la key de la identidad dueña de la cuota, en capas con throttling en el borde, con límites por cuenta en el login y una decisión explícita de fail open o fail closed cuando el almacén del limitador está caído."',
    hint: 'Cubre dónde vive el estado del limitador (un almacén compartido con operaciones atómicas), y separa la cuota por clave de la defensa contra abuso basada en algo más que la IP.',
  },
  'api-security-public-endpoint-controls': {
    prompt:
      'Expones un endpoint `POST /contact` **público y sin autenticación** que usa tu sitio de marketing. ¿Qué medidas lo protegen realmente? Selecciona todas las que apliquen.',
    options: {
      a: 'Rate limiting por IP (y global), devolviendo `429` con `Retry-After`',
      b: 'Validación del schema en el servidor: tipos, longitudes máximas, solo campos permitidos, rechazo de propiedades desconocidas',
      c: 'Una allowlist de CORS que contiene solo el dominio de marketing, lo que impide que bots y scripts llamen al endpoint',
      d: 'Confiar en la validación del lado del cliente del formulario, ya que la única UI que lo llama es la tuya',
      e: 'Queries parametrizadas al guardar el mensaje, y codificación de salida dondequiera que se muestre después (p. ej. la bandeja de entrada de administración)',
    },
    explanation:
      '- El **rate limiting** por IP y global limita la fuerza bruta, el spam y los DoS; agrega un CAPTCHA o proof-of-work si el abuso persiste.\n- La **validación del schema en el servidor** es la regla central: **nunca confíes en el input**. Valida en la frontera (zod, class-validator, JSON Schema) con allowlists y límites de tamaño; esto también bloquea la asignación masiva de campos que no pretendías aceptar.\n- Las **queries parametrizadas más la codificación de salida** se ocupan del input que *sí* aceptaste: las queries parametrizadas evitan la inyección SQL, y la codificación de salida (más una CSP) evita el XSS almacenado cuando un administrador ve el mensaje.\n\nLa allowlist de CORS es el malentendido clásico: **CORS lo aplican los navegadores**, y solo controla si una página de otro origen puede *leer* la respuesta. `curl`, los scripts y los bots lo ignoran por completo. La validación del lado del cliente tampoco protege: los atacantes no usan tu formulario. La validación del lado del cliente es UX, no seguridad.',
    hint: 'Relaciona cada medida con el abuso que frenaría (avalanchas de peticiones, entradas mal formadas, contenido inyectado), y recuerda dónde y quién aplica cada una.',
  },
  'api-security-token-storage-csrf': {
    prompt:
      'Tu SPA en React en `app.acme.io` llama a `api.acme.io`. Un colega guarda el access token JWT en `localStorage`; otro dice que hay que usar cookies. ¿Dónde guardas los tokens y qué configuración de CORS y CSRF requiere tu elección?',
    modelAnswer:
      'Todo lo que está en `localStorage` lo puede leer cualquier script de la página, así que un solo XSS (o una dependencia de npm comprometida) exfiltra un token que el atacante puede reutilizar desde cualquier lugar hasta que expire. Prefiero guardar el refresh token en una cookie `HttpOnly; Secure; SameSite` acotada a la ruta de autenticación, y el access token de vida corta solo en memoria, rotando el refresh token en cada uso (si se reutiliza uno viejo, se revoca toda la familia); al recargar, la SPA llama al endpoint de refresh para obtener un nuevo access token (o voy más allá con un BFF que guarda los tokens del lado del servidor y le da al navegador solo una cookie de sesión). Las cookies se envían automáticamente, lo que reintroduce CSRF, así que configuro `SameSite=Lax` o `Strict` (app y api son del mismo sitio bajo acme.io), mantengo las rutas que cambian estado fuera de GET y agrego un token CSRF (double-submit o synchronizer) o verificaciones estrictas del header `Origin` como defensa en profundidad. CORS debe permitir exactamente `https://app.acme.io` con `Access-Control-Allow-Credentials: true`; el comodín `*` no está permitido con credenciales, y reflejar cualquier `Origin` de vuelta es una mala configuración grave porque permite que cualquier sitio haga lecturas con credenciales. HttpOnly no vuelve inofensivo al XSS (el atacante todavía puede hacer peticiones desde la página de la víctima), así que una CSP estricta y la codificación de salida siguen siendo necesarias.',
    rubric: [
      'Explica el riesgo de exfiltración por XSS de localStorage y por qué las cookies HttpOnly o los tokens en memoria lo reducen',
      'Reconoce que las cookies traen CSRF y nombra SameSite más un token CSRF o verificaciones de Origin',
      'CORS con credenciales correcto: origen explícito, Allow-Credentials en true, sin comodín, nunca reflejar orígenes arbitrarios',
      'Access tokens de vida corta con rotación de refresh tokens (o un BFF que guarda los tokens del lado del servidor)',
      'Señala que HttpOnly limita el robo de tokens pero no el XSS en sí, así que la CSP y la codificación siguen importando',
    ],
    explanation:
      'No hay opción de almacenamiento sin concesiones; el entrevistador quiere oírte emparejar cada elección con el ataque que habilita. localStorage cambia inmunidad a CSRF por robo de tokens vía XSS; las cookies cambian resistencia al robo vía XSS por CSRF, que SameSite más tokens manejan bien.\n\nUna distinción útil: **CORS** decide si otro origen puede *leer* tus respuestas (una relajación de la same-origin policy en el navegador), mientras que **CSRF** trata de otro origen que *envía* una petición que el navegador adorna con tus cookies. CORS no detiene CSRF.\n\n**Dilo en voz alta:** "Guardo el access token en memoria y el refresh token en una cookie HttpOnly, Secure y SameSite, así que un XSS no puede robar el refresh token de larga duración (todavía puede actuar como el usuario, por eso la CSP sigue importando); como las cookies traen de vuelta CSRF, me apoyo en SameSite más un token CSRF o verificaciones de Origin, y CORS permite exactamente el origen de mi app con credenciales, nunca un comodín ni un origen reflejado."',
    hint: 'Empareja cada opción de almacenamiento con el ataque que abre (robo por XSS o CSRF), y luego cubre `HttpOnly`, `SameSite`, las credenciales de CORS y por qué CORS no protege contra CSRF.',
  },
};
