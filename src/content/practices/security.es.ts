// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  'security-web-basics-cookie-flags': {
    prompt:
      'Tu cookie de sesión se define con `Set-Cookie: sid=abc123; HttpOnly; Secure; SameSite=Lax; Path=/`. ¿Qué afirmaciones sobre estos atributos son verdaderas? Selecciona todas las que apliquen.',
    options: {
      a: '`HttpOnly` impide que el JavaScript de la página (`document.cookie`) lea la cookie, así que un payload de XSS no puede exfiltrarla directamente',
      b: '`Secure` significa que el navegador solo envía la cookie por HTTPS',
      c: '`SameSite=Lax` impide que el navegador adjunte la cookie a solicitudes `POST` cross-site y a solicitudes de subrecursos',
      d: '`HttpOnly` protege contra CSRF porque el atacante no puede leer la cookie',
      e: '`Secure` cifra el valor de la cookie para que no se pueda leer en la máquina del usuario',
    },
    explanation:
      '`HttpOnly` oculta la cookie de JavaScript, lo que limita el radio de impacto de un XSS (el atacante todavía puede actuar *como* el usuario desde la página, pero no puede robar la sesión para usarla después). `Secure` solo tiene que ver con el transporte; el valor se guarda en texto plano. `SameSite=Lax` envía la cookie en solicitudes same-site y en navegaciones `GET` de nivel superior, pero no en `POST`s cross-site, iframes ni `fetch`. El CSRF nunca necesita *leer* la cookie: el navegador la adjunta automáticamente, y por eso `HttpOnly` no hace nada contra CSRF y `SameSite` sí.',
  },
  'security-web-basics-cors-misconceptions': {
    prompt: 'Un compañero dice "nuestra API está a salvo del abuso porque CORS solo permite `https://app.example.com`". ¿Qué afirmación es correcta?',
    options: {
      a: 'Tiene razón: CORS impide que cualquier cliente que no sea `app.example.com` llame a la API',
      b: 'CORS lo aplican los navegadores y *relaja* la política de mismo origen para los orígenes que declaras; `curl`, los scripts y los servidores lo ignoran, así que no es control de acceso',
      c: '`Access-Control-Allow-Origin: *` junto con `Access-Control-Allow-Credentials: true` es la forma segura de permitir cookies desde cualquier origen',
      d: 'Como todo `POST` cross-origin pasa por preflight, CORS también previene el CSRF por completo',
    },
    explanation:
      'La política de mismo origen es la protección; CORS es la forma en que el servidor autoriza explícitamente a una página de otro origen a **leer** respuestas en el navegador. Los clientes que no son navegadores nunca lo revisan, así que la autenticación, la autorización y el rate limiting siguen siendo obligatorios. Los navegadores rechazan la combinación de `*` + credenciales; tienes que devolver un origen permitido específico. Y las solicitudes "simples" (un `POST` form-encoded sin headers personalizados) **no** pasan por preflight: la solicitud se envía con cookies y solo se oculta la respuesta, que es exactamente como funciona el CSRF clásico.',
  },
  'security-xss-escape-html': {
    prompt:
      'Implementa `solution(input)` para que escape como HTML un texto no confiable y así se pueda insertar de forma segura en el cuerpo de un elemento HTML o en el valor de un atributo **entre comillas**. Escapa exactamente estos caracteres:\n\n| carácter | entidad |\n|---|---|\n| `&` | `&amp;` |\n| `<` | `&lt;` |\n| `>` | `&gt;` |\n| `"` | `&quot;` |\n| `\'` | `&#39;` |\n\nSe escapa cada `&` de la entrada, incluido uno que ya parezca una entidad.',
    explanation:
      'Una sola pasada con una clase de caracteres es la forma más segura: cada carácter se reemplaza exactamente una vez. Con llamadas `.replace` encadenadas, `&` **tiene** que ir primero; si no, `<` se convierte en `&lt;` y luego su `&` se vuelve a escapar como `&amp;lt;`. El escape **depende del contexto**: esta función es correcta para el texto de un elemento y para atributos entre comillas, pero no para atributos sin comillas, URLs (`javascript:` sobrevive al escape), bloques `<script>` inline ni CSS. Por eso confías en el framework (React escapa los hijos de texto) y solo escribes tu propio escape en los bordes.',
  },
  'security-xss-escaping-vs-sanitizing': {
    prompt:
      'Los usuarios escriben reseñas de productos en un editor de texto enriquecido (negritas, cursivas, listas, enlaces), y las reseñas deben mostrarse **como HTML con formato** a otros usuarios. ¿Cuál es la defensa correcta contra el XSS almacenado?',
    options: {
      a: 'Escapar el HTML de la reseña al mostrarla, como harías con cualquier texto de usuario',
      b: 'Sanitizar con un sanitizador probado basado en allowlist (por ejemplo, DOMPurify) que conserve solo las etiquetas y los atributos permitidos, elimine los manejadores de eventos y las URLs que no sean `http(s)`, y respaldarlo con una CSP',
      c: 'Eliminar las etiquetas `<script>` con una expresión regular antes de guardar',
      d: 'Pasar la reseña por `encodeURIComponent` antes de insertarla',
    },
    explanation:
      'El **escape** convierte el markup en texto inerte; es lo predeterminado para los datos de usuario, pero mostraría literalmente las etiquetas `<b>` del autor de la reseña. Cuando tienes que renderizar HTML de usuario, lo **sanitizas**: lo parseas y conservas solo una allowlist de etiquetas, atributos y esquemas de URL. Las blocklists fallan: `<img src=x onerror=...>`, `<svg onload=...>` y `<a href="javascript:...">` no contienen ninguna etiqueta `<script>`, y las regex no parsean HTML. `encodeURIComponent` es para componentes de URL, no para HTML. Sanitiza al mostrar (o tanto al recibir como al mostrar) con una biblioteca mantenida, y agrega una Content Security Policy como segunda capa.',
  },
  'security-xss-react-vectors': {
    prompt: 'En una app de React, `bio`, `website` y `post` vienen de otros usuarios. ¿Cuáles de estos son vectores de XSS? Selecciona todas las que apliquen.',
    options: {
      c: '`<a href={website}>Website</a>` sin validar el esquema de la URL',
    },
    explanation:
      'React escapa los hijos de texto y los valores de atributos, así que `<p>{bio}</p>` y `<input defaultValue={bio} />` muestran el payload como texto inerte. `dangerouslySetInnerHTML` desactiva eso a propósito: el nombre es la advertencia, y la entrada se debe sanitizar primero. Asignar `innerHTML` mediante una ref se salta React por completo; los renderizadores de markdown dejan pasar HTML crudo sin problema a menos que se configuren para no hacerlo. `href` se escapa como cadena, pero su **significado** no se revisa: `javascript:alert(1)` sigue siendo una URL, y según la versión de React solo obtienes una advertencia en la consola. Usa una allowlist de `http:`/`https:` (y quizá `mailto:`) para las URLs que aportan los usuarios.',
  },
  'security-xss-csp-rollout': {
    prompt:
      'Tu app web de cinco años tiene bloques `<script>` inline, algunos manejadores `onclick="..."` y analítica de terceros. Tras un hallazgo de XSS, te piden agregar una Content Security Policy. **¿A qué política apuntas y cómo la despliegas sin romper producción?**',
    modelAnswer:
      'El objetivo es una política estricta basada en nonces: `script-src \'nonce-{random}\' \'strict-dynamic\'; object-src \'none\'; base-uri \'none\'; frame-ancestors \'self\'`, con un nonce nuevo generado por respuesta y agregado a cada `<script>` legítimo. `strict-dynamic` permite que esos scripts de confianza carguen sus propias dependencias, así que no tengo que mantener una allowlist de hosts frágil. `unsafe-inline` y `unsafe-eval` son lo que vuelve inútil a la CSP contra XSS, así que los manejadores `onclick` inline se deben refactorizar a llamadas `addEventListener`. Primero la publicaría como `Content-Security-Policy-Report-Only` con un endpoint `report-to`, observaría los reportes de violaciones durante algunas semanas, corregiría o permitiría explícitamente lo que sea legítimo (la analítica), y solo entonces pasaría a aplicarla. La CSP es defensa en profundidad: limita lo que puede hacer un payload inyectado, pero no reemplaza el escape de la salida ni la sanitización. También consideraría Trusted Types para blindar sinks del DOM como `innerHTML`.',
    rubric: [
      'Elige un `script-src` basado en nonces o hashes y rechaza `unsafe-inline` / `unsafe-eval`',
      'Sabe que, para una política estricta, hay que refactorizar y eliminar los manejadores de eventos inline',
      'Despliega con `Content-Security-Policy-Report-Only` y un endpoint de reportes antes de aplicarla',
      'Incluye directivas de endurecimiento como `object-src \'none\'`, `base-uri`, `frame-ancestors`',
      'Presenta la CSP como defensa en profundidad, no como reemplazo del escape y la sanitización',
    ],
    explanation:
      'Una CSP con `unsafe-inline` en `script-src` no bloquea casi nada, porque el XSS inyectado es script inline. Los nonces le permiten al navegador comprobar "¿este script lo puso aquí el servidor para esta respuesta?". El modo report-only es lo que hace seguro el cambio en una app legacy.\n\n**Dilo en voz alta:** "La CSP es mi segunda línea de defensa: un `script-src` basado en nonces con `strict-dynamic`, desplegado primero en modo report-only, para que aunque se cuele un bug de escape, el script inyectado no se ejecute."',
  },
  'security-csrf-samesite-enough': {
    prompt:
      'Tu app se autentica con una cookie de sesión configurada como `SameSite=Lax`. Un colega propone eliminar el middleware de tokens anti-CSRF porque "SameSite resolvió el CSRF". ¿Cuál es la mejor respuesta?',
    options: {
      a: 'Estar de acuerdo: con `SameSite=Lax` ninguna solicitud cross-site lleva la cookie',
      b: 'Estar de acuerdo solo si también cambias a `SameSite=None`, que es más estricto',
      c: 'Mantener una segunda capa: `Lax` sigue enviando la cookie en navegaciones `GET` cross-site de nivel superior (peligroso si algún `GET` cambia estado), y trata a los subdominios hermanos como same-site, así que un `blog.example.com` comprometido todavía puede falsificar solicitudes a `app.example.com`. Conserva los tokens o, como mínimo, verifica `Origin` en las solicitudes que cambian estado',
      d: 'No estar de acuerdo, porque los tokens CSRF son lo que detiene el XSS, y quitarlos vuelve a abrir la puerta al XSS',
    },
    explanation:
      '`SameSite=Lax` (el valor predeterminado en Chromium moderno cuando no se define) bloquea el clásico `POST` cross-site de un formulario oculto, lo que elimina la mayor parte del CSRF. Los huecos: **same-site no es same-origin** (cualquier subdominio bajo el mismo dominio registrable, incluido uno que corre un CMS viejo o contenido de usuarios, cuenta como same-site); las solicitudes `GET` en navegaciones de nivel superior siguen llevando la cookie, así que cualquier `GET` que cambie estado queda expuesto; y los clientes más viejos pueden no aplicarlo. `SameSite=None` es el valor **menos** estricto y requiere `Secure`. Los tokens CSRF (synchronizer o double-submit) o una verificación de `Origin`/`Sec-Fetch-Site` cuestan poco y cierran esos huecos. Los tokens CSRF no hacen nada contra el XSS: un script que corre en tu origen puede leer el token.\n\n**Dilo en voz alta:** "SameSite es un buen valor predeterminado, no una defensa completa: mantengo los GET sin efectos secundarios y sigo verificando un token CSRF o el header Origin en cada solicitud que cambia estado."',
  },
  'security-csrf-jwt-localstorage': {
    prompt:
      'Una SPA nueva guarda un JWT de 24 horas en `localStorage` y lo envía como `Authorization: Bearer`. El equipo argumenta que esto es *mejor* porque es inmune al CSRF. **¿Lo es? ¿Qué recomendarías en su lugar?**',
    modelAnswer:
      'Tienen razón sobre el CSRF: el navegador nunca adjunta automáticamente un valor de `localStorage`, así que un formulario cross-site no puede usarlo. Pero cambiaron el CSRF por un resultado peor ante un XSS: cualquier script inyectado, o cualquier dependencia de npm comprometida que corra en la página, puede leer el token y enviárselo a un atacante, que luego puede usarlo desde cualquier lugar durante las 24 horas completas. Los JWT son difíciles de revocar antes de que expiren, así que un token robado es una credencial de larga duración. Una cookie `HttpOnly` no la puede leer un script, así que un XSS todavía puede actuar dentro de la pestaña, pero no puede llevarse la sesión. Migraría a una cookie de sesión `HttpOnly; Secure; SameSite=Lax` (idealmente a través de un backend-for-frontend que guarde los tokens del lado del servidor), o mantendría un access token de vida corta en memoria con un refresh token en una cookie `HttpOnly` y rotación. La autenticación con cookies vuelve a necesitar protección contra CSRF: SameSite más un token CSRF o una verificación de `Origin`. Y sea cual sea el almacenamiento, prevenir el XSS (escape, sanitización, CSP) sigue siendo la verdadera prioridad.',
    rubric: [
      'Reconoce que los bearer tokens en `localStorage` no se envían automáticamente, así que el CSRF no aplica',
      'Explica que un XSS o una dependencia maliciosa puede leer y exfiltrar el token para reutilizarlo en otro lugar',
      'Menciona que la larga vida útil y la difícil revocación de los JWT amplifican el daño',
      'Recomienda cookies `HttpOnly` (BFF, o access token en memoria + refresh `HttpOnly` con rotación)',
      'Señala que la autenticación con cookies reintroduce el CSRF, que se maneja con SameSite más tokens o verificaciones de Origin',
    ],
    explanation:
      'Esta es una pregunta de trade-offs. Una respuesta floja es "localStorage es inseguro"; la respuesta fuerte nombra ambos ataques, compara su radio de impacto y elige sesiones basadas en cookies con defensas contra CSRF, porque el robo de tokens por XSS es la peor falla.\n\n**Dilo en voz alta:** "Los tokens en localStorage cambian el CSRF por el robo de tokens ante cualquier XSS. Prefiero una cookie HttpOnly, Secure y SameSite, idealmente a través de un BFF, y luego cierro el CSRF con un token o una verificación de Origin."',
  },
};
