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
      '`Point` is a `struct`, a **value type**. `var p2 = p1;` copies every field of `p1` into a brand-new, independent instance, so mutating `p2.X` has no effect on `p1`. `p1.X` stays `1`. `99` would only be correct if `Point` were a `class`: then `p1` and `p2` would be two references to the **same** object on the heap, and `p2.X = 99` would be visible through `p1` too. The assignment compiles fine, so the compile-error answer is wrong, and `p1.X` was explicitly set to `1` in the initializer, not left at the default `0`, so the `0` answer is wrong too.',
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
      'An `async Task` method returns a `Task` the caller can `await`; any exception thrown inside is captured on that `Task` and rethrown at the `await`, so an ordinary `try`/`catch` around the call sees it. `async void` is fire-and-forget: there is no `Task` to await, and an exception thrown inside it is raised on the current `SynchronizationContext` instead of being catchable by the caller, which typically crashes the process. It exists mainly for UI event handlers, which cannot return a value. A plain `void` method is not `async` at all, so it cannot `await`; blocking on `.GetAwaiter().GetResult()` inside it just makes the call synchronous and does not give the caller anything to `await` — and if this runs on a thread with a captured single-threaded `SynchronizationContext` (a UI thread, or classic ASP.NET), blocking like that risks a deadlock, because the awaited continuation needs that same thread to resume. `Task<void>` is not valid C# — `void` cannot be used as a type argument, so the `Task<void>` signature does not compile; use `Task` for "no return value" and `Task<T>` when you need one.',
  },
  {
    id: 'csharp-nullable-reference-warning',
    domain: 'languages',
    subject: 'csharp',
    topic: 'basics',
    level: 'mid',
    kind: 'single',
    prompt:
      "```csharp\n#nullable enable\n\npublic class UserService\n{\n    public string GetDisplayName(User? user)\n    {\n        return user.Name;\n    }\n}\n```\nWith nullable reference types enabled, what happens when this compiles, and what actually happens at runtime if `GetDisplayName(null)` is called?",
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
      "Nullable reference types are a **compile-time, flow-analysis feature**, not a runtime null-check mechanism: by default the diagnostics are warnings, not errors, so the \"build fails with error CS8602\" option is wrong — the project builds. Marking the parameter `User?` tells the compiler the argument may be `null`, and accessing `.Name` without narrowing (an `if (user is null) return ...;`, a null-conditional `user?.Name`, or a null-forgiving `user!.Name` when you're certain) triggers CS8602. Nothing about the annotation changes what happens at runtime: passing `null` still throws a plain `NullReferenceException` on the dereference, exactly as it would in old, non-nullable-aware code, so the `ArgumentNullException` option is wrong — there is no inserted guard. The warnings are real compiler diagnostics visible in the build output and CI, not just editor tooltips, so the \"only affect editor tooltips\" option is wrong too.",
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
      { id: 'a', text: 'It prints `InvalidOperationException`. `await` on the `WhenAll` task rethrows only the **first** inner exception, and `WhenAll` preserves input order in `Exception.InnerExceptions`, so `task1`\'s exception comes first. To see both, keep a reference to the task `WhenAll` returns instead of awaiting it inline: `var all = Task.WhenAll(task1, task2); try { await all; } catch { } var errors = all.Exception!.InnerExceptions;` — or read `task1.Exception` / `task2.Exception` once each task has completed' },
      { id: 'b', text: 'It prints `AggregateException`, because .NET wraps both exceptions into one custom type and rethrows that at the `await`' },
      { id: 'c', text: 'It prints `ArgumentException`, because `Task.WhenAll` always surfaces the exception of whichever task was supplied **last**' },
      { id: 'd', text: 'It prints `InvalidOperationException`, because `Task.WhenAll` cancels `task2` the moment `task1` faults, so `task2`\'s exception never gets recorded' },
    ],
    answer: 'a',
    tags: ['task', 'task-whenall', 'exception-handling', 'aggregateexception'],
    source: 'topic-list',
    explanation:
      "`Task.WhenAll` completes in a Faulted state carrying an `AggregateException` whose `InnerExceptions` contains every faulted task's exception, in the order the tasks were supplied to `WhenAll` — not completion order. When you `await` a faulted task (including the one `WhenAll` returns), the awaiter unwraps and rethrows only the **first** inner exception, which is why the `catch` here sees `InvalidOperationException` (the `AggregateException` answer is wrong: .NET doesn't wrap the two exceptions into some other custom type — the faulted `WhenAll` task's own `.Exception` really is an `AggregateException`, but `await` never lets that `AggregateException` itself surface at the call site; it always unwraps to just the first inner exception). The `ArgumentException` answer gets the order backwards, and the cancellation answer is wrong because `WhenAll` never cancels sibling tasks just because one faults — both tasks run to completion independently, so `task2.Exception` is populated too. Checking `.Exception.InnerExceptions` on a stored reference to the `WhenAll` task (or each task's own `.Exception`) after the `await` is the standard way to see every failure instead of only the first — don't call `Task.WhenAll` a second time to try to get at them.",
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
      "`First()` is meant for sequences you expect to be non-empty: it throws `InvalidOperationException` when there is nothing to return, so the \"silently returns `0`\" option is wrong — that's `FirstOrDefault()`'s behavior, not `First()`'s. `ArgumentOutOfRangeException` belongs to indexer/array access, not LINQ's empty-sequence case. The code compiles fine as `int`, so the compile-error option is wrong — it just throws at runtime. The real gotcha to flag in an interview: `FirstOrDefault()` on an empty `List<int>` returns `0`, which is indistinguishable from a real `0` already in the list, so when `0` is a valid value check `Any()` (or `Count == 0`) before calling `FirstOrDefault()`, or project to a nullable first — `numbers.Select(n => (int?)n).FirstOrDefault()` returns `null` instead of an ambiguous `0` for an empty sequence. LINQ has no `TryGetValue`-style \"first\" method that reports success separately from the value.",
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
      "Records synthesize member-wise `Equals`/`GetHashCode` that compare each of the record's underlying instance fields — the backing fields behind its positional or init-only properties, plus any fields declared explicitly — using `EqualityComparer<T>.Default`; a computed, expression-bodied property with no backing field isn't part of that comparison at all. For `List<string>`, that default comparer falls back to `object.Equals`/`GetHashCode` — reference equality — because `List<T>` never overrides them. `a.Items` and `b.Items` are two separately-`new`-ed lists, so even though their contents are equal, the field comparison fails and the whole record compares unequal, which surprises people who expect records to give full \"value equality\" out of the box. A related pitfall: record equality also compares a hidden `EqualityContract` property tied to the runtime type, so a derived record is never equal to a base-typed instance holding identical property values, even without any collection involved. To fix the collection case, I can't override `Equals(object)` directly — the compiler doesn't allow that on a record — so I declare `public virtual bool Equals(Order? other) => other is not null && Id == other.Id && Items.SequenceEqual(other.Items);` (non-virtual if the record is `sealed`) plus a matching `public override int GetHashCode()`, built by accumulating the elements rather than with `HashCode.Combine` (which only takes a fixed number of arguments and can't hash a variable-length list): `var hash = new HashCode(); hash.Add(Id); foreach (var item in Items) hash.Add(item); return hash.ToHashCode();`. Where I control the shape, I'd also consider wrapping the collection in a small type with its own `IEquatable<T>` implementation, since even BCL \"immutable\" collections like `ImmutableArray<T>`/`ImmutableList<T>` don't give structural equality for free either — I'd still need to compare or wrap them explicitly. Either way I don't trust the default record equality once any member's type doesn't itself implement value equality.",
    rubric: [
      "Explains records synthesize member-wise Equals/GetHashCode over the record's underlying instance fields using EqualityComparer<T>.Default (not arbitrary computed properties without a backing field)",
      "Explains List<T> doesn't override Equals/GetHashCode, so that comparison is reference equality — two records built from different-but-equal-content lists are not equal, despite records' value-equality reputation",
      'Mentions the EqualityContract/runtime-type check: a derived record is never equal to a base-typed instance even with identical property values',
      "Proposes a concrete fix: declare `public virtual bool Equals(Order? other)` (not `Equals(object)`, which can't be overridden on a record) plus `public override int GetHashCode()` built by accumulating `HashCode.Add` over the elements, rather than assuming a BCL immutable collection type gives structural equality for free",
    ],
    tags: ['records', 'equality', 'gotchas', 'collections'],
    source: 'topic-list',
    explanation:
      "Interviewers ask this to see whether \"records have value equality\" is understood at the level of what the compiler actually generates, not as marketing. It's a common source of subtle bugs: unit tests that compare DTOs full of lists, or records used as dictionary keys or in `HashSet<T>`, silently behave like reference types the moment a collection-typed member is involved.\n\n**Say this out loud:** \"Record equality is member-wise over the record's fields using the default comparer, and `List<T>` doesn't have value equality, so two records built from different list instances with identical contents won't be `==`. If I need that, I add my own `Equals(Order? other)` and `GetHashCode()` using `SequenceEqual` instead of trusting the synthesized ones.\"",
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
      "`ConfigureAwait(false)` tells the `await` not to try to resume the continuation on the captured `SynchronizationContext`/current `TaskScheduler`. In library code I don't control the caller's context, so I use it after essentially every internal `await` — it prevents the classic deadlock where WPF/WinForms code blocks synchronously on the async call (`.Result`, `.Wait()`) while holding the UI `SynchronizationContext`, because the continuation would otherwise need that same thread to resume. That only holds if `ConfigureAwait(false)` is applied consistently: it has to be on every `await` in the chain the blocked call goes through, not just the outermost one, because a single captured continuation anywhere downstream is enough to deadlock. ASP.NET Core (Kestrel) has had no `SynchronizationContext` by default since .NET Core, so there `ConfigureAwait(false)` isn't preventing a deadlock, but it's still worth doing in shared library code, both for consistency and for the small saving of skipping the context marshal, since the library doesn't know every caller. For `ValueTask<T>`, I only reach for it on a hot path that very frequently completes synchronously — a cache lookup that usually hits, for instance — where allocating a `Task<T>` on every call adds real GC pressure. The catch is that `ValueTask<T>` has a much narrower usage contract than `Task<T>`: it must be awaited (or converted once via `AsTask()`) exactly one time, must not be awaited twice or awaited concurrently from two places, and shouldn't be stored or passed around and inspected later, because its backing `IValueTaskSource` can be pooled and reused after the first consumption — doing any of that produces undefined behavior or exceptions, not a compile error. So I default to `Task<T>` everywhere, and only switch a specific method to `ValueTask<T>` after profiling shows allocations from that synchronous-completion path actually matter, keeping the usage local (await it immediately, never cache the `ValueTask` itself).",
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
      { id: 'e', text: 'Adding `.ToList()` right after `.Select(...)` inside `Squares` would make "Evaluating" print exactly three times total, all while `Squares(...)` itself runs — before "Before first enumeration" ever prints — and neither `foreach` would print "Evaluating" at all, since both would just be reading the already-built `List<int>`' },
    ],
    answer: ['a', 'b', 'e'],
    tags: ['linq', 'deferred-execution', 'multiple-enumeration', 'iterators'],
    source: 'topic-list',
    explanation:
      "`Select` (like `Where`, `OrderBy`, and most LINQ-to-Objects operators) is **deferred**: it doesn't touch `source` when it's called, it just builds an iterator. `Console.WriteLine(\"Building query\")` runs immediately because it's a plain statement inside `Squares`, executed once when the method itself is invoked — before the deferred `Select` iterator even exists, so the \"printed exactly once\" statement is true. Every `foreach` over `query` calls `GetEnumerator()` on that same unmaterialized pipeline, which walks `source` and re-invokes the selector from scratch, so \"Evaluating\" prints for all three elements on the first loop and all three again on the second — six prints total. So the \"printed twice\" statement is true, and the two caching claims are false — nothing about `Select`, and nothing about the source being an array, causes automatic caching. This is the **multiple enumeration** trap: it silently doubles work, and it's worse than a performance issue when the source has side effects or isn't safely re-enumerable — a query built over `IQueryable`/EF Core re-runs the database query, a `yield return` iterator with external state can behave differently the second time, and a forward-only source like a `DbDataReader` or a consumed `Stream`-backed iterator can throw or return nothing at all. Calling `.ToList()` (or `.ToArray()`) turns the deferred pipeline into an eagerly-evaluated one: had `Squares` done that internally right after `.Select(...)`, all three `Evaluating` prints would happen immediately during the `Squares(...)` call — before `\"Before first enumeration\"` ever prints — and neither `foreach` would print `Evaluating` at all, since both would just be reading over the already-built `List<int>`, so the `.ToList()` statement is true. It's still the standard fix whenever a LINQ query is going to be enumerated more than once — you just have to place the `.ToList()` where you actually want the eager evaluation to happen, not assume it happens lazily on each enumeration.\n\n**Say this out loud:** \"LINQ operators like `Select` are deferred, so every enumeration re-runs the whole pipeline unless I materialize it. If I'm going to enumerate a query more than once, or it has side effects, I call `ToList()` once and reuse that.\"",
  },
];
