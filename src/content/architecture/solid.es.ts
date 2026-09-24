// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  'solid-srp-reason-to-change': {
    prompt: 'El principio de responsabilidad única (SRP) dice que un módulo debe tener "una sola razón para cambiar". ¿Qué significa eso en la práctica?',
    options: {
      a: 'Debe responder a una sola fuente de cambio (un actor o una preocupación), para que solicitudes no relacionadas nunca toquen el mismo código',
      b: 'Debe exponer exactamente un método público',
      c: 'Debe mantenerse por debajo de un tamaño fijo, por ejemplo 200 líneas',
      d: 'Cada archivo debe contener exactamente una clase o función',
    },
    explanation:
      'SRP trata sobre la **cohesión alrededor de una razón para cambiar**, no sobre contar métodos o líneas. Un `UserService` con `login()` y `updateProfile()` cambia cuando cambian las reglas de seguridad *y* cuando cambian los campos del perfil, así que dos equipos editan el mismo archivo por razones no relacionadas. Dividirlo en `AuthenticationService` y `UserProfileService` aísla esos cambios. Una clase con diez métodos puede cumplir SRP si todos sirven a la misma preocupación. En React, el olor típico es un componente que obtiene datos, los transforma y renderiza varias cosas; la solución es un hook de datos más componentes de presentación pequeños.',
    hint: 'Recuerda cómo reformuló Robert C. Martin "una sola responsabilidad" en términos de cambio.',
  },
  'solid-srp-invoice-reasons': {
    prompt:
      '```js\nclass InvoiceService {\n  calculateTotal(invoice) { /* VAT and discount rules */ }\n  renderPdf(invoice) { /* layout, fonts, logo */ }\n  save(invoice) { /* SQL against the invoices table */ }\n  emailToCustomer(invoice) { /* SMTP client */ }\n}\n```\n¿Cuáles de estas son **razones independientes** para que esta clase cambie? Selecciona todas las que apliquen.',
    options: {
      a: 'Finanzas cambia cómo se redondea el IVA',
      b: 'Diseño actualiza la plantilla del PDF y el logo',
      c: 'La tabla de facturas migra a un esquema nuevo',
      d: 'Alguien agrega una prueba unitaria para `calculateTotal`',
      e: 'La empresa cambia de SMTP a una API de email transaccional',
    },
    explanation:
      'Cuatro interesados distintos (finanzas, diseño, datos, infraestructura) pueden forzar cada uno una edición aquí, así que un cambio para uno arriesga romper a los demás y cada cambio obliga a volver a probar toda la clase. Agregar una prueba no es un cambio en la clase. Una división razonable es una función pura `calculateTotal` (fácil de probar unitariamente), un `InvoiceRenderer`, un `InvoiceRepository` y un `Mailer`, con un caso de uso delgado que los orquesta.',
    hint: 'Enumera los distintos actores y tecnologías a los que responde esta clase, y luego compara cada escenario con esa lista.',
  },
  'solid-ocp-exporter-registry': {
    prompt:
      "```js\nfunction exportReport(report, format) {\n  switch (format) {\n    case 'csv': return toCsv(report);\n    case 'json': return JSON.stringify(report);\n    default: throw new Error(`Unsupported format ${format}`);\n  }\n}\n```\nEl mismo `switch (format)` aparece también en la pantalla de vista previa y en el job de email. Producto quiere XML el próximo sprint y más formatos después. ¿Qué cambio sigue mejor el principio abierto/cerrado?",
    options: {
      a: "Agregar `case 'xml'` a cada uno de los tres switches",
      b: "Introducir un registro de exportadores (`exporters.set('xml', xmlExporter)`) que consultan los tres puntos de llamada, de modo que un formato nuevo sea un módulo nuevo más un registro",
      c: 'Heredar del servicio de reportes y sobrescribir `exportReport` con un switch que también maneje XML',
      d: 'Agregar un parámetro booleano `isXml` a `exportReport`',
    },
    explanation:
      'OCP significa que extiendes el comportamiento **agregando** código, no editando código que ya funciona. Un registro (un mapa de estrategias) permite que cada formato viva en su propio módulo, y los tres puntos de llamada no vuelven a cambiar. Agregar un `case \'xml\'` a cada switch funciona, pero hay que repetirlo en cada switch duplicado, que es justamente el olor de shotgun surgery al que apunta OCP. Heredar del servicio sigue editando un switch, solo que en una subclase, y el parámetro `isXml` agrega un flag booleano que no escala más allá de dos formatos.\n\nLa salvedad pragmática: un único `switch` sobre un conjunto de casos estable y cerrado (por ejemplo los tres estados de un semáforo) está bien. OCP rinde cuando el conjunto crece y la ramificación está duplicada.',
    hint: 'Recuerda qué le pide el principio abierto-cerrado al código existente que ya funciona cuando llega una variante nueva.',
  },
  'solid-lsp-penguin-predict': {
    prompt: '¿Qué imprime esto, una línea por cada `console.log`?',
    explanation:
      '`instanceof` está conforme (y un verificador de TypeScript también lo estaría): un `Penguin` **es un** `Bird`. Pero `launchAll` se escribió contra el contrato "todo Bird puede volar", y la subclase rompe ese contrato en tiempo de ejecución. Eso es una violación de Liskov: un subtipo debe poder usarse en cualquier lugar donde se use su tipo base, sin que quien llama necesite casos especiales. Envolver las llamadas en `try/catch` o agregar `if (bird instanceof Penguin)` en quienes llaman son síntomas, no soluciones. La solución es modelar la capacidad (un `FlyingBird` o una interfaz `canFly`) para que los que no vuelan nunca prometan `fly()`.',
    hint: 'Sigue qué hace `fly()` en cada subclase, en qué convierte el `catch` un error, y qué verifica `instanceof` frente a lo que espera quien llama.',
  },
  'solid-lsp-model-capabilities': {
    prompt:
      '`Penguin` hereda `fly()` de `Bird` y lo sobrescribe para lanzar un error, así que `solution` falla con cualquier bandada que contenga un pingüino. Reestructura la jerarquía para que **solo las aves que pueden volar prometan `fly()`** y para que quienes llaman seleccionen a los voladores por capacidad, no verificando si es `Penguin`. `solution(kinds)` debe devolver las líneas de vuelo y de nado en el orden de la bandada.',
    explanation:
      'La clase base hizo una promesa (`fly()`) que no todos los subtipos pueden cumplir, así que la solución va en el **modelo**, no en quienes llaman. Bajar `fly()` a un `FlyingBird` (o a un mixin / interfaz) significa que un `Penguin` nunca afirma que vuela, y quienes llaman filtran por la capacidad. Filtrar con `!(bird instanceof Penguin)` pasaría las pruebas, pero reintroduce el olor: cada nueva ave que no vuela (un avestruz, un kiwi) obligaría a editar a cada llamador, lo que además rompe el principio abierto/cerrado.\n\nEn TypeScript la misma idea es `interface Flyer { fly(): string }` y un type guard; en JS en general, prefiere jerarquías poco profundas y composición para que los sustitutos nunca te sorprendan.\n\n**Dilo en voz alta:** "Una subclase que lanza un error o deja vacío un método heredado es una violación de Liskov. Corrijo la abstracción para que el tipo base solo prometa lo que todos los subtipos pueden cumplir, en lugar de agregar verificaciones de tipo en quienes llaman."',
    hint: 'Pregúntate qué clases pueden cumplir de verdad la promesa de `fly()`, y cómo puede quien llama elegir a los que vuelan sin nombrar a `Penguin`.',
  },
  'solid-isp-mixins-predict': {
    prompt: 'Las capacidades se componen con mixins en lugar de una interfaz `Bird` gorda. ¿Qué imprime esto, una línea por cada `console.log`?',
    explanation:
      "La segregación de interfaces dice que ningún cliente debería verse obligado a depender de métodos que no usa. Los mixins le dan a cada clase solo las capacidades que necesita: `Penguin` nunca recibe un `fly` que tendría que dejar como stub, así que `typeof penguin.fly` es `'undefined'` en lugar de un método que lanza un error. `Object.assign` copia los métodos en el **prototipo**, y `this` lo fija el punto de llamada (`duck.fly()` hace que `this` sea el pato), así que los métodos compartidos leen el `name` propio de cada instancia; `'swim' in penguin` es `true` (el operador `in` recorre la cadena de prototipos) y `Object.keys` solo lista la propiedad propia `name`.",
    hint: '`Object.assign` copia los métodos al prototipo, `this` viene del punto de llamada, y el operador `in` recorre la cadena de prototipos mientras `Object.keys` solo lista propiedades propias.',
  },
  'solid-dip-injectable-gateway': {
    prompt:
      '`PurchaseHandler` está atado al SDK de `PayPal`, que rechaza las llamadas de red en las pruebas, así que nadie puede probar la lógica de aprobar/rechazar. Aplica inversión de dependencias: haz que el handler dependa de un gateway inyectado (cualquier cosa con `requestPayment(details, amount)`) mientras **el código de producción que llama a `new PurchaseHandler()` sigue usando PayPal**. No cambies `PayPal`. Haz que `solution` inyecte su gateway falso.',
    explanation:
      'Antes de la corrección, la política de alto nivel (`paid` vs `declined`) depende directamente de un detalle de bajo nivel del proveedor. Después, ambos dependen de una abstracción, el contrato `requestPayment(details, amount)`, y el gateway concreto se **pasa desde afuera**. Esa es la *inversión* de dependencias (el principio) lograda mediante la *inyección* de dependencias (la técnica). El parámetro por defecto mantiene sin cambios el punto de llamada en producción; en una app más grande, una composition root o un contenedor de DI (los providers de NestJS) hace el cableado.\n\nLa ganancia es exactamente lo que muestran las pruebas: la regla de negocio se puede probar con un fake de dos líneas, sin mockear módulos, y cambiar PayPal por Stripe toca una sola línea de cableado.\n\n**Dilo en voz alta:** "Inyecto las dependencias en el límite en lugar de importar implementaciones concretas, así la lógica de alto nivel depende de un contrato; eso es lo que la hace testeable y me permite cambiar de proveedor sin tocar la política."',
    hint: 'Haz que el handler reciba su gateway desde afuera, y que la llamada existente en producción siga funcionando sin cambios.',
  },
  'solid-pragmatism-review': {
    prompt:
      'Un compañero refactoriza una CLI interna pequeña y estable "para seguir SOLID": ahora cada clase tiene una interfaz, una factory y un registro en un contenedor de DI, y el diff triplica la cantidad de archivos. ¿Cómo lo evalúas, y dónde se superponen los principios SOLID entre sí y con los patrones de diseño?',
    modelAnswer:
      'SOLID es un medio para lograr facilidad de cambio y testabilidad, no un objetivo, así que preguntaría qué cambio o qué prueba facilita cada nueva abstracción. Para código pequeño y estable que nadie más extiende, las interfaces con una sola implementación y las factories agregan indirección y costo de navegación sin retorno, así que mantendría la inyección solo en los límites reales (E/S, red, reloj), donde las pruebas necesitan puntos de corte. Los principios se superponen mucho: reemplazar un `switch` por un mapa de estrategias es OCP, normalmente necesita DIP (quienes llaman dependen del contrato de la estrategia) y solo es seguro cuando cada estrategia respeta el mismo contrato, que es LSP. ISP es SRP aplicado a las interfaces: las interfaces de rol pequeñas evitan que los clientes dependan de métodos que no usan. Propondría conservar las partes que aíslan los efectos secundarios y revertir el resto, y volver a evaluarlo cuando realmente aparezcan cambios frecuentes o una segunda implementación.',
    rubric: [
      'Plantea SOLID como algo al servicio de la facilidad de cambio y la testabilidad, no como un fin en sí mismo',
      'Identifica las interfaces con una sola implementación y las factories sobre código estable como indirección innecesaria',
      'Mantiene la inyección en los límites reales (E/S, red, tiempo) donde las pruebas necesitan puntos de corte',
      'Explica al menos dos superposiciones, p. ej. mapa de estrategias = OCP + DIP, LSP como condición de seguridad, ISP como SRP para interfaces',
      'Propone un resultado concreto e incremental para el PR en lugar de todo o nada',
    ],
    explanation:
      'La señal senior es el equilibrio: conocer el olor que corrige cada principio (god class, switch que crece, override que lanza errores, interfaz gorda, proveedor cableado a mano) y aplicar el principio solo donde el acoplamiento o los cambios frecuentes realmente duelen.\n\n**Dilo en voz alta:** "SOLID es un medio, no un fin: lo aplico donde el acoplamiento o los cambios frecuentes duelen y mantengo la inyección en los límites reales de E/S. Los principios se superponen: por ejemplo, un mapa de estrategias es OCP logrado a través de DIP, y solo es seguro si cada estrategia respeta LSP."',
    hint: 'Pregúntate qué cambio o prueba facilita cada abstracción, dónde van las costuras reales (E/S, red, reloj) y muestra cómo se solapan OCP, DIP, LSP e ISP.',
  },
};
