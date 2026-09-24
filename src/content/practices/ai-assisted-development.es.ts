// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  'ai-assisted-development-tooling-responsible-use': {
    prompt:
      'Tu equipo adoptó asistentes de código con IA (Copilot, Claude Code, Cursor). Como ingeniero senior, **¿cómo los usas en una base de código de producción y qué reglas establecerías para el equipo?**',
    modelAnswer:
      'Trato al asistente como un compañero junior rápido de pair programming: útil para boilerplate, para explorar una base de código desconocida y para hacer borradores de tests y refactors, pero todo lo que produce es mi código en cuanto hago commit, así que recibe la misma revisión que el pull request de un colega. Los tests son el contrato: primero escribo, o al menos reviso, los tests que fallan a partir de los requisitos, y luego dejo que la herramienta implemente contra ellos, para que los tests no se deriven del código generado. Escribo el prompt con restricciones, como la versión del lenguaje, los patrones y archivos existentes a seguir, "sin dependencias nuevas", los casos borde y el manejo de errores que espero, y pido diffs pequeños que de verdad pueda leer. No confío en la salida en código sensible para la seguridad (auth, criptografía, manejo de entradas), en APIs de bibliotecas que puede inventar o recordar de una versión anterior, ni en nombres de paquetes, que verifico que existan y estén mantenidos antes de instalarlos. Para el equipo establecería reglas: nada de secretos ni datos de clientes en los prompts, respetar la licencia y la política de datos de la herramienta, mantener sin cambios el CI, el linting y la revisión de código, y que cada autor pueda explicar cada línea que envía. Usado así, acelera el tecleo, mientras que el razonamiento, la verificación y la responsabilidad se quedan con el ingeniero.',
    rubric: [
      'Se hace dueño del código generado: el mismo estándar de revisión que el código humano, y el autor puede explicar cada línea',
      'Usa los tests como contrato, escritos o revisados de forma independiente de la implementación generada',
      'Escribe prompts con restricciones explícitas (patrones, versiones, sin dependencias nuevas, casos borde) y pide diffs pequeños y revisables',
      'Nombra dónde no confiar en la salida: código sensible para la seguridad, APIs alucinadas u obsoletas, paquetes inventados',
      'Establece reglas para el equipo: nada de secretos ni datos de clientes en los prompts, licencias y política de datos, CI y revisión sin cambios',
    ],
    explanation:
      'Los entrevistadores no están evaluando entusiasmo ni escepticismo; quieren escuchar que obtienes la velocidad sin renunciar a la verificación ni a la responsabilidad.\n\n**Dilo en voz alta:** "La IA escribe un borrador; el resultado es mío. Los tests son el contrato, reviso cada diff como si lo hubiera escrito un colega nuevo, y nunca confío ciegamente en ella en seguridad, en APIs que podría inventar ni en dependencias."',
    hint:
      'Cubre dónde ayudan los asistentes y dónde engañan, quién es dueño de la salida y la revisa, y qué nunca debe pegarse en un prompt.',
  },
  'ai-assisted-development-tooling-tautological-tests': {
    prompt:
      'Le pides a un asistente que "implemente `calculateRefund()` y escriba tests para esa función". Devuelve la función y 12 tests que pasan, con 100% de cobertura. ¿Cuál es el principal riesgo?',
    options: {
      a: 'Ninguno: el 100% de cobertura y los tests en verde demuestran que la función es correcta',
      b: 'Los tests se derivaron de la implementación generada, así que codifican lo que sea que haga, bugs incluidos; comprueban que el código hace lo que hace, no lo que exigen las reglas de negocio',
      c: 'Los tests generados siempre corren más lento que los escritos a mano',
      d: 'Los tests van a fallar con la siguiente versión del modelo',
    },
    explanation:
      'Los tests generados a partir de la implementación son **tautológicos**: si la función redondea los reembolsos hacia abajo en lugar de hacia arriba, el valor esperado en el test se calculó de la misma forma equivocada. La cobertura solo demuestra que las líneas se ejecutaron, no que las aserciones sean correctas. Mantén los tests como un contrato independiente: deriva los casos de los requisitos (reembolso parcial después de 30 días, redondeo de moneda, orden ya reembolsada), escríbelos o revísalos antes de generar la implementación y comprueba que cada uno falle cuando rompes el código.',
    hint: 'Recuerda qué mide la cobertura de código y qué no puede decirte, y luego pregúntate cómo se produjeron estas pruebas.',
  },
  'ai-assisted-development-tooling-prompt-constraints': {
    prompt:
      'Necesitas un input de búsqueda con debounce en una base de código existente de React 18 + TypeScript. ¿Qué prompt tiene más probabilidades de producir código que puedas mergear con poco retrabajo?',
    options: {
      a: '"Escribe una caja de búsqueda."',
      b: '"Escribe el mejor componente de búsqueda con debounce posible usando las mejores prácticas modernas."',
      c: '"Agrega debounce a `SearchInput.tsx` (React 18, TypeScript strict). Sigue el patrón de `useDebouncedValue.ts`, 300 ms de retraso, sin dependencias nuevas, cancela la llamada pendiente al desmontar y conserva las props existentes. Haz que pasen los tests de `SearchInput.test.tsx`."',
      d: '"Copia cómo hace Google las sugerencias de búsqueda."',
    },
    explanation:
      'Los buenos prompts se leen como un buen ticket: el archivo exacto, el stack y las versiones, un patrón existente a seguir, restricciones explícitas ("sin dependencias nuevas", conservar las props), el caso borde que suele olvidarse (la limpieza al desmontar) y una meta objetiva (que pasen los tests). Los prompts vagos producen código genérico que ignora tus convenciones, mete una biblioteca o apunta a otra versión del framework, y el tiempo ahorrado al teclear se pierde en la revisión.',
    hint: 'Imagina al asistente leyendo cada prompt sin acceso a tu código ni a tu cabeza: ¿qué tendría que adivinar?',
  },
  'ai-assisted-development-tooling-hallucinated-package': {
    prompt:
      'Mientras corriges un bug de refresh de tokens, el asistente te dice que ejecutes `npm install react-query-auth-refresh` e importes `useSilentRefresh` desde ese paquete. Nunca habías oído hablar de él. ¿Qué haces?',
    options: {
      a: 'Instalarlo; el asistente no sugeriría un paquete que no existe',
      b: 'Verificarlo primero: revisar el registry y el repositorio (si existe, quién lo publica, descargas, mantenimiento reciente, licencia), confirmar que la API que sugirió es real y preferir resolverlo con las dependencias que ya tienes; un nombre plausible pero inexistente es exactamente lo que los atacantes registran como malware',
      c: 'Instalarlo, pero solo en `devDependencies`, para que no pueda llegar a producción',
      d: 'Preguntarle al asistente si el paquete es seguro e instalarlo si dice que sí',
    },
    explanation:
      'Los modelos generan nombres y APIs **plausibles**, no verificados. Los atacantes vigilan los nombres de paquetes alucinados y publican paquetes maliciosos con esos nombres ("slopsquatting", un pariente del typosquatting), y un `npm install` ejecuta scripts de instalación en tu máquina y en CI, así que `devDependencies` no protege nada. Pedirle al modelo que responda por su propia salida no es verificar. Revisa el registry y el código fuente, confirma la API contra la documentación real y pregúntate si una dependencia nueva se justifica en absoluto; además, la lógica de refresh de autenticación es código sensible para la seguridad que merece un escrutinio extra.',
    hint: 'Recuerda cómo funcionan la alucinación de nombres de paquetes y los ataques de typosquatting, y qué verifica realmente cada opción.',
  },
};
