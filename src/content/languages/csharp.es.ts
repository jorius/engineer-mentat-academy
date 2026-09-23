// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  'csharp-struct-value-copy': {
    prompt:
      "```csharp\nstruct Point\n{\n    public int X;\n}\n\nvar p1 = new Point { X = 1 };\nvar p2 = p1;\np2.X = 99;\n\nConsole.WriteLine(p1.X);\n```\n¿Qué imprime esto?",
    options: {
      a: '`1`',
      b: '`99`',
      c: 'Un error de compilación, porque `p2 = p1` no puede copiar un `struct`',
      d: '`0`',
    },
    explanation:
      '`Point` es un `struct`, un **tipo por valor**. `var p2 = p1;` copia todos los campos de `p1` en una instancia nueva e independiente, así que modificar `p2.X` no afecta a `p1`. `p1.X` sigue valiendo `1`. `99` solo sería correcto si `Point` fuera una `class`: entonces `p1` y `p2` serían dos referencias al **mismo** objeto en el heap, y `p2.X = 99` también se vería a través de `p1`. La asignación compila sin problema (`c` es incorrecta), y `p1.X` se estableció explícitamente en `1` en el inicializador, no quedó en el valor por defecto `0` (`d` es incorrecta).',
  },
  'csharp-async-task-vs-async-void': {
    prompt:
      'Estás escribiendo un método que realiza una operación asíncrona y necesita que quien lo llama pueda hacerle `await` y capturar cualquier excepción con un `try`/`catch` normal alrededor de la llamada. ¿Qué firma deberías usar?',
    options: {
      a: '`public async Task DoWorkAsync()`',
      b: '`public async void DoWorkAsync()`',
      c: '`public void DoWorkAsync()`, que bloquea internamente sobre el trabajo asíncrono con `.GetAwaiter().GetResult()`',
      d: '`public async Task<void> DoWorkAsync()`',
    },
    explanation:
      "Un método `async Task` devuelve un `Task` al que quien llama puede hacerle `await`; cualquier excepción lanzada dentro se captura en ese `Task` y se vuelve a lanzar en el `await`, así que un `try`/`catch` normal alrededor de la llamada la detecta. `async void` es del tipo \"dispara y olvida\": no hay ningún `Task` al que hacerle `await`, y una excepción lanzada dentro se dispara sobre el `SynchronizationContext` actual en lugar de poder ser capturada por quien llama, lo que típicamente termina bloqueando o tumbando el proceso. Existe principalmente para manejadores de eventos de UI, que no pueden devolver un valor. Un método `void` normal no es `async` en absoluto, así que no puede hacer `await`; bloquear con `.GetAwaiter().GetResult()` dentro de él solo vuelve síncrona la llamada y no le da a quien llama nada a lo que hacerle `await` (y arriesga los mismos problemas de deadlock por `SynchronizationContext` que siempre implica bloquear sobre código asíncrono). `Task<void>` no es válido en C#: `void` no puede usarse como argumento de tipo, así que la opción `d` no compila; usa `Task` para \"sin valor de retorno\" y `Task<T>` cuando necesites uno.",
  },
  'csharp-nullable-reference-warning': {
    prompt:
      "```csharp\n#nullable enable\n\npublic class UserService\n{\n    public string GetDisplayName(User? user)\n    {\n        return user.Name;\n    }\n}\n```\nCon los tipos de referencia anulables habilitados (el valor por defecto en proyectos .NET 6+), ¿qué pasa cuando esto se compila, y qué ocurre realmente en tiempo de ejecución si se llama a `GetDisplayName(null)`?",
    options: {
      a: 'La compilación falla con el error CS8602, así que el proyecto nunca compila hasta que se corrija el código',
      b: 'El compilador emite una **advertencia** (CS8602, posible desreferencia de una referencia nula); el código igual compila. En tiempo de ejecución, `user.Name` lanza una `NullReferenceException` cuando `user` es `null` — agrega una verificación de null (o usa `user?.Name`) antes de acceder al miembro',
      c: 'El runtime lanza automáticamente `ArgumentNullException` antes de que se ejecute el cuerpo del método, porque el parámetro está anotado como `User?`',
      d: 'Los tipos de referencia anulables solo afectan a los tooltips del editor; no hay ningún diagnóstico del compilador',
    },
    explanation:
      "Los tipos de referencia anulables son una característica de **análisis de flujo en tiempo de compilación**, no un mecanismo de verificación nula en tiempo de ejecución: por defecto los diagnósticos son advertencias, no errores, así que la opción `a` es incorrecta — el proyecto compila. Marcar el parámetro como `User?` le dice al compilador que el argumento puede ser `null`, y acceder a `.Name` sin acotarlo (un `if (user is null) return ...;`, un operador condicional nulo `user?.Name`, o un operador de indulgencia nula `user!.Name` cuando estás seguro de que no es null) dispara CS8602. Nada en la anotación cambia lo que pasa en tiempo de ejecución: pasar `null` sigue lanzando una `NullReferenceException` normal al desreferenciar, exactamente igual que en código antiguo sin soporte para anulables (`c` es incorrecta — no se inserta ninguna verificación). Las advertencias son diagnósticos reales del compilador, visibles en la salida del build y en CI, no solo pistas del editor (`d` es incorrecta).",
  },
  'csharp-task-whenall-exceptions': {
    prompt:
      "```csharp\nvar task1 = Task.Run(() => { throw new InvalidOperationException(\"A\"); });\nvar task2 = Task.Run(() => { throw new ArgumentException(\"B\"); });\n\ntry\n{\n    await Task.WhenAll(task1, task2);\n}\ncatch (Exception ex)\n{\n    Console.WriteLine(ex.GetType().Name);\n}\n```\n¿Qué se imprime, y cómo se observa la excepción de la otra tarea?",
    options: {
      a: 'Imprime `InvalidOperationException`. El `await` sobre la tarea de `WhenAll` vuelve a lanzar solo la **primera** excepción interna, y `WhenAll` conserva el orden de entrada en `Exception.InnerExceptions`, así que la excepción de `task1` queda primero. Ambas siguen disponibles mediante `Task.WhenAll(task1, task2).Exception!.InnerExceptions`, o leyendo `task1.Exception` / `task2.Exception` una vez que cada tarea termina',
      b: 'Imprime `AggregateException`, porque .NET envuelve ambas excepciones en un tipo personalizado único y lo vuelve a lanzar en el `await`',
      c: 'Imprime `ArgumentException`, porque `Task.WhenAll` siempre expone la excepción de la tarea que se pasó en **último** lugar',
      d: 'Imprime `InvalidOperationException`, porque `Task.WhenAll` cancela `task2` en el momento en que `task1` falla, así que la excepción de `task2` nunca se llega a registrar',
    },
    explanation:
      "`Task.WhenAll` termina en estado Faulted con una `AggregateException` cuyo `InnerExceptions` contiene la excepción de cada tarea que falló, en el orden en que las tareas se pasaron a `WhenAll`, no en el orden en que completaron. Cuando haces `await` sobre una tarea fallida (incluida la que devuelve `WhenAll`), el awaiter desenvuelve y vuelve a lanzar solo la **primera** excepción interna, por eso el `catch` aquí ve `InvalidOperationException` y no una `AggregateException` (`b` es incorrecta: no existe ese `MultiException`, y el `await` nunca deja que una `AggregateException` salga tal cual — siempre la desenvuelve). La opción `c` invierte el orden, y `WhenAll` nunca cancela tareas hermanas solo porque una falle (`d` es incorrecta) — ambas tareas terminan de ejecutarse de forma independiente, así que `task2.Exception` también queda poblada. Revisar `.Exception.InnerExceptions` (o el `.Exception` de cada tarea) después del `await` es la forma estándar de ver todos los fallos en vez de solo el primero.",
  },
  'csharp-linq-first-vs-firstordefault': {
    prompt:
      "```csharp\nList<int> numbers = new List<int>();\nint result = numbers.First();\n```\n¿Qué pasa aquí, y qué deberías usar en su lugar si `numbers` puede legítimamente estar vacía?",
    options: {
      a: '`First()` lanza `InvalidOperationException` ("Sequence contains no elements"). Usa `FirstOrDefault()`, que devuelve `default(int)` (`0`) para una secuencia vacía, o la sobrecarga `FirstOrDefault(predicate, defaultValue)` para dar tu propio valor de respaldo en lugar de `0`',
      b: '`First()` devuelve silenciosamente `default(int)` (`0`), exactamente igual que `FirstOrDefault()`, así que no hay ninguna diferencia práctica entre ambos',
      c: '`First()` lanza `ArgumentOutOfRangeException`, la misma excepción que lanza `List<int>.this[int]` para un índice inválido',
      d: 'El código no compila, porque `result` tendría que declararse `int?` para poder guardar el resultado de `First()`',
    },
    explanation:
      "`First()` está pensado para secuencias que se esperan no vacías: lanza `InvalidOperationException` cuando no hay nada que devolver, que es lo que ocurre aquí — la opción `b` describe el comportamiento de `FirstOrDefault()`, no el de `First()`. `ArgumentOutOfRangeException` (`c`) pertenece al acceso por índice o a arrays, no al caso de secuencia vacía de LINQ. El código compila sin problema como `int` (`d` es incorrecta) — simplemente lanza en tiempo de ejecución. La trampa real que hay que mencionar en una entrevista: `FirstOrDefault()` sobre una `List<int>` vacía devuelve `0`, indistinguible de un `0` real que ya estuviera en la lista, así que cuando `0` es un valor válido conviene usar `FirstOrDefault(x => predicado, valorPorDefecto)` (.NET 6+) o verificar `Count == 0` en vez de confiar en el valor por defecto.",
  },
  'csharp-record-equality-with-collections': {
    prompt:
      "```csharp\npublic record Order(int Id, List<string> Items);\n\nvar a = new Order(1, new List<string> { \"pen\" });\nvar b = new Order(1, new List<string> { \"pen\" });\n\nConsole.WriteLine(a == b); // ?\n```\n¿Por qué esto imprime `False` aunque ambas órdenes tienen el mismo `Id` y los mismos artículos? ¿Qué otras trampas tiene la igualdad de `record` con miembros mutables o de tipo colección, y cómo corregirías esta?",
    modelAnswer:
      "Los records sintetizan `Equals`/`GetHashCode` miembro a miembro, comparando cada propiedad declarada con `EqualityComparer<T>.Default`. Para `List<string>`, ese comparador por defecto termina usando `object.Equals`/`GetHashCode` — igualdad por referencia — porque `List<T>` nunca los sobrescribe. `a.Items` y `b.Items` son dos listas creadas por separado con `new`, así que aunque su contenido es igual, la comparación de la propiedad falla y todo el record se compara como distinto, lo cual sorprende a quien espera que los records den \"igualdad de valor\" completa de fábrica. Una trampa relacionada: la igualdad de records también compara una propiedad oculta `EqualityContract` ligada al tipo en tiempo de ejecución, así que un record derivado nunca es igual a una instancia con el tipo base aunque tenga valores de propiedad idénticos, incluso sin ninguna colección de por medio. Para corregir el caso de la colección, sobrescribiría yo mismo el `Equals`/`GetHashCode` generado por el compilador en el record — comparando `Items` con `Items.SequenceEqual(other.Items)` y combinando un hash basado en el contenido (por ejemplo con `Items.Aggregate` o `HashCode.Combine` sobre los elementos) en lugar de confiar en la comparación miembro a miembro sintetizada, o bien, donde controle el diseño, preferir una colección genuinamente inmutable y con igualdad estructural en vez de un `List<T>` crudo. En cualquier caso, no confío en la igualdad de record por defecto una vez que algún miembro no implemente igualdad de valor por sí mismo.",
    rubric: [
      'Explica que los records sintetizan Equals/GetHashCode miembro a miembro usando EqualityComparer<T>.Default por cada propiedad declarada',
      'Explica que List<T> no sobrescribe Equals/GetHashCode, así que esa comparación es por referencia — dos records construidos con listas distintas pero de contenido igual no son iguales, pese a la fama de igualdad de valor de los records',
      'Menciona la verificación de EqualityContract/tipo en tiempo de ejecución: un record derivado nunca es igual a una instancia con tipo base aunque los valores de propiedad sean idénticos',
      'Propone una solución concreta: sobrescribir Equals/GetHashCode en el record comparando con SequenceEqual y un hash basado en el contenido, o evitar miembros de tipo colección mutable crudos',
    ],
    explanation:
      "Esto se pregunta para ver si \"los records tienen igualdad de valor\" se entiende al nivel de lo que el compilador realmente genera, y no como eslogan de marketing. Es una fuente común de bugs sutiles: pruebas unitarias que comparan DTOs llenos de listas, o records usados como claves de diccionario o en `HashSet<T>`, se comportan de repente como tipos por referencia en cuanto interviene un miembro de tipo colección.\n\n**Dilo en voz alta:** \"La igualdad de records es miembro a miembro usando el comparador por defecto de cada propiedad, y `List<T>` no tiene igualdad de valor, así que dos records construidos con instancias de lista distintas pero contenido idéntico no van a dar `==`. Si necesito eso, sobrescribo `Equals`/`GetHashCode` yo mismo con `SequenceEqual` en lugar de confiar en los sintetizados.\"",
  },
  'csharp-configureawait-and-valuetask': {
    prompt:
      "Mantienes una librería compartida cuyas APIs asíncronas se llaman tanto desde un servicio ASP.NET Core como desde una app de escritorio WPF. ¿Cuándo usas `ConfigureAwait(false)`, y cuándo expondrías un método como `ValueTask<T>` en lugar de `Task<T>`? ¿Cuál es el riesgo de usar `ValueTask<T>` incorrectamente?",
    modelAnswer:
      "`ConfigureAwait(false)` le dice al `await` que no intente reanudar la continuación sobre el `SynchronizationContext`/`TaskScheduler` capturado. En código de librería no controlo el contexto de quien llama, así que lo uso después de prácticamente todo `await` interno — evita el clásico deadlock donde código WPF/WinForms bloquea de forma síncrona sobre la llamada asíncrona (`.Result`, `.Wait()`) mientras retiene el `SynchronizationContext` de la UI, porque la continuación necesitaría ese mismo hilo para reanudarse. ASP.NET Core (Kestrel) no tiene `SynchronizationContext` por defecto desde .NET Core, así que ahí `ConfigureAwait(false)` no evita ningún deadlock, pero sigue valiendo la pena en código de librería compartida, tanto por consistencia como por el pequeño ahorro de saltarse el cambio de contexto, ya que la librería no sabe quién la va a llamar. Para `ValueTask<T>`, solo lo uso en un camino caliente que se completa de forma síncrona con mucha frecuencia — una búsqueda en caché que casi siempre acierta, por ejemplo — donde asignar un `Task<T>` en cada llamada agrega presión real sobre el GC. El problema es que `ValueTask<T>` tiene un contrato de uso mucho más estricto que `Task<T>`: hay que hacerle `await` (o convertirlo una sola vez con `AsTask()`) exactamente una vez, no se le puede hacer `await` dos veces ni de forma concurrente desde dos sitios, y no debería guardarse ni pasarse por ahí para inspeccionarlo después, porque su `IValueTaskSource` puede reutilizarse (pooling) después del primer consumo — hacer cualquiera de esas cosas produce un comportamiento indefinido o excepciones, no un error de compilación. Así que por defecto uso `Task<T>` en todas partes, y solo cambio un método específico a `ValueTask<T>` después de que el profiling muestre que las asignaciones de ese camino de completado síncrono realmente importan, manteniendo el uso local (hacerle `await` de inmediato, nunca guardar el `ValueTask` en sí).",
    rubric: [
      'Explica que ConfigureAwait(false) evita capturar/reanudar sobre el SynchronizationContext, previniendo deadlocks cuando quien llama bloquea sobre resultados asíncronos (WPF/WinForms)',
      'Señala que ASP.NET Core no tiene SynchronizationContext por defecto, así que ahí ConfigureAwait(false) es cuestión de higiene/rendimiento de librería y no de prevenir deadlocks',
      'Explica que ValueTask<T> existe para evitar una asignación de Task en caminos calientes que completan de forma síncrona con frecuencia',
      'Indica el riesgo del contrato de ValueTask: hay que hacerle await exactamente una vez y no guardarlo/consumirlo de forma concurrente, a diferencia de Task<T>, porque su fuente puede reutilizarse',
      'Recomienda Task<T> como opción por defecto, recurriendo a ValueTask<T> solo después de que el profiling muestre presión de asignaciones',
    ],
    explanation:
      "Esto evalúa si el candidato trata `ConfigureAwait(false)` y `ValueTask<T>` como algo para poner en todas partes por reflejo o como herramientas puntuales para modos de fallo y caminos calientes específicos — usar cualquiera de los dos sin entender el compromiso causa bugs reales (deadlocks por un lado, comportamiento indefinido por mal uso de `ValueTask` por el otro).\n\n**Dilo en voz alta:** \"`ConfigureAwait(false)` protege al código de librería de un deadlock causado por el `SynchronizationContext` de quien llama; `ValueTask<T>` ahorra una asignación en caminos calientes que suelen completar de forma síncrona, pero es de un solo uso, así que lo mantengo local y por defecto uso `Task<T>` en todo lo demás.\"",
  },
  'csharp-linq-deferred-execution-multiple-enumeration': {
    prompt:
      "```csharp\nIEnumerable<int> Squares(IEnumerable<int> source)\n{\n    Console.WriteLine(\"Building query\");\n    return source.Select(x =>\n    {\n        Console.WriteLine($\"Evaluating {x}\");\n        return x * x;\n    });\n}\n\nvar query = Squares(new[] { 1, 2, 3 });\nConsole.WriteLine(\"Before first enumeration\");\nforeach (var s in query) { }\nConsole.WriteLine(\"Before second enumeration\");\nforeach (var s in query) { }\n```\n¿Cuáles de las siguientes afirmaciones sobre este código son verdaderas? Selecciona todas las que apliquen.",
    options: {
      a: '"Building query" se imprime exactamente una vez en total, en el momento en que se llama a `Squares(...)`, antes de que se ejecute cualquiera de los dos `foreach`',
      b: '"Evaluating {x}" se imprime para cada elemento **dos veces** en total (una por cada `foreach`), porque `Select` usa ejecución diferida y `query` nunca se materializó, así que cada enumeración vuelve a ejecutar todo el pipeline sobre `source`',
      c: 'Llamar a `Squares(new[] { 1, 2, 3 })` evalúa de inmediato la proyección `Select` y guarda en caché los tres resultados, así que el segundo `foreach` reutiliza los cuadrados en caché sin volver a imprimir "Evaluating"',
      d: 'Como `source` es un array (ya completamente materializado en memoria), LINQ memoriza automáticamente los resultados de `Select` la primera vez que se enumera `query`',
      e: 'Agregar `.ToList()` justo después de `.Select(...)` dentro de `Squares` haría que "Evaluating" se imprima solo durante el primer `foreach`, porque la lista materializa los cuadrados una vez y el segundo bucle solo lee la lista en caché — a cambio de un trabajo previo más adelantado se evita el cálculo repetido',
    },
    explanation:
      "`Select` (como `Where`, `OrderBy` y la mayoría de los operadores de LINQ-to-Objects) es **diferido**: no toca `source` cuando se llama, solo construye un iterador. `Console.WriteLine(\"Building query\")` se ejecuta de inmediato porque es una instrucción normal dentro de `Squares`, ejecutada una vez cuando se invoca el método mismo — antes de que exista siquiera el iterador diferido de `Select` (`a` es verdadera). Cada `foreach` sobre `query` llama a `GetEnumerator()` sobre ese mismo pipeline sin materializar, que recorre `source` y vuelve a invocar el selector desde cero, así que \"Evaluating\" se imprime para los tres elementos en el primer bucle y otra vez para los tres en el segundo — seis impresiones en total (`b` es verdadera; `c` y `d` son falsas — nada en `Select`, ni el hecho de que la fuente sea un array, provoca un cacheo automático). Esta es la trampa de la **enumeración múltiple**: duplica el trabajo en silencio, y es peor que un problema de rendimiento cuando la fuente tiene efectos secundarios o no se puede re-enumerar de forma segura — una consulta construida sobre `IQueryable`/EF Core vuelve a ejecutar la consulta a la base de datos, un iterador con `yield return` que depende de estado externo puede comportarse distinto la segunda vez, y una fuente de un solo sentido como un `DbDataReader` o un iterador respaldado por un `Stream` ya consumido puede lanzar una excepción o no devolver nada. Llamar a `.ToList()` (o `.ToArray()`) una vez, justo donde se pretende reutilizar la secuencia, fuerza una evaluación inmediata y guarda en caché los resultados, así que la segunda enumeración es solo una lectura de lista sin más salidas de \"Evaluating\" (`e` es verdadera) — la solución estándar siempre que una consulta LINQ se vaya a enumerar más de una vez.\n\n**Dilo en voz alta:** \"Los operadores de LINQ como `Select` son diferidos, así que cada enumeración vuelve a ejecutar todo el pipeline a menos que lo materialice. Si voy a enumerar una consulta más de una vez, o tiene efectos secundarios, llamo a `ToList()` una vez y reutilizo eso.\"",
  },
};
