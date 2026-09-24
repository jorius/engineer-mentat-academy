// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  // fundamentals
  {
    id: 'nodejs-esm-dirname-migration',
    domain: 'runtimes',
    subject: 'nodejs',
    topic: 'fundamentals',
    level: 'junior',
    kind: 'single',
    prompt:
      'You switch a package to ES modules by adding `"type": "module"` to `package.json`. Which line in `server.js` now **throws at runtime**?',
    options: [
      { id: 'a', text: '```js\nconst publicDir = path.join(__dirname, \'public\');\n```' },
      { id: 'b', text: '```js\nimport fs from \'node:fs\';\n```' },
      { id: 'c', text: '```js\nconst config = await import(\'./config.js\');\n```\n(at the top level)' },
      { id: 'd', text: '```js\nexport default function handler(req, res) {}\n```' },
    ],
    answer: 'a',
    tags: ['esm', 'commonjs', 'modules'],
    source: 'topic-list',
    explanation:
      '`__dirname`, `__filename`, `require`, `module` and `exports` are **CommonJS wrapper variables**: Node injects them by wrapping each CJS file in a function. ES modules are not wrapped, so `__dirname` is a `ReferenceError`. Use `import.meta.dirname` (Node 20.11+) or `path.dirname(fileURLToPath(import.meta.url))`, and `createRequire(import.meta.url)` if you still need `require`.\n\nTop-level `await` is legal in ESM (it is illegal in CJS), default imports of built-ins work, and `export default` is the ESM way to export. Other ESM differences worth knowing: always strict mode, imports are live read-only bindings, and the module graph is loaded asynchronously.',
    hint: 'Ask which identifiers Node injects by wrapping each CommonJS file in a function, and whether ES modules get that wrapper.',
  },
  {
    id: 'nodejs-libuv-threadpool-operations',
    domain: 'runtimes',
    subject: 'nodejs',
    topic: 'fundamentals',
    level: 'mid',
    kind: 'multi',
    prompt:
      'Node runs your JavaScript on one thread, but libuv keeps a **thread pool** (default size 4, `UV_THREADPOOL_SIZE`). Which of these async operations are executed on that thread pool? Select all that apply.',
    options: [
      { id: 'a', text: '`fs.readFile(path, cb)`' },
      { id: 'b', text: '`crypto.pbkdf2(pw, salt, 1e5, 64, \'sha512\', cb)`' },
      { id: 'c', text: 'Reading the body of an incoming HTTP request from its socket' },
      { id: 'd', text: '`dns.lookup(\'api.example.com\', cb)` (also used implicitly by `http.get` with a hostname)' },
    ],
    answer: ['a', 'b', 'd'],
    tags: ['libuv', 'threadpool', 'async-io', 'core-25'],
    source: 'core-list',
    explanation:
      'Network sockets do **not** use the pool: libuv registers them with the kernel readiness API (epoll, kqueue, IOCP) and the event loop is notified in the poll phase, which is why one thread can hold tens of thousands of connections. File system calls, `dns.lookup` (it wraps blocking `getaddrinfo`), async crypto (`pbkdf2`, `scrypt`, `randomBytes`) and async `zlib` have no portable non-blocking kernel API, so they run on the pool.\n\nThe practical consequence: with the default 4 threads, four slow `pbkdf2` hashes or DNS lookups queue every other `fs` call behind them. Raise `UV_THREADPOOL_SIZE` (set before the pool is first used) or move the hashing off the request path. This is the concrete answer to "how does JavaScript handle async work if it is single-threaded".',
    hint: 'Separate work the kernel can report as ready (epoll, kqueue, IOCP) from blocking system calls that libuv has to hand to a worker thread.',
  },
  {
    id: 'nodejs-async-function-runs-sync',
    domain: 'runtimes',
    subject: 'nodejs',
    topic: 'fundamentals',
    level: 'junior',
    kind: 'predict',
    language: 'javascript',
    prompt: 'A teammate marked a CPU-heavy function `async` "so it does not block". What does this print, one value per line?',
    code: `async function sumTo(n) {
  console.log('sum start');
  let total = 0;
  for (let i = 1; i <= n; i++) {
    total += i;
  }
  console.log('sum done');
  return total;
}

sumTo(1000).then((total) => console.log('total ' + total));
console.log('after call');`,
    answer: 'sum start\nsum done\nafter call\ntotal 500500',
    tags: ['async-await', 'blocking', 'core-25'],
    source: 'core-list',
    explanation:
      'An `async` function runs **synchronously** until its first `await`. There is no `await` here, so the whole loop runs on the caller\'s stack before `after call` prints. The returned promise is already fulfilled when `sumTo` returns; only the `.then` callback is deferred, as a microtask that runs after the script finishes, which is why `total 500500` comes last.\n\n`async` changes how a result is delivered, not where the work runs. Real non-blocking behaviour comes from the runtime doing the work elsewhere (the kernel, libuv\'s pool) or from you moving CPU work to a worker thread.',
    hint: 'Remember how far an `async` function runs before it first yields control, and what that means when its body never uses `await`.',
  },

  // event-loop-phases
  {
    id: 'nodejs-set-immediate-phase',
    domain: 'runtimes',
    subject: 'nodejs',
    topic: 'event-loop-phases',
    level: 'junior',
    kind: 'single',
    prompt: 'In which phase of the Node.js event loop are `setImmediate()` callbacks executed?',
    options: [
      { id: 'a', text: 'timers' },
      { id: 'b', text: 'poll' },
      { id: 'c', text: 'check' },
      { id: 'd', text: 'close callbacks' },
    ],
    answer: 'c',
    tags: ['event-loop', 'setImmediate'],
    source: 'notion',
    explanation:
      'One loop iteration runs these phases in order:\n\n1. **timers**: expired `setTimeout` / `setInterval` callbacks\n2. **pending callbacks**: some system I/O callbacks deferred from the previous iteration\n3. **idle, prepare**: internal\n4. **poll**: wait for and run I/O callbacks (most of your code runs here)\n5. **check**: `setImmediate` callbacks\n6. **close callbacks**: e.g. `socket.on(\'close\')`\n\n`setImmediate` exists precisely to say "run this right after the current poll phase". Between every callback, Node drains the `process.nextTick` queue and then the promise microtask queue.',
    hint: 'Recall the order of the event loop phases and which one exists so callbacks can run right after I/O polling.',
  },
  {
    id: 'nodejs-immediate-vs-timeout-in-io',
    domain: 'runtimes',
    subject: 'nodejs',
    topic: 'event-loop-phases',
    level: 'mid',
    kind: 'single',
    prompt: `What is the output order of this CommonJS program?

\`\`\`js
const fs = require('node:fs');

fs.readFile(__filename, () => {
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));
});
\`\`\``,
    options: [
      { id: 'a', text: 'Always `immediate`, then `timeout`' },
      { id: 'b', text: 'Always `timeout`, then `immediate`, because timers run first in each iteration' },
      { id: 'c', text: 'Not deterministic; it depends on how fast the process is' },
      { id: 'd', text: 'It depends on `UV_THREADPOOL_SIZE`, because `readFile` runs on the pool' },
    ],
    answer: 'a',
    tags: ['event-loop', 'setImmediate', 'setTimeout'],
    source: 'notion',
    explanation:
      'The `readFile` callback runs in the **poll** phase. When it returns, the loop moves on to the **check** phase, which runs the immediate. The timer can only fire when the loop wraps around to the **timers** phase of the next iteration. So inside an I/O callback, `setImmediate` always wins.\n\n"Not deterministic" is the right answer for a different program: when both are scheduled from the **main module**, the order is not deterministic. `setTimeout(fn, 0)` is really 1 ms, and whether that 1 ms has elapsed when the first iteration checks timers depends on process startup timing.',
    hint: 'Note which phase the `readFile` callback runs in, then ask which phase the loop reaches next and when it checks timers again.',
  },
  {
    id: 'nodejs-nexttick-promise-ordering',
    domain: 'runtimes',
    subject: 'nodejs',
    topic: 'event-loop-phases',
    level: 'senior',
    kind: 'single',
    prompt: `This file is run as \`node order.cjs\` (CommonJS). Which statement about the output is correct?

\`\`\`js
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));
Promise.resolve().then(() => console.log('promise'));
process.nextTick(() => console.log('nextTick'));
console.log('sync');
\`\`\``,
    options: [
      { id: 'a', text: '`sync`, `nextTick`, `promise`, then `timeout` and `immediate` in an order that is not guaranteed' },
      { id: 'b', text: '`sync`, `promise`, `nextTick`, `timeout`, `immediate`, because promises are standard microtasks and `nextTick` is a macrotask' },
      { id: 'c', text: '`sync`, `nextTick`, `promise`, `immediate`, `timeout`, always' },
      { id: 'd', text: '`sync`, `nextTick`, `timeout`, `promise`, `immediate`' },
    ],
    answer: 'a',
    tags: ['event-loop', 'nextTick', 'microtasks', 'setImmediate'],
    source: 'notion',
    explanation:
      'After the main script finishes, Node drains the **`process.nextTick` queue first, then the promise microtask queue**, and it does this again after every callback in every phase. So `nextTick` beats `promise`, and both beat any timer or immediate.\n\nThen the loop starts: the **timers** phase runs `timeout` only if its 1 ms has already elapsed, otherwise the **check** phase runs `immediate` first and `timeout` waits for the next iteration. From the main module that race is not deterministic (inside an I/O callback, `immediate` always wins).\n\nESM trap: in an `.mjs` file the module body itself runs inside a promise job, so the microtask queue is drained before Node gets back to the nextTick queue and `promise` prints **before** `nextTick`. A recursive `nextTick` can also starve the loop entirely, which is why the Node docs recommend `queueMicrotask` or `setImmediate` for most deferral.\n\n**Say this out loud:** "nextTick queue, then microtasks, after every single callback; timers versus check from the main module is a race, but inside an I/O callback setImmediate always runs first because check follows poll."',
    hint: 'Recall which queue Node drains first after the main script, and whether the timers-versus-check order is fixed outside an I/O callback.',
  },
  {
    id: 'nodejs-microtask-queue-interleaving',
    domain: 'runtimes',
    subject: 'nodejs',
    topic: 'event-loop-phases',
    level: 'mid',
    kind: 'predict',
    language: 'javascript',
    prompt: 'What does this print, one value per line?',
    code: `setTimeout(() => console.log('timeout'), 0);

queueMicrotask(() => {
  console.log('micro 1');
  queueMicrotask(() => console.log('micro 2'));
});

Promise.resolve()
  .then(() => console.log('promise 1'))
  .then(() => console.log('promise 2'));

console.log('sync');`,
    answer: 'sync\nmicro 1\npromise 1\nmicro 2\npromise 2\ntimeout',
    tags: ['event-loop', 'microtasks', 'queueMicrotask', 'core-25'],
    source: 'core-list',
    explanation:
      'The microtask queue is FIFO and it is drained **completely**, including microtasks queued while draining, before the event loop moves to the next macrotask.\n\nAfter `sync`, the queue is `[micro 1, promise 1]`. Running `micro 1` appends `micro 2`; running `promise 1` resolves the chained promise and appends `promise 2`. Queue: `[micro 2, promise 2]`. Only when it is empty does the timers phase run `timeout`.\n\nThat same rule is how an endless chain of microtasks starves timers and I/O: the loop never gets past the drain.',
    hint: 'The microtask queue is drained completely, including jobs queued while it drains, before any macrotask runs; track the queue after each `.then` step.',
  },
  {
    id: 'nodejs-microtasks-between-timers',
    domain: 'runtimes',
    subject: 'nodejs',
    topic: 'event-loop-phases',
    level: 'senior',
    kind: 'predict',
    language: 'javascript',
    prompt: 'What does this print on Node 11+ (and in browsers), one value per line?',
    code: `setTimeout(() => {
  console.log('t1');
  Promise.resolve().then(() => console.log('t1 microtask'));
  setTimeout(() => console.log('t3'), 0);
}, 0);
setTimeout(() => console.log('t2'), 0);

async function job() {
  console.log('job start');
  await null;
  console.log('job resumed');
}

job();
Promise.resolve().then(() => console.log('p1'));
console.log('sync end');`,
    answer: 'job start\nsync end\njob resumed\np1\nt1\nt1 microtask\nt2\nt3',
    tags: ['event-loop', 'microtasks', 'async-await', 'timers'],
    source: 'notion',
    explanation:
      '`job()` runs synchronously up to `await null`, which queues its continuation **before** `p1` is queued, so `job resumed` precedes `p1`. Both beat every timer.\n\nIn the timers phase, `t1` and `t2` are both due. Since **Node 11**, microtasks are drained after **each** timer callback (matching browsers), so `t1 microtask` prints before `t2`. On Node 10 and earlier the whole batch of expired timers ran first, giving `t1, t2, t1 microtask`. `t3` was scheduled during the timers phase, so it runs after `t2` (in the next pass over timers).\n\n**Say this out loud:** "An await is just a microtask continuation, and since Node 11 the microtask queue is drained between every individual timer or immediate callback, not once per phase."',
    hint: 'Remember what an `await` defers and when, and that since Node 11 microtasks are drained after each individual timer callback, not once per timers phase.',
  },

  // streams-and-large-files
  {
    id: 'nodejs-stream-types-gzip',
    domain: 'runtimes',
    subject: 'nodejs',
    topic: 'streams-and-large-files',
    level: 'junior',
    kind: 'single',
    prompt:
      'You compress a 20 GB log file with this pipeline:\n\n```js\npipeline(\n  fs.createReadStream(src),\n  zlib.createGzip(),\n  fs.createWriteStream(dest)\n)\n```\n\nWhat kind of stream is `zlib.createGzip()`?',
    options: [
      { id: 'a', text: 'Readable' },
      { id: 'b', text: 'Writable' },
      { id: 'c', text: 'Transform' },
      { id: 'd', text: 'A plain Duplex with independent read and write sides, like a TCP socket' },
    ],
    answer: 'c',
    tags: ['streams', 'transform', 'zlib'],
    source: 'notion',
    explanation:
      'Node has four stream types: **Readable** (source, e.g. `fs.createReadStream`), **Writable** (sink, e.g. `fs.createWriteStream`), **Duplex** (both sides, independent, e.g. a TCP socket where what you read has nothing to do with what you wrote) and **Transform**, a Duplex whose output is computed from its input (gzip, encryption, CSV parsing).\n\nStreaming processes the file chunk by chunk (64 KiB by default for file streams), so memory stays flat no matter the file size, whereas `fs.readFile` would try to hold all 20 GB in a Buffer and fail.',
    hint: 'Ask whether the bytes that come out are computed from the bytes that go in, and which stream type models that relationship.',
  },
  {
    id: 'nodejs-pipeline-over-pipe',
    domain: 'runtimes',
    subject: 'nodejs',
    topic: 'streams-and-large-files',
    level: 'mid',
    kind: 'multi',
    prompt:
      'Why is `stream.pipeline()` (or `pipeline` from `node:stream/promises`) preferred over chaining `source.pipe(transform).pipe(dest)`? Select all that apply.',
    options: [
      { id: 'a', text: 'An error in any stage is delivered to one callback or one rejected promise instead of needing an `error` listener on every stream' },
      { id: 'b', text: 'When any stage fails or the destination closes early, every stream in the chain is destroyed, so file descriptors and sockets are not leaked' },
      { id: 'c', text: 'It is the only way to get backpressure; `.pipe()` ignores `write()` returning `false`' },
      { id: 'd', text: 'Stages can be async generator functions (an `async function*` that iterates `source` with `for await` and yields transformed chunks)' },
    ],
    answer: ['a', 'b', 'd'],
    tags: ['streams', 'pipeline', 'error-handling', 'backpressure'],
    source: 'notion',
    explanation:
      '`.pipe()` **does** implement backpressure: it pauses the source when `dest.write()` returns `false` and resumes on `drain`. What it does not do is error handling. Errors are not forwarded along a `.pipe()` chain, so an unhandled `error` event on a middle stream crashes the process, and when the destination fails the source is left open (a leaked fd or a hung upstream socket).\n\n`pipeline()` wires up errors and teardown for every stage, calls back once, and the promise version composes with `await` and `AbortSignal`. It also accepts async iterables and async generator stages, which is often the clearest way to write a transform.',
    hint: 'Check what `.pipe()` already does when `write()` returns false, then compare how each approach handles errors and early closes.',
  },
  {
    id: 'nodejs-backpressure-write-bursts',
    domain: 'runtimes',
    subject: 'nodejs',
    topic: 'streams-and-large-files',
    level: 'mid',
    kind: 'code',
    language: 'typescript',
    prompt: `Simulate a producer that respects backpressure on a Writable stream.

Rules (same as Node's \`Writable\`):
- Each \`write(chunk)\` adds \`chunk\` bytes to the internal buffer and returns \`buffered < highWaterMark\` (checked **after** adding).
- When \`write\` returns \`false\`, the producer stops and waits for \`'drain'\`, which fires once the buffer is empty (buffered back to \`0\`).

Implement \`solution(sizes, highWaterMark)\` that returns the **bursts** of writes: each burst is the list of chunk sizes written between waits for \`'drain'\`. Return \`[]\` for no chunks.

Example: \`sizes = [4, 4, 4, 4, 4]\`, \`highWaterMark = 10\` returns \`[[4, 4, 4], [4, 4]]\`.`,
    starter: `export function solution(sizes: number[], highWaterMark: number): number[][] {
  return [sizes];
}`,
    tests: [
      { name: 'example', args: [[4, 4, 4, 4, 4], 10], expected: [[4, 4, 4], [4, 4]] },
      { name: 'reaching the mark exactly returns false', args: [[5, 5, 5], 10], expected: [[5, 5], [5]] },
      { name: 'oversized chunk is still accepted', args: [[30, 1, 1], 16], expected: [[30], [1, 1]] },
      { name: 'last burst ends with drain', args: [[8, 8], 16], expected: [[8, 8]] },
      { name: 'no chunks', args: [[], 16], expected: [] },
    ],
    solution: `export function solution(sizes: number[], highWaterMark: number): number[][] {
  const bursts: number[][] = [];
  let current: number[] = [];
  let buffered = 0;
  for (const size of sizes) {
    current.push(size);
    buffered += size;
    if (buffered >= highWaterMark) {
      // write() returned false: stop and wait for 'drain' (buffer empty)
      bursts.push(current);
      current = [];
      buffered = 0;
    }
  }
  if (current.length > 0) {
    bursts.push(current);
  }
  return bursts;
}`,
    tags: ['streams', 'backpressure', 'highWaterMark'],
    source: 'notion',
    explanation:
      '`write()` returning `false` is **advisory**: the chunk was accepted (even a chunk bigger than `highWaterMark`), but the producer is being told to stop. If it ignores the signal and keeps writing, the Writable buffers without limit and memory grows until the process is OOM-killed. That is the classic bug when someone writes `for (const row of rows) out.write(row)` over a large dataset.\n\nNote the `>=`: reaching the mark exactly already returns `false`. In real code, `await once(stream, \'drain\')` when `write` returns `false`, or let `pipeline()` / async iteration do it for you.',
    hint: 'Track a running buffered total and compare it with `highWaterMark` after each write; a failed check ends the burst, and `\'drain\'` empties the buffer.',
  },
  {
    id: 'nodejs-large-upload-pipeline-design',
    domain: 'runtimes',
    subject: 'nodejs',
    topic: 'streams-and-large-files',
    level: 'senior',
    kind: 'open',
    prompt:
      'An endpoint must accept a CSV upload of several GB, validate and transform each row, and insert the rows into Postgres. The container has 512 MB of RAM. How do you design it so memory stays bounded and failures are handled correctly?',
    modelAnswer:
      'I never buffer the body: no `req.on(\'data\')` concatenation and no in-memory multipart storage. I build `await pipeline(req, csvParser(), validateTransform, batcher(500), dbWriter)` with object-mode stages. The DB writer is a Writable (or an async generator stage) that only calls its callback after the batch `INSERT` / `COPY` resolves, so a slow database fills the small buffers, `write()` returns `false`, the parser pauses, the request socket stops being read, and TCP flow control slows the client. That chain is **backpressure** end to end, and it keeps memory at roughly `highWaterMark × stages` instead of file size. `pipeline` destroys every stage on error or client disconnect, so I pass an `AbortSignal` and roll back or mark the import failed. Invalid rows go to a reject report instead of failing the whole file. For idempotency I load into a staging table keyed by an upload id and swap or merge at the end, so a retried upload does not duplicate rows. If the import takes minutes, I stream the upload to object storage, return `202` with a job id and a status endpoint (`GET /imports/{id}`), and let a queue worker run the same pipeline.',
    rubric: [
      'Streams the request with `pipeline()` and explicitly rejects buffering the whole body',
      'Explains backpressure end to end: slow DB, `write()` false, parser pauses, socket and TCP flow control',
      'Batches inserts (multi-row insert or `COPY`) instead of one query per row',
      'Covers failure handling: pipeline teardown, client abort, partial import (staging table or transaction), bad-row reporting',
      'Considers moving long imports to object storage plus an async job with a status endpoint',
    ],
    tags: ['streams', 'backpressure', 'pipeline', 'system-design'],
    source: 'notion',
    explanation:
      'The senior signal is connecting a slow consumer to a paused producer across process boundaries, then designing for partial failure.\n\n**Say this out loud:** "Memory is bounded by the stream buffers, not the file size, because backpressure propagates from the database all the way back to the client\'s TCP window; pipeline guarantees that if any stage fails, everything is torn down."',
    hint: 'Cover how backpressure flows from the database back to the client socket, batched inserts (e.g. `COPY`), and what happens to rows already written when one row fails.',
  },

  // worker-threads-and-cpu-work
  {
    id: 'nodejs-what-blocks-event-loop',
    domain: 'runtimes',
    subject: 'nodejs',
    topic: 'worker-threads-and-cpu-work',
    level: 'junior',
    kind: 'multi',
    prompt:
      'Whenever one route of your Express API is called, latency spikes for **every** route on that instance. Which of these, inside that route, block the event loop? Select all that apply.',
    options: [
      { id: 'a', text: '```js\ncrypto.pbkdf2Sync(password, salt, 600000, 64, \'sha512\')\n```' },
      { id: 'b', text: '`JSON.parse` of a 150 MB string' },
      { id: 'c', text: '```js\nawait fetch(\'https://slow-partner.example.com/report\')\n```\n(the partner takes 4 seconds to answer)' },
      { id: 'd', text: '`fs.readFileSync(\'/data/export.csv\')`' },
    ],
    answer: ['a', 'b', 'd'],
    tags: ['blocking', 'event-loop', 'performance'],
    source: 'notion',
    explanation:
      'Anything that keeps the single JavaScript thread busy blocks **all** requests: synchronous crypto, synchronous file I/O, and huge `JSON.parse` / `JSON.stringify` calls (also catastrophic regexes and big sorts). A slow `await fetch` only makes **that** request slow; while it waits, the thread is free to serve others.\n\nFixes: use the async variants (`crypto.pbkdf2`, `fs.promises`), stream-parse large payloads, and move unavoidable CPU work to a worker thread. Detect it with `perf_hooks.monitorEventLoopDelay()` or a CPU profile (`--cpu-prof`).',
    hint: 'For each call, ask whether it keeps the single JavaScript thread busy, or only leaves one request waiting while the thread serves others.',
  },
  {
    id: 'nodejs-cluster-vs-worker-threads',
    domain: 'runtimes',
    subject: 'nodejs',
    topic: 'worker-threads-and-cpu-work',
    level: 'senior',
    kind: 'open',
    prompt:
      'Your Node service runs on an 8-vCPU VM and has two problems: (1) under load, throughput plateaus with one core at 100% while the others idle, for ordinary I/O-bound JSON endpoints; (2) an image-resize endpoint blocks the event loop for about 300 ms per request. Which tool do you use for each (`cluster`, `worker_threads`, more instances), and why?',
    modelAnswer:
      'They are different problems. Problem 1 is about using more cores for I/O-bound traffic, so I run more **processes**: one per core via `node:cluster` or PM2, or, preferably in containers, more replicas behind the load balancer. The app must be stateless (sessions and caches in Redis) because processes share no memory, and a crash in one process does not take the others down. Problem 2 is CPU work on the request path, and more processes do not fix it: any request that lands on a process busy resizing still waits 300 ms. For that I use a **worker_threads pool** (for example Piscina) sized around the number of cores, with a bounded queue that returns 503 or sheds load when full. I pass image data with a `transferList` so the ArrayBuffer is moved, not copied. Worker threads do not help I/O-bound work, because libuv already does that concurrently. If the resize does not need to be synchronous, I would push it to a job queue and a separate worker service instead. Threads share one process, so a native crash or an out-of-memory error takes all of them down; I set `resourceLimits` on workers.',
    rubric: [
      'Separates horizontal process scaling (cluster, PM2, replicas) for I/O throughput from worker threads for CPU work',
      'Explains why cluster alone does not fix a blocking handler and why worker threads do not speed up I/O',
      'Uses a bounded worker pool with queueing or load shedding, not a new Worker per request',
      'Mentions transfer or SharedArrayBuffer versus structured-clone copying for large payloads',
      'Addresses statelessness and fault isolation (process versus thread)',
    ],
    tags: ['cluster', 'worker-threads', 'scaling', 'performance'],
    source: 'notion',
    explanation:
      'A new `Worker` costs tens of milliseconds and its own V8 isolate, so per-request workers are an anti-pattern; pools amortise that.\n\n**Say this out loud:** "Processes scale I/O across cores and give me isolation; threads take CPU work off the event loop. I pick by the bottleneck, and I bound the pool so overload turns into fast 503s instead of a growing queue."',
    hint: 'Diagnose each bottleneck on its own: one is about using more cores for I/O-bound work, the other about keeping CPU work off the event loop. Mention pooling and startup cost.',
  },

  // execution-models
  {
    id: 'nodejs-serverless-db-connection-scope',
    domain: 'runtimes',
    subject: 'nodejs',
    topic: 'execution-models',
    level: 'mid',
    kind: 'single',
    prompt: 'In an AWS Lambda function written in Node.js that queries Postgres, where should you create the database client, and why?',
    options: [
      { id: 'a', text: 'Inside the handler, so every invocation gets a fresh connection and no state leaks between requests' },
      { id: 'b', text: 'At module scope, so warm invocations in the same execution environment reuse it; keep it to one connection per environment and put a pooler such as RDS Proxy in front' },
      { id: 'c', text: 'At module scope as a pool of 20 connections, so one invocation can run many queries in parallel' },
      { id: 'd', text: 'At module scope, plus a `setInterval` keep-alive query so the connection never goes idle between invocations' },
    ],
    answer: 'b',
    tags: ['serverless', 'lambda', 'connection-pooling'],
    source: 'notion',
    explanation:
      'Module scope runs once per **execution environment** (on the cold start), and the environment is reused for later invocations, so a client created there survives warm starts. But each environment handles **one invocation at a time**, and concurrency scales by adding environments, so 500 concurrent invocations means 500 environments. A pool of 20 each would be 10,000 connections and exhaust Postgres. Hence one connection per environment and a pooler in front.\n\nCreating it in the handler pays the TCP and TLS handshake on every call. A `setInterval` does not help: the environment is **frozen** between invocations, so the timer does not fire while the environment sits idle, and the database or a NAT can still drop the idle connection; reconnect on error instead.',
    hint: 'Think about how long an execution environment lives, how many invocations it handles at once, and what hundreds of concurrent environments do to Postgres.',
  },
  {
    id: 'nodejs-execution-model-choice',
    domain: 'runtimes',
    subject: 'nodejs',
    topic: 'execution-models',
    level: 'senior',
    kind: 'open',
    prompt:
      'Node can run as a long-lived **daemon** (worker or consumer), a **serverless function**, an **HTTP API service**, or a one-shot **script** or CLI. Pick a model for each workload and justify it: (a) payment-provider webhook ingestion with very spiky traffic; (b) a consumer that processes a queue 24/7 and keeps a persistent broker connection; (c) a nightly 40-minute reconciliation job; (d) a customer-facing REST API with a p99 target under 100 ms.',
    modelAnswer:
      '(a) A **serverless function** fits spiky, short, stateless work: it scales to zero and absorbs bursts, and a webhook handler should only verify the signature, persist or enqueue the event with an idempotency key, and return 2xx fast. (b) A **daemon**: long-lived connections, prefetch and consumer state do not fit per-invocation billing or execution time limits. It needs SIGTERM handling that stops pulling, finishes or nacks in-flight messages, then exits. (c) A **script** run by a scheduler (Kubernetes CronJob, ECS scheduled task). 40 minutes is close to or over typical function limits (Lambda caps at 15 minutes), and a script gives a clear exit code for alerting; it should checkpoint so a rerun resumes safely. (d) A long-running **API service** behind a load balancer: warm processes with connection pools and in-memory caches meet a tight p99 without cold starts. Serverless is possible with provisioned concurrency, at higher cost. Across all four I would weigh the cost model (idle versus per request), cold starts, time limits, connection management, and how each one shuts down.',
    rubric: [
      'Chooses serverless for the spiky webhook and stresses fast ack plus idempotency',
      'Chooses a daemon for the persistent consumer and mentions graceful stop or ack semantics',
      'Chooses a scheduled script or job for the long batch, citing function time limits and exit codes',
      'Chooses a long-running service for the low-latency API, citing cold starts and warm connection pools',
      'Names the cross-cutting trade-offs: cost when idle, cold start, time limits, connection counts',
    ],
    tags: ['serverless', 'daemon', 'cli', 'architecture'],
    source: 'topic-list',
    explanation:
      'Interviewers want the decision driven by workload shape (duration, traffic pattern, statefulness, latency budget), not by preference.\n\n**Say this out loud:** "Serverless for short, bursty, stateless work; long-lived processes when I need warm connections, persistent consumers or tight latency; scheduled scripts for bounded batch jobs with an exit code I can alert on."',
    hint: 'Drive each choice from the workload\'s shape: duration, traffic pattern, statefulness and latency budget, and name the limits (timeouts, cold starts) that rule options out.',
  },
  {
    id: 'nodejs-graceful-shutdown-kubernetes',
    domain: 'runtimes',
    subject: 'nodejs',
    topic: 'execution-models',
    level: 'senior',
    kind: 'open',
    prompt:
      'Every rolling deploy of your Node API on Kubernetes produces a burst of 502s and a few half-processed queue jobs. Walk through how you implement graceful shutdown.',
    modelAnswer:
      'First, make sure the signal arrives: run `node` directly (exec-form `CMD`, or `tini` / `--init`) rather than under `npm start`, which may not forward SIGTERM. Also, as PID 1 Node gets no default signal handling, so without a handler it ignores SIGTERM until SIGKILL. On SIGTERM I flip readiness to failing and optionally wait a few seconds (or use a `preStop` sleep) so endpoints stop routing to the pod. Then `server.close()` stops accepting connections, and `closeIdleConnections()` or `Connection: close` deals with keep-alive sockets that would otherwise hold it open. I let in-flight requests finish under a hard deadline shorter than `terminationGracePeriodSeconds`. For queue consumers I stop pulling new messages, finish or nack in-flight ones (jobs must be idempotent because some will be redelivered), then close DB pools and broker connections, flush logs and telemetry, and exit with code 0. Separately, on `uncaughtException` or `unhandledRejection` I log and exit non-zero instead of continuing in an unknown state; the orchestrator restarts the pod.',
    rubric: [
      'Ensures SIGTERM reaches Node (PID 1 behaviour, npm not forwarding signals, exec form or init)',
      'Fails readiness and allows time for endpoint removal before closing the server',
      'Stops accepting, handles keep-alive connections and drains in-flight work under a deadline',
      'Stops consumers cleanly with idempotent redelivery in mind, then closes pools and flushes telemetry',
      'Treats uncaught errors as fail-fast and lets the orchestrator restart',
    ],
    tags: ['graceful-shutdown', 'kubernetes', 'signals', 'resilience'],
    source: 'notion',
    explanation:
      'The 502s usually come from the load balancer still routing to a pod that has already stopped listening, or from keep-alive connections cut mid-request. Both are ordering problems.\n\n**Say this out loud:** "Stop receiving traffic first, then stop accepting, then drain with a deadline, then release resources, and make every piece of work idempotent because some of it will be retried."',
    hint: 'Think about ordering: `SIGTERM`, readiness, the load balancer catching up, keep-alive connections, in-flight requests and jobs, a drain deadline and `terminationGracePeriodSeconds`.',
  },

  // request-batching
  {
    id: 'nodejs-request-batcher-coalesce',
    domain: 'runtimes',
    subject: 'nodejs',
    topic: 'request-batching',
    level: 'mid',
    kind: 'code',
    language: 'typescript',
    prompt: `Several requests arrive in the same tick, each asking for a list of user ids. Instead of one downstream call per request, a batcher (like DataLoader) collects them and calls a bulk endpoint that accepts at most \`batchSize\` ids.

Implement \`solution(ids, batchSize)\` where \`ids[i]\` is the list of ids requested by request \`i\`. Return the downstream batches:
- each id appears **once** overall (deduplicated across and within requests),
- ids keep **first-seen order** (request order, then position),
- batches have at most \`batchSize\` ids; only the last may be smaller.

Example: \`solution([[1, 2], [2, 3], [4]], 2)\` returns \`[[1, 2], [3, 4]]\`.`,
    starter: `export function solution(ids: number[][], batchSize: number): number[][] {
  return [];
}`,
    tests: [
      { name: 'example', args: [[[1, 2], [2, 3], [4]], 2], expected: [[1, 2], [3, 4]] },
      { name: 'dedupes within one request', args: [[[5, 5, 5]], 10], expected: [[5]] },
      { name: 'splits into several batches', args: [[[1, 2, 3, 4, 5]], 2], expected: [[1, 2], [3, 4], [5]] },
      { name: 'keeps first-seen order', args: [[[9, 7], [7, 8, 9], [1]], 3], expected: [[9, 7, 8], [1]] },
      { name: 'no requests', args: [[], 3], expected: [] },
    ],
    solution: `export function solution(ids: number[][], batchSize: number): number[][] {
  const unique = [...new Set(ids.flat())];
  const batches: number[][] = [];
  for (let i = 0; i < unique.length; i += batchSize) {
    batches.push(unique.slice(i, i + batchSize));
  }
  return batches;
}`,
    tags: ['batching', 'dataloader', 'n-plus-one'],
    source: 'topic-list',
    explanation:
      'A `Set` keeps insertion order, so `[...new Set(ids.flat())]` dedupes while preserving first-seen order; then slice into fixed-size chunks.\n\nIn the real batcher the collection window is **one tick**: the first `load(id)` schedules a flush with `queueMicrotask` / `process.nextTick` (DataLoader) or a short `setTimeout` for a wider window, every `load` in between adds its id and gets a promise, and the flush fans the bulk response back out by id. That turns an N+1 pattern (one query per GraphQL field or per item) into `ceil(unique / batchSize)` calls. The trade-off is a small added latency, and one failed batch fails every caller in it.',
    hint: 'Reach for a `Set` to dedupe while keeping insertion order, then slice the result into fixed-size chunks.',
  },
  {
    id: 'nodejs-retry-backoff-schedule',
    domain: 'runtimes',
    subject: 'nodejs',
    topic: 'request-batching',
    level: 'mid',
    kind: 'code',
    language: 'typescript',
    prompt: `A bulk downstream endpoint sometimes answers \`429\` or \`503\`. Compute the retry delays using **capped exponential backoff with full jitter**.

\`solution(retries, baseMs, capMs, randoms)\` returns an array of \`retries\` delays. For retry \`i\` (0-based):
- \`ceiling = min(capMs, baseMs * 2^i)\`
- \`delay = Math.floor(randoms[i] * ceiling)\` where \`randoms[i]\` is in \`[0, 1)\` (injected so the result is deterministic).

Example: \`solution(3, 100, 1000, [0.5, 0.5, 0.5])\` returns \`[50, 100, 200]\`.`,
    starter: `export function solution(retries: number, baseMs: number, capMs: number, randoms: number[]): number[] {
  return [];
}`,
    tests: [
      { name: 'example', args: [3, 100, 1000, [0.5, 0.5, 0.5]], expected: [50, 100, 200] },
      { name: 'ceiling is capped', args: [6, 100, 1000, [0.5, 0.5, 0.5, 0.5, 0.5, 0.5]], expected: [50, 100, 200, 400, 500, 500] },
      { name: 'jitter varies per retry', args: [3, 200, 5000, [0.25, 0.9, 0.1]], expected: [50, 360, 80] },
      { name: 'zero randoms retry immediately', args: [2, 100, 1000, [0, 0]], expected: [0, 0] },
      { name: 'no retries', args: [0, 100, 1000, []], expected: [] },
    ],
    solution: `export function solution(retries: number, baseMs: number, capMs: number, randoms: number[]): number[] {
  const delays: number[] = [];
  for (let i = 0; i < retries; i++) {
    const ceiling = Math.min(capMs, baseMs * 2 ** i);
    delays.push(Math.floor(randoms[i] * ceiling));
  }
  return delays;
}`,
    tags: ['retry', 'backoff', 'jitter', 'resilience'],
    source: 'notion',
    explanation:
      'Exponential growth gives a struggling dependency room to recover; the **cap** stops the delay from growing without limit; **jitter** spreads out clients that failed at the same moment so they do not all retry together (a thundering herd). Full jitter (random between 0 and the ceiling) spreads load best at the cost of some very short waits.\n\nRetry only **idempotent** operations (or send an idempotency key), respect `Retry-After` when the server sends it, set a timeout on every attempt (`AbortSignal.timeout`), and put a circuit breaker in front so a dead dependency fails fast instead of retrying forever.',
    hint: 'Compute each ceiling with a power of two, clamp it with `Math.min`, then scale it by the injected random value and round down with `Math.floor`.',
  },
  {
    id: 'nodejs-inflight-dedupe-cache-fix',
    domain: 'runtimes',
    subject: 'nodejs',
    topic: 'request-batching',
    level: 'senior',
    kind: 'fix',
    language: 'typescript',
    prompt: `\`createCachedLoader\` is meant to **coalesce** concurrent requests: every caller asking for the same id while a fetch is in flight must share that one fetch, and later callers get the cached result. In production, a burst of concurrent requests for the same user still hits the upstream once per request.

Fix **only \`createCachedLoader\`** so that:
1. concurrent calls for the same id trigger exactly one \`fetcher\` call;
2. a **failed** fetch is not cached: the next call for that id retries.

The \`solution\` harness runs two waves of concurrent loads and reports the results and the total number of upstream calls. Do not change it.`,
    starter: `type Fetcher = (id: number) => Promise<string>;

function createCachedLoader(fetcher: Fetcher): (id: number) => Promise<string> {
  const cache = new Map<number, string>();
  return async (id) => {
    if (cache.has(id)) {
      return cache.get(id) as string;
    }
    const value = await fetcher(id);
    cache.set(id, value);
    return value;
  };
}

export async function solution(ids: number[], failOnceIds: number[]): Promise<{ first: string[]; second: string[]; calls: number }> {
  let calls = 0;
  const failOnce = new Set(failOnceIds);
  const fetcher: Fetcher = async (id) => {
    calls += 1;
    await Promise.resolve();
    if (failOnce.has(id)) {
      failOnce.delete(id);
      throw new Error('upstream failed for ' + id);
    }
    return 'user-' + id;
  };
  const load = createCachedLoader(fetcher);
  const toText = (s: PromiseSettledResult<string>): string => (s.status === 'fulfilled' ? s.value : 'error');
  const first = (await Promise.allSettled(ids.map((id) => load(id)))).map(toText);
  const second = (await Promise.allSettled(ids.map((id) => load(id)))).map(toText);
  return { first, second, calls };
}`,
    tests: [
      {
        name: 'concurrent duplicates share one fetch',
        args: [[1, 1, 2, 1], []],
        expected: { first: ['user-1', 'user-1', 'user-2', 'user-1'], second: ['user-1', 'user-1', 'user-2', 'user-1'], calls: 2 },
      },
      {
        name: 'a failed fetch is shared, then retried',
        args: [[3, 3], [3]],
        expected: { first: ['error', 'error'], second: ['user-3', 'user-3'], calls: 2 },
      },
      {
        name: 'failure of one id does not affect another',
        args: [[4, 5, 4], [4]],
        expected: { first: ['error', 'user-5', 'error'], second: ['user-4', 'user-5', 'user-4'], calls: 3 },
      },
    ],
    solution: `type Fetcher = (id: number) => Promise<string>;

function createCachedLoader(fetcher: Fetcher): (id: number) => Promise<string> {
  const cache = new Map<number, Promise<string>>();
  return (id) => {
    const hit = cache.get(id);
    if (hit) {
      return hit;
    }
    const pending = fetcher(id).catch((error: unknown) => {
      cache.delete(id);
      throw error;
    });
    cache.set(id, pending);
    return pending;
  };
}

export async function solution(ids: number[], failOnceIds: number[]): Promise<{ first: string[]; second: string[]; calls: number }> {
  let calls = 0;
  const failOnce = new Set(failOnceIds);
  const fetcher: Fetcher = async (id) => {
    calls += 1;
    await Promise.resolve();
    if (failOnce.has(id)) {
      failOnce.delete(id);
      throw new Error('upstream failed for ' + id);
    }
    return 'user-' + id;
  };
  const load = createCachedLoader(fetcher);
  const toText = (s: PromiseSettledResult<string>): string => (s.status === 'fulfilled' ? s.value : 'error');
  const first = (await Promise.allSettled(ids.map((id) => load(id)))).map(toText);
  const second = (await Promise.allSettled(ids.map((id) => load(id)))).map(toText);
  return { first, second, calls };
}`,
    tags: ['caching', 'coalescing', 'promises', 'thundering-herd', 'resilience'],
    source: 'notion',
    explanation:
      'The buggy version caches the **value**, which exists only after the `await`. Every caller that arrives while the first fetch is in flight sees an empty cache and starts its own fetch: a cache stampede. Caching the **promise** synchronously, before any `await`, makes later callers join the in-flight request.\n\nThe second half is the part people miss: once you cache promises, a rejected promise is cached too, and every future call gets the same error. Evict on rejection (`.catch` that deletes and rethrows) so the next call retries. In production, add a TTL or LRU bound so the map cannot grow forever, and for a multi-instance fleet move coalescing to a shared cache with a lock or a request-collapsing proxy.\n\n**Say this out loud:** "Cache the promise, not the value, so concurrent callers coalesce onto one in-flight request, and evict it on rejection so a transient failure is not cached forever."',
    hint: 'Ask what the cache holds while the first fetch is still pending, what could be stored synchronously before any `await`, and what must happen to it on failure.',
  },
];
