// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  'clean-code-intention-revealing-names': {
    prompt:
      '```js\nconst d = 86400000;\nfunction chk(u) {\n  return Date.now() - u.lc > 30 * d;\n}\n```\n¿Qué reescritura comunica mejor la intención?',
    options: {
      c: 'Mantener los nombres y agregar comentarios: `// one day in ms` sobre `d` y `// true if the user is inactive` sobre `chk`',
    },
    explanation:
      'Los buenos nombres responden al *qué* y al *por qué*, así los comentarios dejan de ser necesarios: un predicado se lee como una pregunta (`isInactive`, `hasAccess`, `canRetry`), las unidades viven en el nombre (`MS_PER_DAY`, `lastLoginAt`) y el número de negocio recibe un nombre para que no sea un `30` mágico. `check` oculta qué se verifica, los comentarios que repiten el código se desactualizan, y los nombres que narran la implementación son ruido que hay que cambiar cada vez que cambia el código.',
    hint: 'Los buenos nombres dicen qué y por qué: los predicados se leen como preguntas, las unidades van en el nombre y los números de negocio no son mágicos. Cuidado con nombres crípticos y narrativos.',
  },
  'clean-code-positional-flags-to-options': {
    prompt:
      '```js\ncreateUser(name, email, isAdmin, isActive, sendWelcome)\n```\n`createUser` recibe tres booleanos posicionales, y la llamada en `solution` ya confundió dos de ellos. Refactoriza `createUser` para que reciba **un único objeto de opciones** con los valores por defecto `isAdmin = false`, `isActive = true`, `sendWelcome = false`, y actualiza la llamada para que cada flag se pase por nombre. Los campos de `request` que falten deben usar esos valores por defecto.',
    explanation:
      'Una llamada como `createUser(n, e, false, true, false)` es ilegible, e intercambiar dos booleanos compila, pasa el chequeo de tipos y llega a producción. Un objeto de parámetros nombra cada argumento en el punto de llamada, hace que el orden no importe, y los valores por defecto en la desestructuración documentan el comportamiento por defecto en la firma. Los valores por defecto de la desestructuración solo se aplican a `undefined`, así que un `false` explícito se respeta. Con más de tres parámetros, o con cualquier booleano, prefiere un objeto de opciones. Un booleano que alterna entre dos *comportamientos* (no dos valores) es un olor más fuerte: divídelo en dos funciones.',
    hint: 'Usa desestructuración de objetos con valores por defecto en la firma, y recuerda que esos valores solo se aplican cuando un campo es `undefined`.',
  },
  'clean-code-pure-discount': {
    prompt:
      'El checkout muestra una vista previa del descuento y luego aplica el mismo descuento al pagar. Los clientes reportan que el total cobrado es menor que el de la vista previa. Convierte `applyDiscount` en una **función pura**: debe devolver un carrito nuevo y dejar intacta su entrada. Deja sin cambios el helper de redondeo y `solution`.',
    explanation:
      'El código inicial muta el carrito de quien llama, así que la segunda llamada descuenta precios ya descontados (22.5 pasa a 20.25). Una función pura depende solo de sus entradas y no tiene efectos secundarios, así que llamarla dos veces da la misma respuesta y es trivial de probar. Fíjate en que `{ ...cart }` por sí solo no alcanza: es una copia superficial y `items` seguiría compartido, así que también se copia cada item.\n\nEsta es la idea del núcleo funcional (functional core): mantén los cálculos puros y empuja la mutación y la E/S hacia los bordes. La inmutabilidad es también lo que hace funcionar la detección de cambios por referencia de React y Redux.',
    hint: 'Construye objetos nuevos con `map` y spread en vez de asignar sobre la entrada, y recuerda que una copia con spread del carrito es superficial: `items` seguiría compartido.',
  },
  'clean-code-function-split-signals': {
    prompt: '¿Cuáles de estas son señales genuinas de que una función debería dividirse o reestructurarse? Selecciona todas las que apliquen.',
    options: {
      a: 'Un parámetro booleano selecciona entre dos comportamientos distintos dentro de ella',
      b: 'Calcula un resultado de negocio **y** lo escribe en la base de datos y envía un email',
      c: 'Su cuerpo necesita comentarios de sección como `// step 2: validate` y `// step 3: persist`',
      d: 'Tiene una única sentencia `return` al final',
      e: 'Se llama desde muchos lugares del código',
    },
    explanation:
      'Un argumento flag significa que la función hace dos cosas; divídela en dos funciones con nombre. Mezclar cálculo con E/S hace imposible probar la lógica sin mocks: extrae la parte pura. Los comentarios de sección son candidatos a extraer función cuyos nombres ya están escritos. Un único return es una elección de estilo (las guard clauses con returns tempranos suelen ser más claras), y que se use mucho es señal de una función útil, no de una mala. Las funciones deben hacer una sola cosa en un solo nivel de abstracción.',
    hint: 'Pregúntate si cada señal indica que la función hace más de una cosa o mezcla niveles de abstracción, en vez de ser una elección de estilo o una señal de reutilización.',
  },
  'clean-code-refactor-legacy-function': {
    prompt:
      'Una función `processOrder` de 180 líneas valida la entrada, calcula precios, escribe en tres tablas y publica un evento. Funciona, casi no tiene pruebas y cambia en cada sprint. ¿Cómo argumentas a favor de refactorizarla y cómo lo haces de forma segura?',
    modelAnswer:
      'Plantearía el caso con evidencia y no con gustos: cada cuánto cambia, cuántos incidentes o rondas de revisión causó y cuánto tardan los cambios. Antes de tocarla agrego pruebas de caracterización sobre su comportamiento observable actual (entradas, filas escritas, evento publicado) para que se pueda demostrar que el refactor preserva el comportamiento. Luego, en lugar de reescribirla, extraigo en pasos pequeños que se puedan revisar y revertir por separado: la validación y el cálculo de precios pasan a ser funciones puras con pruebas unitarias, y las escrituras en la base de datos y la publicación del evento se quedan en una capa delgada que orquesta (functional core, imperative shell). Los nombres salen del dominio para que cada paso se lea como el proceso de negocio. Lo haría de forma incremental junto con el trabajo de features, manteniendo cada PR pequeño, y resolvería la doble escritura entre las tablas y el evento con un transactional outbox como un cambio aparte y explícito, en lugar de esconderlo dentro del refactor.',
    rubric: [
      'Justifica el refactor con evidencia de cambios frecuentes, defectos o lead time, no con estilo personal',
      'Escribe pruebas de caracterización antes de cambiar el comportamiento',
      'Separa el cálculo puro de la E/S (functional core, imperative shell)',
      'Refactoriza en pasos pequeños, reversibles y revisables en lugar de reescribir',
      'Mantiene los cambios de comportamiento (como corregir la doble escritura) separados del refactor puro',
    ],
    explanation:
      'Señal senior: refactorizar es un ejercicio de gestión de riesgo. Primero las pruebas, pasos pequeños y una razón de negocio con la que el equipo y producto puedan estar de acuerdo.\n\n**Dilo en voz alta:** "Fijo el comportamiento actual con pruebas de caracterización y luego separo la lógica pura de la E/S en PR pequeños, así cada paso preserva el comportamiento y es reversible."',
    hint: 'Cubre la evidencia que justifica el trabajo, la red de seguridad que agregas antes de tocarla, cómo separas la lógica pura de la E/S y qué tan pequeño es cada paso.',
  },
};
