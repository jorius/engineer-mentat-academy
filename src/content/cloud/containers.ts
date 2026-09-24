// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  {
    id: 'containers-image-vs-container-writable-layer',
    domain: 'cloud',
    subject: 'containers',
    topic: 'docker-basics',
    level: 'junior',
    kind: 'single',
    prompt:
      'You `docker exec` into a running container, `apt-get install curl`, then `docker rm -f` the container and `docker run` the **same image** again. Is `curl` installed in the new container?',
    options: [
      { id: 'a', text: 'Yes, because `docker exec` writes changes back into the image' },
      { id: 'b', text: 'No: the install lived in the old container\'s writable layer, which was deleted; the image itself never changed' },
      { id: 'c', text: 'Yes, but only if the container was started with `--restart always`' },
      { id: 'd', text: 'No, because `apt-get` is blocked inside containers' },
    ],
    answer: 'b',
    tags: ['docker', 'images', 'layers'],
    source: 'topic-list',
    explanation:
      'An **image** is an immutable, layered filesystem plus metadata (entrypoint, env, exposed ports). A **container** is a runtime instance of an image with a thin writable layer on top (copy-on-write) and its own process namespace. Everything written at runtime goes to that layer and disappears with the container. Changes you want to keep belong in the Dockerfile (rebuild the image), and data you want to keep belongs in a volume or an external store. `docker commit` exists but produces unreproducible images; treat containers as disposable.',
    hint: 'Recall where a running container\'s file changes are stored, and how that storage relates to the image and to the container\'s lifecycle.',
  },
  {
    id: 'containers-dockerfile-layer-cache-order',
    domain: 'cloud',
    subject: 'containers',
    topic: 'containerization',
    level: 'mid',
    kind: 'single',
    prompt:
      'Every code change in this Node.js service triggers a full `npm ci` during `docker build`, taking four minutes. Which Dockerfile ordering fixes that?\n\n```dockerfile\nFROM node:22-slim\nWORKDIR /app\nCOPY . .\nRUN npm ci\nCMD ["node", "dist/server.js"]\n```',
    options: [
      { id: 'a', text: '`COPY package.json package-lock.json ./` then `RUN npm ci`, and only then `COPY . .`' },
      { id: 'b', text: 'Keep the order and add `--no-cache` to `docker build` so stale layers are never reused' },
      { id: 'c', text: 'Replace `npm ci` with `npm install` so it only installs what changed' },
      { id: 'd', text: 'Move `RUN npm ci` above `WORKDIR /app` so it runs earlier' },
    ],
    answer: 'a',
    tags: ['docker', 'layer-caching', 'build-performance'],
    source: 'topic-list',
    explanation:
      'Each instruction produces a layer, and a layer is reused only if the instruction **and everything before it** is unchanged; for `COPY`, the cache key includes the checksums of the copied files. `COPY . .` changes on every edit, so every layer after it rebuilds. Copying only the manifests first means the expensive `npm ci` layer stays cached until dependencies change. General rule: order instructions from least to most frequently changing. `--no-cache` makes things slower, `npm install` in a build is less reproducible than `npm ci`, and BuildKit cache mounts (`RUN --mount=type=cache,target=/root/.npm npm ci`) are a further speed-up on top of the right order.',
    hint: 'Recall how Docker decides whether a cached layer can be reused, and what a cache miss at one step does to every step after it.',
  },
  {
    id: 'containers-multi-stage-build-benefits',
    domain: 'cloud',
    subject: 'containers',
    topic: 'containerization',
    level: 'mid',
    kind: 'multi',
    prompt:
      'A TypeScript API moves to a multi-stage Dockerfile: a `build` stage runs `npm ci` and `tsc`, and a final stage based on `node:22-slim` copies `package.json` and `package-lock.json`, runs `npm ci --omit=dev`, and copies `dist/` with `COPY --from=build`. `typescript` and the test tooling are listed in `devDependencies`. Which statements are true? Select all that apply.',
    options: [
      { id: 'a', text: 'The final image does not contain the TypeScript compiler, dev dependencies or the `src/` tree' },
      { id: 'b', text: '`COPY --from=build` copies only the paths you name from that stage, not its whole filesystem' },
      { id: 'c', text: 'All layers from every stage are pushed to the registry together with the final image' },
      { id: 'd', text: 'Multi-stage builds automatically pin base image digests, which makes builds reproducible' },
    ],
    answer: ['a', 'b'],
    tags: ['docker', 'multi-stage', 'image-size', 'security'],
    source: 'topic-list',
    explanation:
      'Only the **last** stage (or the one selected with `--target`) becomes the image; earlier stages exist only in the build cache. That shrinks the image and its attack surface: no compilers, no dev tooling, no source, no build-time secrets. `COPY --from=<stage>` pulls specific artifacts across. Reproducibility is separate: pin base images by digest (`node:22-slim@sha256:...`) and use a lockfile. Multi-stage also lets you run tests in a dedicated stage that CI targets without shipping test tooling.',
    hint: 'Remember which stage actually becomes the image, what `COPY --from` brings across, and what it takes to pin a base image to an exact digest.',
  },
  {
    id: 'containers-dockerignore-purpose',
    domain: 'cloud',
    subject: 'containers',
    topic: 'containerization',
    level: 'junior',
    kind: 'multi',
    prompt:
      'Why would you add `node_modules`, `.git` and `.env` to a `.dockerignore` file? Select all that apply.',
    options: [
      { id: 'a', text: 'They are excluded from the build context, so less data is sent to the builder and builds start faster' },
      { id: 'b', text: 'A host `node_modules` (possibly built for another OS) cannot overwrite the one `npm ci` installed when you `COPY . .`' },
      { id: 'c', text: 'Secrets in `.env` do not end up baked into an image layer' },
      { id: 'd', text: 'Those files are also hidden from bind mounts when the container runs' },
    ],
    answer: ['a', 'b', 'c'],
    tags: ['docker', 'dockerignore', 'security'],
    source: 'topic-list',
    explanation:
      'The **build context** is the directory tree sent to the builder; `.dockerignore` filters it before any `COPY` or `ADD` can see it. That speeds up builds, keeps the cache stable (a changing `.git` would otherwise bust `COPY . .`), avoids shipping native modules compiled for macOS or Windows into a Linux image, and keeps secrets out of layers, where they stay recoverable even if a later layer deletes them. It only affects building: runtime bind mounts and volumes are unaffected. Pass real secrets at runtime, or at build time with BuildKit `--mount=type=secret`.',
    hint: 'Recall what `.dockerignore` filters, then trace each of these files through a `docker build` that runs `COPY . .` and through a later `docker run`.',
  },
  {
    id: 'containers-pid1-sigterm-graceful-shutdown',
    domain: 'cloud',
    subject: 'containers',
    topic: 'containerization',
    level: 'senior',
    kind: 'single',
    prompt:
      'A Node.js API image ends with `CMD node server.js` (shell form). On every deploy, `docker stop` waits 10 seconds, the container exits with code **137**, and in-flight requests are cut off. What is going on and what is the complete fix?',
    options: [
      { id: 'a', text: 'Switch to exec form `CMD ["node", "server.js"]`; Node then receives SIGTERM and its default behavior drains connections before exiting' },
      { id: 'b', text: 'Raise the stop timeout to 60 s so the process has time to finish' },
      { id: 'c', text: 'SIGTERM is not reaching a process that handles it: fix PID 1 (exec form, or a minimal init like `docker run --init` / tini) **and** register a SIGTERM handler that stops accepting connections, drains, and exits' },
      { id: 'd', text: 'Add `STOPSIGNAL SIGKILL` so the container stops immediately instead of waiting' },
    ],
    answer: 'c',
    tags: ['docker', 'signals', 'pid-1', 'graceful-shutdown'],
    source: 'topic-list',
    explanation:
      '`docker stop` (and Kubernetes or ECS) sends SIGTERM to PID 1, waits a grace period (10 s by default), then sends SIGKILL; exit code 137 is 128 + 9, the SIGKILL. With the shell form, PID 1 is typically `/bin/sh -c`, which does not forward signals to the Node child. But exec form alone is not enough: the kernel does not apply default signal actions to PID 1 of a PID namespace, so a PID 1 that has **no handler** simply ignores SIGTERM, and even outside PID 1 the default action kills Node instantly without draining. The complete fix is to make Node PID 1 (exec form) or put a tiny init in front that forwards signals and reaps zombies (`--init`, tini, dumb-init), and handle `process.on(\'SIGTERM\')` by calling `server.close()`, finishing in-flight work, closing DB pools, then exiting. Also avoid `npm start` as the entrypoint; run `node` directly.\n\n**Say this out loud:** "PID 1 ignores signals it has no handler for, so I run node in exec form or behind tini, and I handle SIGTERM by draining connections before the orchestrator\'s grace period sends SIGKILL."',
    hint:
      'Exit code 137 is 128 + 9; think about which process is PID 1 with the shell form, how the kernel treats signals sent to PID 1, and whether anything drains requests.',
  },
  {
    id: 'containers-shrinking-node-image',
    domain: 'cloud',
    subject: 'containers',
    topic: 'containerization',
    level: 'senior',
    kind: 'open',
    prompt:
      'A Node.js service image is **1.3 GB** and slow to pull during scale-out. Walk through how you would investigate and shrink it, and what trade-offs you would watch for.',
    modelAnswer:
      'First measure: `docker history` or a tool like `dive` shows which layers are large and why. The usual culprits are the full `node:22` base (Debian with build tools), dev dependencies, the build output plus source, package manager caches, and `.git` or local `node_modules` leaking in through a missing `.dockerignore`. I would switch to a multi-stage build: compile in a `build` stage, then start the runtime stage from `node:22-slim`, Alpine or a distroless Node image, install with `npm ci --omit=dev`, and copy only `dist/` and production `node_modules`. Cleanup has to happen **in the same `RUN`** that created the files, because deleting in a later layer does not shrink earlier layers. Trade-offs: Alpine uses musl, so native modules (sharp, bcrypt, Prisma engines) may need different binaries or break, and distroless images have no shell, which makes debugging harder (use ephemeral debug containers instead). A smaller image also pulls faster, starts faster on Fargate or new nodes, and has fewer CVEs to patch, which is the real reason to care.',
    rubric: [
      'Measures first with docker history or dive instead of guessing',
      'Uses multi-stage builds and production-only dependencies',
      'Chooses a slimmer base (slim, Alpine or distroless) and names a trade-off (musl native modules, no shell)',
      'Knows deleting files in a later layer does not reduce image size',
      'Mentions .dockerignore and ties size to pull time, cold start or CVE surface',
    ],
    tags: ['docker', 'image-size', 'multi-stage', 'performance'],
    source: 'topic-list',
    explanation:
      'Senior signal: measuring before changing, knowing the layer model well enough to explain why `RUN rm` in a separate step does nothing, and weighing base-image choices against native dependencies and debuggability.\n\n**Say this out loud:** "Layers are additive, so I shrink images with multi-stage builds, production-only dependencies and a slim base, and I measure with dive first; smaller images mean faster scale-out and fewer CVEs."',
    hint:
      'Measure layers before changing anything, then cover multi-stage builds, production-only dependencies, base image trade-offs and why deleting files in a later layer does not help.',
  },
];
