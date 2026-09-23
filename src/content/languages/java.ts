// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  {
    id: 'java-primitives-vs-wrapper-null',
    domain: 'languages',
    subject: 'java',
    topic: 'basics',
    level: 'junior',
    kind: 'single',
    prompt:
      "```java\npublic class Box {\n    private Integer count;\n\n    public int getCount() {\n        return count;\n    }\n}\n\nBox box = new Box();\nSystem.out.println(box.getCount());\n```\nWhat happens when this runs?",
    options: [
      {
        id: 'a',
        text: 'Throws `NullPointerException`: `count` is an uninitialized `Integer` field, so it defaults to `null`, and returning it from a method declared `int` forces auto-unboxing (`count.intValue()`), which cannot be done on `null`',
      },
      { id: 'b', text: 'Prints `0`, because `Integer` fields default to `0` just like `int` fields' },
      { id: 'c', text: 'Fails to compile, because a method declared to return `int` cannot `return` an `Integer` field' },
      { id: 'd', text: 'Prints `null`' },
    ],
    answer: 'a',
    tags: ['primitives', 'autoboxing', 'null-safety'],
    source: 'topic-list',
    explanation:
      "`int` and `Integer` are different things: `int` is a primitive that always holds a value and has no concept of `null`, while `Integer` is an object reference whose default (uninitialized instance field) value is `null`, not `0` — option `b` is wrong. `getCount()` compiles fine (`c` is wrong): the compiler is happy to auto-unbox an `Integer` into an `int` return value by inserting an implicit `count.intValue()` call. The problem is only at runtime: `count` is `null`, and calling `.intValue()` on `null` throws `NullPointerException` before anything can be printed, so `d` (which assumes the primitive return type could somehow hold and print `null`) is also wrong. This is the classic unboxing-NPE trap: any place an `Integer`, `Long`, `Boolean`, etc. is used where a primitive is expected — an arithmetic expression, a primitive method parameter, a primitive return — implicitly unboxes it, and a `null` wrapper turns that implicit call into a runtime exception.",
  },
  {
    id: 'java-synchronized-keyword-basics',
    domain: 'languages',
    subject: 'java',
    topic: 'concurrency',
    level: 'junior',
    kind: 'single',
    prompt:
      "```java\npublic class Counter {\n    private int count = 0;\n\n    public synchronized void increment() {\n        count++;\n    }\n\n    public int getCount() {\n        return count;\n    }\n}\n```\nTwo threads repeatedly call `increment()` on the same `Counter` instance. What does marking `increment()` `synchronized` guarantee?",
    options: [
      {
        id: 'a',
        text: "Only one thread at a time can execute `increment()` on this instance, because the method acquires the intrinsic lock on `this` before running and releases it when it returns — this prevents the lost-update race on `count++`",
      },
      {
        id: 'b',
        text: '`getCount()` becomes thread-safe too, because marking one method `synchronized` locks every method of the class, synchronized or not',
      },
      { id: 'c', text: '`count++` becomes a single atomic CPU instruction, so `synchronized` is not actually needed here — plain `int` increments are already thread-safe' },
      { id: 'd', text: '`synchronized` documents intent for other developers, but the JVM does not actually stop two threads from running `increment()` at the same time' },
    ],
    answer: 'a',
    tags: ['synchronized', 'thread-safety', 'fundamentals'],
    source: 'topic-list',
    explanation:
      "A `synchronized` instance method acquires the intrinsic (monitor) lock on `this` before its body runs and releases it on return (normally or via exception), so only one thread can be inside `increment()` on a given `Counter` instance at any moment — that mutual exclusion is exactly what prevents the classic read-modify-write race on `count++` (`a` is correct). `synchronized` is not class-wide: it only excludes other code that synchronizes on the **same lock object**; `getCount()` here is not `synchronized` at all, so it can run concurrently with `increment()` and, without a happens-before edge, is not guaranteed to see the latest value (`b` is wrong). `count++` is actually three separate steps — read, add one, write back — so two threads can interleave and lose an update; that is precisely why the method needs `synchronized` (`c` is wrong). And `synchronized` is enforced by the JVM, not a comment-level convention: a second thread calling `increment()` while the lock is held genuinely blocks until it's released (`d` is wrong).",
  },
  {
    id: 'java-integer-cache-equality',
    domain: 'languages',
    subject: 'java',
    topic: 'basics',
    level: 'mid',
    kind: 'single',
    prompt:
      "```java\nInteger a = 100;\nInteger b = 100;\nSystem.out.println(a == b);\n\nInteger c = 200;\nInteger d = 200;\nSystem.out.println(c == d);\n```\nWhat does this print?",
    options: [
      {
        id: 'a',
        text: '`true` then `false` — autoboxing a literal in `[-128, 127]` goes through `Integer.valueOf`, which the JLS requires to return a cached instance for that range, so `a` and `b` reference the same object. `200` is outside the cache range, so each autoboxing produces a new `Integer` object and `c == d` compares two different references',
      },
      { id: 'b', text: '`true` then `true`, because `Integer` overrides `==` to compare by value, the same way `equals` does' },
      { id: 'c', text: '`false` then `false`, because autoboxing always creates a brand-new `Integer` object and `==` on wrapper types always compares references' },
      { id: 'd', text: '`true` then `false`, but only in a debugger; in an optimized production build the JIT interns every boxed `Integer` so both print `true`' },
    ],
    answer: 'a',
    tags: ['autoboxing', 'integer-cache', 'equality'],
    source: 'topic-list',
    explanation:
      "`==` on wrapper types always compares **references**, never values — Java has no operator overloading, so `b` is wrong on principle. But `Integer.valueOf` (which literal autoboxing calls) is required by the JLS to cache and reuse instances for values `-128` to `127`, so boxing `100` twice yields the same cached object and `a == b` is `true`; `200` falls outside that guaranteed range, so `c` and `d` are typically two distinct objects and `c == d` is `false` — this makes `c` wrong, since it ignores the cache entirely. Nothing about the JIT or build mode changes this: caching happens in `Integer.valueOf` itself, at every run, not as a debug-only artifact (`d` is wrong). The takeaway for real code: never compare wrapper types with `==` — use `.equals()` (or unbox to `int` first) so correctness doesn't depend on an internal caching range that most developers don't even know exists.",
  },
  {
    id: 'java-list-of-immutability',
    domain: 'languages',
    subject: 'java',
    topic: 'collections-and-streams',
    level: 'mid',
    kind: 'single',
    prompt: "```java\nList<String> names = List.of(\"Ana\", \"Bo\");\nnames.add(\"Cy\");\n```\nWhat happens when this runs?",
    options: [
      {
        id: 'a',
        text: '`names.add("Cy")` throws `UnsupportedOperationException` — `List.of` returns a genuinely immutable list, and every structural-modification method (`add`, `remove`, `set`, `clear`) throws on it',
      },
      { id: 'b', text: 'It silently adds `"Cy"`; `List.of` returns a plain, resizable `ArrayList`, the same as `Arrays.asList`' },
      { id: 'c', text: 'It compiles fine but throws `ArrayIndexOutOfBoundsException`, because the list is backed by a fixed-size array' },
      { id: 'd', text: "It fails to compile, because `List.of(...)` returns `List<String>` and `add` is not a method declared on the `List` interface" },
    ],
    answer: 'a',
    tags: ['collections', 'immutability', 'list-of'],
    source: 'topic-list',
    explanation:
      "`List.of(...)` (Java 9+) returns one of the JDK's immutable `List` implementations: it rejects `null` elements up front and throws `UnsupportedOperationException` from every method that would structurally modify it (`add`, `remove`, `addAll`, `clear`) or replace an element (`set`) — that's the whole point of the factory. It is not a resizable `ArrayList` (`b` is wrong), and it's also stricter than `Arrays.asList(...)`, which is fixed-size but still lets you call `set` on existing indices; `List.of` forbids that too. The failure is a runtime `UnsupportedOperationException`, not an indexing exception (`c` is wrong — nothing here even attempts to index past the end). And `add` compiles fine: `List` declares `add` as part of its interface (any mutable implementation supports it), it just isn't supported by this particular immutable implementation, so the failure only shows up at runtime (`d` is wrong).",
  },
  {
    id: 'java-collectors-groupingby-downstream',
    domain: 'languages',
    subject: 'java',
    topic: 'collections-and-streams',
    level: 'mid',
    kind: 'multi',
    prompt:
      "```java\nrecord Employee(String department, double salary) {}\n\nList<Employee> employees = List.of(\n    new Employee(\"eng\", 90_000),\n    new Employee(\"eng\", 110_000),\n    new Employee(\"sales\", 70_000)\n);\n\nMap<String, List<Employee>> byDept = employees.stream()\n    .collect(Collectors.groupingBy(Employee::department));\n\nMap<String, Double> avgSalaryByDept = employees.stream()\n    .collect(Collectors.groupingBy(Employee::department, Collectors.averagingDouble(Employee::salary)));\n```\nWhich statements about this code are true? Select all that apply.",
    options: [
      {
        id: 'a',
        text: 'By default, `byDept` is backed by a plain `HashMap` with mutable `ArrayList` values — neither the map\'s iteration order nor the concrete `List` implementation of the values is guaranteed',
      },
      {
        id: 'b',
        text: '`avgSalaryByDept.get("eng")` is `100000.0` — the two-argument `groupingBy` overload applies the downstream collector (here `averagingDouble`) to each group\'s elements instead of collecting them into a `List`',
      },
      { id: 'c', text: '`Collectors.groupingBy` always returns a `LinkedHashMap`, so `byDept` preserves the order departments first appeared in the stream' },
      { id: 'd', text: "Passing `Collectors.averagingDouble` as the downstream collector mutates the original `employees` list in place, replacing each `Employee` with its department's average salary" },
      {
        id: 'e',
        text: 'To get a guaranteed-order or specific `Map` implementation (e.g. a `TreeMap` sorted by department name), you need the three-argument `groupingBy(classifier, mapFactory, downstream)` overload',
      },
    ],
    answer: ['a', 'b', 'e'],
    tags: ['streams', 'collectors', 'groupingby'],
    source: 'topic-list',
    explanation:
      "The single-argument `groupingBy(classifier)` collects each group into a `List` and returns a `HashMap<K, List<V>>` — neither the map type nor its iteration order is part of the contract, and the `List` values are plain mutable `ArrayList`s (`a` is true). The two-argument overload, `groupingBy(classifier, downstream)`, applies the given downstream `Collector` to each group instead of defaulting to `toList()`; `averagingDouble(Employee::salary)` reduces each group to the mean of its `salary` values, so `\"eng\"` (90 000 and 110 000) averages to `100000.0` (`b` is true). `groupingBy` does **not** return a `LinkedHashMap` by default — it's a `HashMap`, so `c` is false and department order is not preserved. Streams are non-mutating by design: collecting never writes back into the source list or its elements, it only builds a new result, so `d` is false — nothing about `employees` changes. To control the resulting `Map` implementation (for stable iteration, sorting, concurrency, etc.) you need the three-argument overload `groupingBy(classifier, mapFactory, downstream)`, supplying something like `TreeMap::new` as the `mapFactory` (`e` is true).",
  },
  {
    id: 'java-generics-wildcard-pecs',
    domain: 'languages',
    subject: 'java',
    topic: 'basics',
    level: 'senior',
    kind: 'open',
    prompt:
      "```java\npublic static void copy(List<? super Number> dest, List<? extends Number> src) {\n    for (Number n : src) {\n        dest.add(n);\n    }\n}\n```\nWhy is `src` declared `List<? extends Number>` and `dest` declared `List<? super Number>` here? Walk through the PECS mnemonic, what each wildcard actually permits and forbids on that list at compile time, why plain `List<Number>` wouldn't work for either parameter, and what type erasure means for both lists at runtime.",
    modelAnswer:
      "PECS is \"Producer Extends, Consumer Super\": use `? extends T` for a parameter you only read from (it *produces* `T`s for you), and `? super T` for a parameter you only write into (it *consumes* `T`s from you). `src` is a producer here — the method only reads `Number`s out of it via the for-each loop — so `List<? extends Number>` lets a caller pass a `List<Integer>`, `List<Double>`, or `List<Number>` itself, and every element read out is safely widened to `Number`. The compiler forbids calling `src.add(...)` (except `add(null)`) on that reference, because it only knows the actual list holds *some* unknown subtype of `Number` — it could be a `List<Integer>`, and adding a `Double` to it would corrupt that list, so the compiler blocks any write that isn't provably safe. `dest` is a consumer — the method only writes `Number`s into it via `dest.add(n)` — so `List<? super Number>` lets a caller pass a `List<Number>`, `List<Object>`, or any other supertype's list, and every `add(Number)` call is safe because whatever the real element type is, it's guaranteed to be `Number` or a supertype of it. The compiler in turn restricts *reading*: `dest.get(i)` only gives you back `Object`, because it can't know the actual, more specific type. Plain `List<Number>` wouldn't work for `src` because Java generics are invariant, not covariant: `List<Integer>` is not a `List<Number>` even though `Integer` is a `Number`, so a caller with a `List<Integer>` couldn't call `copy` at all if `src` were typed `List<Number>`. Symmetrically, `List<Number>` wouldn't work for `dest` because a caller with a `List<Object>` — a perfectly good place to stash `Number`s — has no way to pass it, since `List<Object>` isn't a `List<Number>` either. At runtime, generics are erased: both `List<? super Number>` and `List<? extends Number>` compile down to plain `List` (raw type) in the bytecode — there is no wildcard or bound information left for the JVM to check. All of the safety above is enforced entirely by the compiler at the call site (and by inserted casts on reads); it's a compile-time-only guarantee, which is also why you can't do things like `new List<? extends Number>[10]` or check `instanceof List<? extends Number>` at runtime — the JVM genuinely doesn't know.",
    rubric: [
      "States and correctly applies PECS: src is a producer (only read from) so it uses extends, dest is a consumer (only written to) so it uses super",
      "Explains why List<? extends Number> forbids add(Number) (except null) — the compiler only knows some unknown Number subtype backs it, so an arbitrary add could corrupt it — while reads are safely widened to Number",
      "Explains why List<? super Number> permits add(Number) safely but get(...) only yields Object, since the actual element type could be any supertype of Number",
      "Explains that generics are invariant (List<Integer> is not a List<Number>), which is why a plain List<Number> parameter would reject callers passing List<Integer> for src or List<Object> for dest",
      "States that type erasure removes wildcard/bound information at runtime — both parameter types are just List (raw) in bytecode, and the safety is compile-time only",
    ],
    tags: ['generics', 'wildcards', 'pecs', 'type-erasure'],
    source: 'topic-list',
    explanation:
      "This separates candidates who've memorized \"PECS\" as a slogan from ones who understand *why* the compiler allows or forbids specific calls on each wildcard, and whether they know this is entirely a compile-time fiction erased by runtime — both of which show up constantly in API design for generic utility methods (`Collections.copy`, `Comparator.comparing`, repository/mapper interfaces, and so on).\n\n**Say this out loud:** \"`src` only produces values I read, so it's `? extends Number`; `dest` only consumes values I write, so it's `? super Number` — that's PECS. Plain `List<Number>` wouldn't accept a caller's `List<Integer>` or `List<Object>` because generics are invariant, and all of this is erased to raw `List` at runtime anyway.\"",
  },
  {
    id: 'java-hashmap-equals-hashcode-contract',
    domain: 'languages',
    subject: 'java',
    topic: 'collections-and-streams',
    level: 'senior',
    kind: 'open',
    prompt:
      "```java\npublic class Point {\n    private final int x;\n    private final int y;\n\n    public Point(int x, int y) {\n        this.x = x;\n        this.y = y;\n    }\n\n    @Override\n    public boolean equals(Object o) {\n        if (!(o instanceof Point other)) return false;\n        return this.x == other.x && this.y == other.y;\n    }\n}\n\nMap<Point, String> labels = new HashMap<>();\nlabels.put(new Point(1, 2), \"origin-ish\");\n\nSystem.out.println(labels.get(new Point(1, 2)));\n```\nWhy does this print `null` instead of `\"origin-ish\"`? What is the `equals`/`hashCode` contract, and what else breaks if you violate it — for example with a mutable key whose hash-relevant fields change after insertion?",
    modelAnswer:
      "`Point` overrides `equals` but never overrides `hashCode`, so it still inherits `Object`'s default `hashCode`, which is essentially identity-based (derived from the object's identity, not its fields). The two `Point(1, 2)` instances are `equals()`-equal but have different, essentially-random hash codes. `HashMap.get` doesn't scan every entry and call `equals` on each — it first calls `hashCode()` on the key to compute a bucket index, and only compares with `equals()` against whatever is already in *that* bucket. Since the two instances hash to (most likely) different buckets, `get` looks in the wrong bucket entirely, never even calls `equals` against the stored entry, and returns `null`. The formal contract (from `Object`'s Javadoc) is: if `a.equals(b)` is `true`, then `a.hashCode() == b.hashCode()` must also be true; the converse isn't required — two unequal objects are allowed to share a hash code, that's just a collision, and `HashMap` resolves collisions by falling back to `equals()` for every entry within the same bucket. Overriding one method without the other breaks that contract and silently breaks every hash-based collection (`HashMap`, `HashSet`, `Hashtable`, `ConcurrentHashMap`) built on the type — lookups, `containsKey`, and `remove` all fail to find entries that logically should match. A second, more insidious violation is a genuinely mutable key: even with a *correct* matching `equals`/`hashCode` pair, if you insert a key and later mutate a field that both methods read, the object's hash code changes but its position in the table doesn't — the entry is now filed under its old hash code's bucket while a fresh lookup computes the new one, so the entry becomes unfindable (`get`, `containsKey`, and `remove` for that key all fail), effectively leaking it forever inside the map. The fix for the shown bug is to implement `hashCode` consistently with `equals` (e.g. `Objects.hash(x, y)`, or make `Point` a `record`, which the compiler generates both for automatically and consistently). The fix for the mutable-key hazard is broader: treat any object used as a `HashMap`/`HashSet` key as effectively immutable for every field involved in `equals`/`hashCode` — make those fields `final` and never expose setters for them, or don't use a mutable object as a key at all.",
    rubric: [
      'Explains the actual HashMap.get lookup mechanism: hashCode() picks a bucket first, then equals() is used only to compare within that bucket',
      "States that Object's default hashCode is identity-based, so overriding equals without hashCode gives equal objects different hash codes, causing get/put to miss entries that should match",
      'States the formal contract: equal objects (per equals) must produce equal hashCodes, while unequal objects may share a hashCode (a collision, resolved by equals within the bucket)',
      "Describes the mutable-key hazard: mutating a hash-relevant field after insertion changes the key's hash code without moving it in the table, making the entry effectively unfindable/leaked",
      'Proposes a concrete fix: implement equals/hashCode consistently (e.g. Objects.hash or a record) and treat hash-relevant fields on map/set keys as effectively immutable',
    ],
    tags: ['hashmap', 'equals', 'hashcode', 'collections', 'contracts'],
    source: 'topic-list',
    explanation:
      "This question checks whether \"always override `hashCode` when you override `equals`\" is understood mechanically — as a consequence of how hash tables actually look things up — rather than as a rule memorized from a linter warning. It also surfaces whether the candidate knows the sharper, harder-to-debug failure mode: a mutable key that was correct on insertion becoming permanently unfindable later.\n\n**Say this out loud:** \"`HashMap` finds a bucket with `hashCode()` and only then compares with `equals()`, so overriding one without the other makes equal objects land in different buckets and lookups silently miss — and even with both overridden correctly, mutating a key's hash-relevant fields after insertion strands the entry in the wrong bucket forever.\"",
  },
  {
    id: 'java-completablefuture-composition',
    domain: 'languages',
    subject: 'java',
    topic: 'concurrency',
    level: 'senior',
    kind: 'open',
    prompt:
      "You're calling two independent remote services and want to combine their results with proper error handling, without blocking the calling thread:\n```java\nCompletableFuture<User> userFuture = CompletableFuture.supplyAsync(() -> fetchUser(userId));\nCompletableFuture<List<Order>> ordersFuture = CompletableFuture.supplyAsync(() -> fetchOrders(userId));\n\nCompletableFuture<UserSummary> summary = userFuture\n    .thenCombine(ordersFuture, (user, orders) -> new UserSummary(user, orders))\n    .exceptionally(ex -> UserSummary.empty());\n```\nWalk through what `thenCombine` and `exceptionally` do here, and when you'd reach for `thenCompose` instead of `thenApply`. What's wrong with calling `supplyAsync` without an explicit `Executor` in a server application, and how would you fix it? How does `exceptionally` differ from `handle`?",
    modelAnswer:
      "`thenCombine` registers a callback that fires once **both** `userFuture` and `ordersFuture` have completed successfully, applying the given `BiFunction` to their two results and producing a new `CompletableFuture<UserSummary>` — it never blocks the calling thread; it just wires up a continuation that some thread (a common-pool or executor thread) runs later. `thenApply` and `thenCompose` differ in what the mapping function returns: `thenApply(Function<T,R>)` is for a plain synchronous transform that returns a value `R` directly; `thenCompose(Function<T, CompletableFuture<R>>)` is for chaining another *asynchronous* step whose function itself returns a `CompletableFuture<R>` — it flattens the result the way `Optional.flatMap`/`Stream.flatMap` do. Using `thenApply` with a function that returns a `CompletableFuture<X>` would produce a nested `CompletableFuture<CompletableFuture<X>>`, which is almost always a bug (you'd have to unwrap it again); `thenCompose` avoids that nesting. `exceptionally(Function<Throwable,T>)` only runs on the **failure** path — if `userFuture` or `ordersFuture` (or the `thenCombine` function itself) throws, this produces a fallback `UserSummary.empty()`; if nothing failed, `exceptionally` is skipped entirely and the successful `UserSummary` passes through unchanged. `handle(BiFunction<T,Throwable,R>)` differs by running on **both** paths — success and failure — always receiving one of the two as `null`, and always producing a new result; it's the right tool when you need to observe or react to the outcome regardless of whether it succeeded (logging either way, or transforming a success value too), whereas `exceptionally` (and its sibling `whenComplete`, which observes but doesn't transform) is narrower. The bug in the snippet as given: `supplyAsync` with no second argument runs its supplier on `ForkJoinPool.commonPool()`, a shared, JVM-wide pool sized roughly to the number of CPU cores. If `fetchUser`/`fetchOrders` do blocking I/O (a blocking JDBC call, a blocking HTTP client), those threads sit blocked on that shared pool, starving it for every other component in the JVM that also relies on the common pool by default — including parallel streams. The fix is to pass an explicit, dedicated `Executor`: `CompletableFuture.supplyAsync(() -> fetchUser(userId), executor)`, where `executor` is a bounded pool sized for blocking I/O and isolated from the common pool; since Java 21, if the work is genuinely I/O-bound and blocking, `Executors.newVirtualThreadPerTaskExecutor()` is also a reasonable choice, since virtual threads are cheap enough that blocking one doesn't starve a limited pool of platform threads the way blocking a common-pool thread does.",
    rubric: [
      'Explains thenCombine registers a callback that runs once both futures complete successfully, combining their results without blocking the calling thread',
      'Explains the thenApply vs thenCompose distinction: thenApply for a plain synchronous transform, thenCompose when the mapping function itself returns a CompletableFuture, to avoid nested CompletableFuture<CompletableFuture<T>>',
      'Explains exceptionally only runs on the failure path and supplies a fallback, while handle runs on both success and failure and can transform either outcome',
      'States that supplyAsync without an Executor argument runs on the shared ForkJoinPool.commonPool(), and blocking I/O there starves other consumers of that pool',
      'Proposes a fix: pass a dedicated/bounded Executor, optionally noting Java 21 virtual threads (Executors.newVirtualThreadPerTaskExecutor()) as an alternative for blocking I/O-bound work',
    ],
    tags: ['completablefuture', 'concurrency', 'executors', 'virtual-threads'],
    source: 'topic-list',
    explanation:
      "This tests whether `CompletableFuture` composition is understood as building a non-blocking pipeline of callbacks — not just a marginally nicer wrapper around `Future.get()` — and whether the candidate knows the very common production mistake of running blocking work on the shared common pool by omission.\n\n**Say this out loud:** \"`thenCombine` waits for both futures without blocking the caller, `thenCompose` avoids nesting when the next step is itself asynchronous, and `exceptionally` only covers the failure path while `handle` sees both outcomes; and I never let blocking I/O run on the default `ForkJoinPool.commonPool()` — I pass an explicit executor, or use virtual threads for that on Java 21.\"",
  },
];
