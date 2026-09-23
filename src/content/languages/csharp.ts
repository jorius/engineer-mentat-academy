// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  {
    id: 'csharp-struct-value-copy',
    domain: 'languages',
    subject: 'csharp',
    topic: 'basics',
    level: 'junior',
    kind: 'single',
    prompt:
      "```csharp\nstruct Point\n{\n    public int X;\n}\n\nvar p1 = new Point { X = 1 };\nvar p2 = p1;\np2.X = 99;\n\nConsole.WriteLine(p1.X);\n```\nWhat does this print?",
    options: [
      { id: 'a', text: '`1`' },
      { id: 'b', text: '`99`' },
      { id: 'c', text: 'A compile error, because `p2 = p1` cannot copy a `struct`' },
      { id: 'd', text: '`0`' },
    ],
    answer: 'a',
    tags: ['struct', 'value-types', 'reference-types'],
    source: 'topic-list',
    explanation:
      '`Point` is a `struct`, a **value type**. `var p2 = p1;` copies every field of `p1` into a brand-new, independent instance, so mutating `p2.X` has no effect on `p1`. `p1.X` stays `1`. `99` would only be correct if `Point` were a `class`: then `p1` and `p2` would be two references to the **same** object on the heap, and `p2.X = 99` would be visible through `p1` too. The assignment compiles fine (`c` is wrong), and `p1.X` was explicitly set to `1` in the initializer, not left at the default `0` (`d` is wrong).',
  },
  {
    id: 'csharp-async-task-vs-async-void',
    domain: 'languages',
    subject: 'csharp',
    topic: 'async',
    level: 'junior',
    kind: 'single',
    prompt:
      'You are writing a method that performs an asynchronous operation and needs to let the caller `await` it and catch any exceptions it throws with a normal `try`/`catch` around the call. Which signature should you use?',
    options: [
      { id: 'a', text: '`public async Task DoWorkAsync()`' },
      { id: 'b', text: '`public async void DoWorkAsync()`' },
      { id: 'c', text: '`public void DoWorkAsync()`, which blocks on the async work internally with `.GetAwaiter().GetResult()`' },
      { id: 'd', text: '`public async Task<void> DoWorkAsync()`' },
    ],
    answer: 'a',
    tags: ['async-await', 'task', 'fundamentals'],
    source: 'topic-list',
    explanation:
      'An `async Task` method returns a `Task` the caller can `await`; any exception thrown inside is captured on that `Task` and rethrown at the `await`, so an ordinary `try`/`catch` around the call sees it. `async void` is fire-and-forget: there is no `Task` to await, and an exception thrown inside it is raised on the current `SynchronizationContext` instead of being catchable by the caller, which typically crashes the process. It exists mainly for UI event handlers, which cannot return a value. A plain `void` method is not `async` at all, so it cannot `await`; blocking on `.GetAwaiter().GetResult()` inside it just makes the call synchronous and does not give the caller anything to `await` (and risks the same deadlock `ConfigureAwait`/UI `SynchronizationContext` issues that blocking on async code always risks). `Task<void>` is not valid C# — `void` cannot be used as a type argument, so option `d` does not compile; use `Task` for "no return value" and `Task<T>` when you need one.',
  },
  {
    id: 'csharp-nullable-reference-warning',
    domain: 'languages',
    subject: 'csharp',
    topic: 'basics',
    level: 'mid',
    kind: 'single',
    prompt:
      "```csharp\n#nullable enable\n\npublic class UserService\n{\n    public string GetDisplayName(User? user)\n    {\n        return user.Name;\n    }\n}\n```\nWith nullable reference types enabled (the .NET 6+ project default), what happens when this compiles, and what actually happens at runtime if `GetDisplayName(null)` is called?",
    options: [
      { id: 'a', text: 'The build fails with error CS8602, so the project never compiles until the code is fixed' },
      { id: 'b', text: 'The compiler emits a **warning** (CS8602, possible dereference of a null reference); the code still compiles. At runtime, `user.Name` throws a `NullReferenceException` when `user` is `null` — add a null check (or use `user?.Name`) before accessing the member' },
      { id: 'c', text: 'The runtime automatically throws `ArgumentNullException` before the method body runs, because the parameter is annotated `User?`' },
      { id: 'd', text: 'Nullable reference types only affect editor tooltips; there is no compiler diagnostic at all' },
    ],
    answer: 'b',
    tags: ['nullable-reference-types', 'null-safety'],
    source: 'topic-list',
    explanation:
      "Nullable reference types are a **compile-time, flow-analysis feature**, not a runtime null-check mechanism: by default the diagnostics are warnings, not errors, so option `a` is wrong — the project builds. Marking the parameter `User?` tells the compiler the argument may be `null`, and accessing `.Name` without narrowing (an `if (user is null) return ...;`, a null-conditional `user?.Name`, or a null-forgiving `user!.Name` when you're certain) triggers CS8602. Nothing about the annotation changes what happens at runtime: passing `null` still throws a plain `NullReferenceException` on the dereference, exactly as it would in old, non-nullable-aware code (`c` is wrong — there is no inserted guard). The warnings are real compiler diagnostics visible in the build output and CI, not just editor hints (`d` is wrong).",
  },
  {
    id: 'csharp-task-whenall-exceptions',
    domain: 'languages',
    subject: 'csharp',
    topic: 'async',
    level: 'mid',
    kind: 'single',
    prompt:
      "```csharp\nvar task1 = Task.Run(() => { throw new InvalidOperationException(\"A\"); });\nvar task2 = Task.Run(() => { throw new ArgumentException(\"B\"); });\n\ntry\n{\n    await Task.WhenAll(task1, task2);\n}\ncatch (Exception ex)\n{\n    Console.WriteLine(ex.GetType().Name);\n}\n```\nWhat gets printed, and how do you observe the exception from the other task?",
    options: [
      { id: 'a', text: 'It prints `InvalidOperationException`. `await` on the `WhenAll` task rethrows only the **first** inner exception, and `WhenAll` preserves input order in `Exception.InnerExceptions`, so `task1`\'s exception comes first. Both are still available via `Task.WhenAll(task1, task2).Exception!.InnerExceptions`, or by reading `task1.Exception` / `task2.Exception` once each task has completed' },
      { id: 'b', text: 'It prints `AggregateException`, because .NET wraps both exceptions into one custom type and rethrows that at the `await`' },
      { id: 'c', text: 'It prints `ArgumentException`, because `Task.WhenAll` always surfaces the exception of whichever task was supplied **last**' },
      { id: 'd', text: 'It prints `InvalidOperationException`, because `Task.WhenAll` cancels `task2` the moment `task1` faults, so `task2`\'s exception never gets recorded' },
    ],
    answer: 'a',
    tags: ['task', 'task-whenall', 'exception-handling', 'aggregateexception'],
    source: 'topic-list',
    explanation:
      "`Task.WhenAll` completes in a Faulted state carrying an `AggregateException` whose `InnerExceptions` contains every faulted task's exception, in the order the tasks were supplied to `WhenAll` — not completion order. When you `await` a faulted task (including the one `WhenAll` returns), the awaiter unwraps and rethrows only the **first** inner exception, which is why the `catch` here sees `InvalidOperationException`, not an `AggregateException` (`b` is wrong: there's no such `MultiException`, and `await` never lets an `AggregateException` itself surface — it always unwraps). Option `c` gets the order backwards, and `WhenAll` never cancels sibling tasks just because one faults (`d` is wrong) — both tasks run to completion independently, so `task2.Exception` is populated too. Checking `.Exception.InnerExceptions` (or each task's own `.Exception`) after the `await` is the standard way to see every failure instead of only the first.",
  },
  {
    id: 'csharp-linq-first-vs-firstordefault',
    domain: 'languages',
    subject: 'csharp',
    topic: 'linq',
    level: 'mid',
    kind: 'single',
    prompt:
      "```csharp\nList<int> numbers = new List<int>();\nint result = numbers.First();\n```\nWhat happens here, and what should you use instead if `numbers` might legitimately be empty?",
    options: [
      { id: 'a', text: '`First()` throws `InvalidOperationException` ("Sequence contains no elements"). Use `FirstOrDefault()`, which returns `default(int)` (`0`) for an empty sequence, or the `FirstOrDefault(predicate, defaultValue)` overload to supply your own fallback instead of `0`' },
      { id: 'b', text: '`First()` silently returns `default(int)` (`0`), exactly like `FirstOrDefault()`, so there is no practical difference between the two' },
      { id: 'c', text: '`First()` throws `ArgumentOutOfRangeException`, the same exception `List<int>.this[int]` throws for an invalid index' },
      { id: 'd', text: 'The code fails to compile, because `result` would have to be declared `int?` to hold the result of `First()`' },
    ],
    answer: 'a',
    tags: ['linq', 'first', 'firstordefault', 'exceptions'],
    source: 'topic-list',
    explanation:
      "`First()` is meant for sequences you expect to be non-empty: it throws `InvalidOperationException` when there is nothing to return, which is the correct call here since `b` describes `FirstOrDefault()`'s behavior, not `First()`'s. `ArgumentOutOfRangeException` (`c`) belongs to indexer/array access, not LINQ's empty-sequence case. The code compiles fine as `int` (`d` is wrong) — it just throws at runtime. The real gotcha to flag in an interview: `FirstOrDefault()` on an empty `List<int>` returns `0`, which is indistinguishable from a real `0` already in the list, so when `0` is a valid value you need `FirstOrDefault(x => predicate, fallback)` (.NET 6+) or check `Count == 0` / use `TryGetValue`-style patterns rather than trusting the default.",
  },
  {
    id: 'csharp-record-equality-with-collections',
    domain: 'languages',
    subject: 'csharp',
    topic: 'basics',
    level: 'senior',
    kind: 'open',
    prompt:
      "```csharp\npublic record Order(int Id, List<string> Items);\n\nvar a = new Order(1, new List<string> { \"pen\" });\nvar b = new Order(1, new List<string> { \"pen\" });\n\nConsole.WriteLine(a == b); // ?\n```\nWhy does this print `False` even though both orders have the same `Id` and the same items? What other pitfalls does `record` equality have with mutable or collection-typed members, and how would you fix this one?",
    modelAnswer:
      "Records synthesize member-wise `Equals`/`GetHashCode` that compare every declared property with `EqualityComparer<T>.Default`. For `List<string>`, that default comparer falls back to `object.Equals`/`GetHashCode` — reference equality — because `List<T>` never overrides them. `a.Items` and `b.Items` are two separately-`new`-ed lists, so even though their contents are equal, the property comparison fails and the whole record compares unequal, which surprises people who expect records to give full \"value equality\" out of the box. A related pitfall: record equality also compares a hidden `EqualityContract` property tied to the runtime type, so a derived record is never equal to a base-typed instance holding identical property values, even without any collection involved. To fix the collection case I'd override the compiler-generated `Equals`/`GetHashCode` on the record myself — compare `Items` with `Items.SequenceEqual(other.Items)` and combine a content-based hash (for example via `Items.Aggregate` or `HashCode.Combine` over the elements) instead of relying on the synthesized member-wise comparison, or, where I control the shape, prefer a structurally-equatable, genuinely immutable collection over a raw `List<T>`. Either way I don't trust the default record equality once any member's type doesn't itself implement value equality.",
    rubric: [
      'Explains records synthesize member-wise Equals/GetHashCode using EqualityComparer<T>.Default per declared property',
      "Explains List<T> doesn't override Equals/GetHashCode, so that comparison is reference equality — two records built from different-but-equal-content lists are not equal, despite records' value-equality reputation",
      'Mentions the EqualityContract/runtime-type check: a derived record is never equal to a base-typed instance even with identical property values',
      'Proposes a concrete fix: override Equals/GetHashCode on the record to compare with SequenceEqual and a content-based hash, or avoid raw mutable collection-typed members',
    ],
    tags: ['records', 'equality', 'gotchas', 'collections'],
    source: 'topic-list',
    explanation:
      "Interviewers ask this to see whether \"records have value equality\" is understood at the level of what the compiler actually generates, not as marketing. It's a common source of subtle bugs: unit tests that compare DTOs full of lists, or records used as dictionary keys or in `HashSet<T>`, silently behave like reference types the moment a collection-typed member is involved.\n\n**Say this out loud:** \"Record equality is member-wise using the default comparer per property, and `List<T>` doesn't have value equality, so two records built from different list instances with identical contents won't be `==`. If I need that, I override `Equals`/`GetHashCode` with `SequenceEqual` myself rather than trusting the synthesized ones.\"",
  },
  {
    id: 'csharp-configureawait-and-valuetask',
    domain: 'languages',
    subject: 'csharp',
    topic: 'async',
    level: 'senior',
    kind: 'open',
    prompt:
      "You maintain a shared library whose async APIs are called from both an ASP.NET Core service and a WPF desktop app. When do you use `ConfigureAwait(false)`, and when would you expose a method as `ValueTask<T>` instead of `Task<T>`? What's the risk of using `ValueTask<T>` incorrectly?",
    modelAnswer:
      "`ConfigureAwait(false)` tells the `await` not to try to resume the continuation on the captured `SynchronizationContext`/current `TaskScheduler`. In library code I don't control the caller's context, so I use it after essentially every internal `await` — it prevents the classic deadlock where WPF/WinForms code blocks synchronously on the async call (`.Result`, `.Wait()`) while holding the UI `SynchronizationContext`, because the continuation would otherwise need that same thread to resume. ASP.NET Core (Kestrel) has had no `SynchronizationContext` by default since .NET Core, so there `ConfigureAwait(false)` isn't preventing a deadlock, but it's still worth doing in shared library code, both for consistency and for the small saving of skipping the context marshal, since the library doesn't know every caller. For `ValueTask<T>`, I only reach for it on a hot path that very frequently completes synchronously — a cache lookup that usually hits, for instance — where allocating a `Task<T>` on every call adds real GC pressure. The catch is that `ValueTask<T>` has a much narrower usage contract than `Task<T>`: it must be awaited (or converted once via `AsTask()`) exactly one time, must not be awaited twice or awaited concurrently from two places, and shouldn't be stored or passed around and inspected later, because its backing `IValueTaskSource` can be pooled and reused after the first consumption — doing any of that produces undefined behavior or exceptions, not a compile error. So I default to `Task<T>` everywhere, and only switch a specific method to `ValueTask<T>` after profiling shows allocations from that synchronous-completion path actually matter, keeping the usage local (await it immediately, never cache the `ValueTask` itself).",
    rubric: [
      'Explains ConfigureAwait(false) avoids capturing/resuming on the SynchronizationContext, preventing deadlocks when callers block on async results (WPF/WinForms)',
      'Notes ASP.NET Core has no SynchronizationContext by default, so there ConfigureAwait(false) is about library hygiene/perf rather than deadlock prevention',
      'Explains ValueTask<T> exists to avoid a Task allocation on hot paths that frequently complete synchronously',
      "States the ValueTask contract risk: it must be awaited exactly once and not cached/consumed concurrently, unlike Task<T>, because its source can be pooled",
      'Recommends Task<T> as the default, reaching for ValueTask<T> only after profiling shows allocation pressure',
    ],
    tags: ['configureawait', 'valuetask', 'async-await', 'performance', 'deadlocks'],
    source: 'topic-list',
    explanation:
      "This tests whether the candidate treats `ConfigureAwait(false)` and `ValueTask<T>` as defaults to sprinkle everywhere or as targeted tools for specific failure modes and hot paths — using either one without understanding the trade-off causes real bugs (deadlocks on one side, undefined behavior from misusing `ValueTask` on the other).\n\n**Say this out loud:** \"`ConfigureAwait(false)` protects library code from a caller's `SynchronizationContext` causing a deadlock; `ValueTask<T>` saves an allocation on hot, usually-synchronous paths, but it's single-use, so I keep it local and default to `Task<T>` everywhere else.\"",
  },
  {
    id: 'csharp-linq-deferred-execution-multiple-enumeration',
    domain: 'languages',
    subject: 'csharp',
    topic: 'linq',
    level: 'senior',
    kind: 'multi',
    prompt:
      "```csharp\nIEnumerable<int> Squares(IEnumerable<int> source)\n{\n    Console.WriteLine(\"Building query\");\n    return source.Select(x =>\n    {\n        Console.WriteLine($\"Evaluating {x}\");\n        return x * x;\n    });\n}\n\nvar query = Squares(new[] { 1, 2, 3 });\nConsole.WriteLine(\"Before first enumeration\");\nforeach (var s in query) { }\nConsole.WriteLine(\"Before second enumeration\");\nforeach (var s in query) { }\n```\nWhich statements about this code are true? Select all that apply.",
    options: [
      { id: 'a', text: '"Building query" is printed exactly once in total, at the moment `Squares(...)` is called, before either `foreach` runs' },
      { id: 'b', text: '"Evaluating {x}" is printed for every element **twice** in total (once per `foreach`), because `Select` uses deferred execution and `query` was never materialized, so each enumeration re-runs the whole pipeline over `source`' },
      { id: 'c', text: 'Calling `Squares(new[] { 1, 2, 3 })` immediately evaluates the `Select` projection and caches the three results, so the second `foreach` reuses the cached squares without printing "Evaluating" again' },
      { id: 'd', text: "Because `source` is an array (already fully realized in memory), LINQ automatically memoizes the `Select` results the first time `query` is enumerated" },
      { id: 'e', text: 'Adding `.ToList()` right after `.Select(...)` inside `Squares` would make "Evaluating" print only during the first `foreach`, because the list materializes the squares once and the second loop just reads the cached list — trading eager up-front work for avoiding the repeated computation' },
    ],
    answer: ['a', 'b', 'e'],
    tags: ['linq', 'deferred-execution', 'multiple-enumeration', 'iterators'],
    source: 'topic-list',
    explanation:
      "`Select` (like `Where`, `OrderBy`, and most LINQ-to-Objects operators) is **deferred**: it doesn't touch `source` when it's called, it just builds an iterator. `Console.WriteLine(\"Building query\")` runs immediately because it's a plain statement inside `Squares`, executed once when the method itself is invoked — before the deferred `Select` iterator even exists (`a` is true). Every `foreach` over `query` calls `GetEnumerator()` on that same unmaterialized pipeline, which walks `source` and re-invokes the selector from scratch, so \"Evaluating\" prints for all three elements on the first loop and all three again on the second — six prints total (`b` is true; `c` and `d` are false — nothing about `Select`, and nothing about the source being an array, causes automatic caching). This is the **multiple enumeration** trap: it silently doubles work, and it's worse than a performance issue when the source has side effects or isn't safely re-enumerable — a query built over `IQueryable`/EF Core re-runs the database query, a `yield return` iterator with external state can behave differently the second time, and a forward-only source like a `DbDataReader` or a consumed `Stream`-backed iterator can throw or return nothing at all. Calling `.ToList()` (or `.ToArray()`) once, right where the sequence is meant to be reused, forces one eager evaluation and caches the results, so the second enumeration is just a list read with no more \"Evaluating\" output (`e` is true) — the standard fix whenever a LINQ query is going to be enumerated more than once.\n\n**Say this out loud:** \"LINQ operators like `Select` are deferred, so every enumeration re-runs the whole pipeline unless I materialize it. If I'm going to enumerate a query more than once, or it has side effects, I call `ToList()` once and reuse that.\"",
  },
];
