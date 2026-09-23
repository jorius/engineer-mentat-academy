// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  'javascript-event-loop-order-basic': {
    prompt: '¿Qué imprime esto, un valor por línea?',
    explanation:
      'Los `console.log` síncronos se ejecutan primero (1, 4). La cola de microtareas se vacía por completo antes de la siguiente macrotarea, así que el callback de la promesa (3) se adelanta al temporizador (2).\n\n**Dilo en voz alta:** "Las microtareas siempre se ejecutan antes de la siguiente macrotarea, así que una avalancha de callbacks de promesas puede dejar sin turno a los temporizadores."',
  },
  'javascript-this-spread-greet': {
    prompt:
      'Una copia con spread comparte la función `greet`, pero `this` se sigue resolviendo en el momento de la llamada. Cambia **solo el cuerpo de `solution`** para que devuelva el saludo del objeto copiado con `name: "Daniel"` usando el `greet` original, sin editar `greet`.',
    explanation:
      '`this` lo decide el punto de llamada, no el lugar donde se definió la función. Funcionan tanto `secondSubject.greet()` como `firstSubject.greet.call(secondSubject)`; `bind` devuelve una función nueva. Una función flecha ignoraría todo esto porque captura `this` de forma léxica.\n\n**Dilo en voz alta:** "`this` lo decide el punto de llamada, no el lugar donde se definió la función; una copia con spread comparte la función, pero igual tengo que invocarla con el receptor correcto, con una llamada de método o con `call`."',
  },
  'javascript-closure-counter-independence': {
    prompt: '```js\nfunction outer() {\n  let n = 0;\n  return () => ++n;\n}\nconst a = outer();\nconst b = outer();\na(); a();\nconsole.log(b());\n```\n¿Qué se imprime?',
    explanation: 'Cada llamada a `outer` crea un `n` nuevo. `a` y `b` encierran variables distintas, así que `b` empieza desde 0.',
  },
};
