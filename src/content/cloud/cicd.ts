// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  {
    id: 'cicd-build-once-promote-artifact',
    domain: 'cloud',
    subject: 'cicd',
    topic: 'pipelines',
    level: 'junior',
    kind: 'single',
    prompt:
      'A pipeline deploys to `dev`, `staging` and `production`. Which approach to build artifacts is considered best practice?',
    options: [
      { id: 'a', text: 'Rebuild the Docker image separately for each environment with that environment\'s config baked in' },
      { id: 'b', text: 'Build one immutable artifact (for example an image tagged with the commit SHA) once, then promote that same artifact through each environment, injecting config at deploy time' },
      { id: 'c', text: 'Build on the production servers during deployment so the binaries match the host exactly' },
      { id: 'd', text: 'Tag images `latest` and have every environment pull `latest`' },
    ],
    answer: 'b',
    tags: ['ci-cd', 'artifacts', 'environments'],
    source: 'topic-list',
    explanation:
      'If you rebuild per environment, what you tested in staging is not what runs in production: dependency resolution, base image updates or build flags can differ. **Build once, deploy many**: produce an immutable, versioned artifact, store it in a registry, and promote it by reference (tag or digest) while environment-specific configuration and secrets come from the environment (parameter store, secrets manager, env vars). `latest` is mutable, so you cannot tell what is running or roll back reliably.',
  },
  {
    id: 'cicd-blue-green-vs-canary',
    domain: 'cloud',
    subject: 'cicd',
    topic: 'pipelines',
    level: 'mid',
    kind: 'single',
    prompt:
      'You want to send **5%** of real production traffic to v2, compare its error rate and latency with v1, then step up to 25%, 50% and 100%, rolling back automatically if metrics degrade. Which strategy is this, and how does it differ from blue/green?',
    options: [
      { id: 'a', text: 'Blue/green: two full environments, and traffic shifts gradually between them by percentage' },
      { id: 'b', text: 'Canary: a small, growing slice of traffic validates the new version against the old; blue/green stands up a full parallel environment and switches all traffic at once, with rollback by switching back' },
      { id: 'c', text: 'Rolling update: instances are replaced one batch at a time, which gives the same per-percentage metric comparison as a canary' },
      { id: 'd', text: 'Recreate: stop v1 and start v2 so that only one version serves traffic, which is the safest way to compare metrics cleanly' },
    ],
    answer: 'b',
    tags: ['deployment-strategies', 'canary', 'blue-green'],
    source: 'topic-list',
    explanation:
      '**Blue/green** runs the new version as a complete parallel environment, tests it, then flips the router or DNS in one step; rollback is instant (flip back), but it doubles capacity during the switch and every user hits v2 at once. **Canary** limits the blast radius by exposing a small percentage first and gating each step on metrics (automated canary analysis). **Rolling** replaces instances in batches without traffic-level control or a clean comparison. In AWS terms: CodeDeploy supports canary and linear shifting for Lambda and ECS, Lambda aliases support weighted traffic, and ALB weighted target groups do it for services. Watch the vocabulary: AWS calls its ECS deployment type "blue/green" even when it shifts traffic in canary or linear steps between the two task sets; what makes this scenario a canary is the small, metric-gated first slice compared against the live v1, not the number of environments. All of them require backward-compatible schema changes, because two versions run at the same time.',
  },
  {
    id: 'cicd-pipeline-quality-gates',
    domain: 'cloud',
    subject: 'cicd',
    topic: 'pipelines',
    level: 'mid',
    kind: 'multi',
    prompt:
      'Which checks make good **automated gates** that should block a merge or a promotion to production? Select all that apply.',
    options: [
      { id: 'a', text: 'Type check, lint, unit and integration tests, and a build that must succeed' },
      { id: 'b', text: 'Dependency and secret scanning that fails on critical known vulnerabilities or leaked credentials' },
      { id: 'c', text: 'A manual approval on every commit to every environment, including `dev`' },
      { id: 'd', text: 'A hard requirement of 100% line coverage on every change' },
    ],
    answer: ['a', 'b'],
    tags: ['ci-cd', 'quality-gates', 'security'],
    source: 'topic-list',
    explanation:
      'Good gates are **fast, deterministic and meaningful**: correctness (types, tests), buildability, security (SCA, SAST, secret scanning, image scanning), and for production promotion also a smoke test and health or canary metrics after deploy. Manual approvals everywhere slow delivery without adding signal; reserve them for production (or replace them with automated canary analysis). 100% coverage invites tests that assert nothing; use a sensible threshold or coverage on changed lines instead. Flaky tests must be fixed or quarantined, because a gate people learn to re-run is not a gate.',
  },
  {
    id: 'cicd-canary-gate-decision',
    domain: 'cloud',
    subject: 'cicd',
    topic: 'pipelines',
    level: 'mid',
    kind: 'code',
    language: 'typescript',
    prompt:
      'Implement the decision step of an automated canary analysis. `solution(baseline, canary)` receives these metrics for the old and new version over the same window:\n\n```ts\ntype Metrics = {\n  requests: number;\n  errors: number;\n  p99Ms: number;\n};\n```\n\nIt returns:\n\n- `\'wait\'` if the canary has fewer than **500** requests (not enough data yet);\n- otherwise `\'rollback\'` if the canary error rate (`errors / requests`) is **more than 1 percentage point** above the baseline error rate, **or** the canary p99 is **more than 20%** above the baseline p99;\n- otherwise `\'promote\'`.',
    starter: `type Metrics = { requests: number; errors: number; p99Ms: number };

export function solution(baseline: Metrics, canary: Metrics): 'wait' | 'rollback' | 'promote' {
  return 'promote';
}`,
    tests: [
      {
        name: 'healthy canary is promoted',
        args: [{ requests: 20000, errors: 100, p99Ms: 300 }, { requests: 1000, errors: 6, p99Ms: 320 }],
        expected: 'promote',
      },
      {
        name: 'too little traffic waits',
        args: [{ requests: 20000, errors: 100, p99Ms: 300 }, { requests: 499, errors: 50, p99Ms: 900 }],
        expected: 'wait',
      },
      {
        name: 'error rate regression rolls back',
        args: [{ requests: 10000, errors: 50, p99Ms: 300 }, { requests: 1000, errors: 20, p99Ms: 300 }],
        expected: 'rollback',
      },
      {
        name: 'latency regression rolls back',
        args: [{ requests: 10000, errors: 0, p99Ms: 200 }, { requests: 800, errors: 0, p99Ms: 250 }],
        expected: 'rollback',
      },
      {
        name: 'exactly one point worse is still allowed',
        args: [{ requests: 1000, errors: 10, p99Ms: 200 }, { requests: 1000, errors: 20, p99Ms: 230 }],
        expected: 'promote',
      },
    ],
    solution: `type Metrics = { requests: number; errors: number; p99Ms: number };

const MIN_REQUESTS = 500;
const MAX_ERROR_RATE_DELTA = 0.01;
const MAX_LATENCY_RATIO = 1.2;

export function solution(baseline: Metrics, canary: Metrics): 'wait' | 'rollback' | 'promote' {
  if (canary.requests < MIN_REQUESTS) return 'wait';
  const baselineRate = baseline.errors / baseline.requests;
  const canaryRate = canary.errors / canary.requests;
  if (canaryRate > baselineRate + MAX_ERROR_RATE_DELTA) return 'rollback';
  if (canary.p99Ms > baseline.p99Ms * MAX_LATENCY_RATIO) return 'rollback';
  return 'promote';
}`,
    tags: ['canary', 'deployment-strategies', 'observability'],
    source: 'topic-list',
    explanation:
      'The three rules mirror real canary analysis (Argo Rollouts, Flagger, Spinnaker Kayenta, CodeDeploy with CloudWatch alarms). Compare **rates**, not raw counts: the canary gets far less traffic than the baseline, so its absolute error count is always lower. The minimum-sample rule prevents promoting (or rolling back) on noise from a handful of requests. Compare against the **live baseline** over the same window rather than a fixed threshold, so a global incident or a traffic spike does not blame the canary. Production systems add statistical tests and require several consecutive healthy intervals before each step.',
  },
  {
    id: 'cicd-migrations-and-rollback',
    domain: 'cloud',
    subject: 'cicd',
    topic: 'pipelines',
    level: 'senior',
    kind: 'open',
    prompt:
      'Design a delivery pipeline for a Node.js service with a PostgreSQL database that deploys to production several times a day with zero downtime. In particular, how do you handle **database migrations** and **rollback**?',
    modelAnswer:
      'Stages: on every pull request run install, type check, lint, unit tests, integration tests against a real Postgres in a container, and security scans; on merge build one image tagged with the commit SHA and push it. Deploy that image to staging, run migrations and smoke or end-to-end tests, then promote the same image to production with a canary or blue/green rollout gated on error rate and latency, with automatic rollback. Migrations run as a separate, idempotent pipeline step before the new code rolls out, and they must be **backward compatible**, because during a canary or rolling deploy the old and new versions run against the same schema. So I use **expand and contract**: add nullable columns or new tables first, deploy code that writes both and reads the new shape, backfill in batches, and only drop or rename the old structure in a later release. That makes application rollback safe (redeploy the previous image), and I rarely roll back schema; instead I roll forward with a fix. Long-running changes use non-blocking forms such as `CREATE INDEX CONCURRENTLY`, and a lock timeout keeps a migration from stalling traffic. Feature flags decouple deploy from release, so risky behavior can be turned off without a deploy.',
    rubric: [
      'Lists concrete stages with a single immutable artifact promoted across environments',
      'Uses a progressive rollout (canary or blue/green) gated on metrics with automatic rollback',
      'Explains expand and contract so old and new versions work with the same schema',
      'Treats rollback as redeploying the previous artifact and rolling schema forward, not reversing migrations',
      'Mentions non-blocking migration techniques or feature flags',
    ],
    tags: ['ci-cd', 'migrations', 'zero-downtime', 'rollback'],
    source: 'topic-list',
    explanation:
      'Senior signal: recognizing that the database is the part you cannot roll back instantly, so every schema change must be compatible with both the previous and the next version of the code.\n\n**Say this out loud:** "Build once, promote the same image, roll out progressively with automatic rollback, and make every migration expand-then-contract so old and new code can run against the same schema; code rolls back, schema rolls forward."',
  },
];
