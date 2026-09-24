// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  {
    id: 'serverless-definition',
    domain: 'cloud',
    subject: 'serverless',
    topic: 'serverless-architecture',
    level: 'junior',
    kind: 'single',
    prompt: 'Which description of **serverless** is most accurate?',
    options: [
      { id: 'a', text: 'Code runs without any servers, directly on the provider\'s network edge' },
      { id: 'b', text: 'The provider runs, patches and scales the servers; you deploy functions or managed services, pay per use, and capacity can scale to zero' },
      { id: 'c', text: 'Any application deployed in containers' },
      { id: 'd', text: 'A VM that the provider automatically restarts when it crashes' },
    ],
    answer: 'b',
    tags: ['serverless', 'fundamentals'],
    source: 'topic-list',
    explanation:
      'There are still servers; you just do not manage them. The defining traits are **no capacity management**, **automatic scaling** (including to zero), **pay per request or per unit of work** rather than per provisioned hour, and heavy use of managed building blocks: Lambda, API Gateway, DynamoDB, SQS, SNS, EventBridge, Step Functions, S3. Containers are a packaging format and can be serverless (Fargate, Cloud Run) or not (a self-managed Kubernetes cluster).',
    hint: 'Focus on who runs and manages the machines, how capacity scales and how you are billed.',
  },
  {
    id: 'serverless-cold-start-mitigation',
    domain: 'cloud',
    subject: 'serverless',
    topic: 'serverless-architecture',
    level: 'mid',
    kind: 'multi',
    prompt:
      'A latency-sensitive checkout API on Lambda shows p99 spikes caused by cold starts. Which mitigations actually help? Select all that apply.',
    options: [
      { id: 'a', text: 'Provisioned concurrency on the checkout function, sized to expected peak and adjusted with Application Auto Scaling' },
      { id: 'b', text: 'Create SDK clients and DB connections outside the handler and keep the bundle small (tree-shaken, only the SDK v3 clients you use)' },
      { id: 'c', text: 'A scheduled ping every 5 minutes, which keeps enough environments warm to absorb traffic bursts' },
      { id: 'd', text: 'Raising the function timeout from 10 s to 60 s' },
    ],
    answer: ['a', 'b'],
    tags: ['lambda', 'cold-start', 'performance'],
    source: 'topic-list',
    explanation:
      'A cold start happens whenever Lambda must create a new execution environment: first request, scale-out beyond current warm environments, a new deployment, or after idle reclamation. **Provisioned concurrency** keeps N environments initialized (paid). Smaller bundles and lean init code shorten every cold start, and init work done outside the handler is reused on warm invocations. More memory also gives proportionally more CPU, which speeds up init. **SnapStart** snapshots the initialized environment and restores it; it covers the Java, Python and .NET managed runtimes and, since July 2026, container-image functions, so check your runtime and packaging. A ping keeps roughly **one** environment warm; a burst of 50 concurrent requests still needs 49 new ones. Timeout has no effect on startup.',
    hint:
      'For each option, ask whether it shortens init or keeps enough environments initialized for a concurrent burst.',
  },
  {
    id: 'serverless-stateless-warm-environment',
    domain: 'cloud',
    subject: 'serverless',
    topic: 'serverless-architecture',
    level: 'mid',
    kind: 'predict',
    language: 'javascript',
    prompt:
      '`createExecutionEnvironment` simulates a Lambda cold start: its body is module scope (runs once per environment) and it returns the handler. Two environments serve three requests. What does this print, one value per line?',
    code: `function createExecutionEnvironment() {
  let invocations = 0;
  const profileCache = new Map();
  return function handler(event) {
    invocations += 1;
    if (!profileCache.has(event.userId)) {
      profileCache.set(event.userId, event.name);
    }
    return invocations + ':' + profileCache.get(event.userId);
  };
}

const envA = createExecutionEnvironment();
const envB = createExecutionEnvironment();

console.log(envA({ userId: 7, name: 'Ana' }));
console.log(envA({ userId: 7, name: 'Ana Maria' }));
console.log(envB({ userId: 7, name: 'Ana Maria' }));`,
    answer: '1:Ana\n2:Ana\n1:Ana Maria',
    tags: ['lambda', 'stateless', 'caching'],
    source: 'topic-list',
    explanation:
      'Module-scope state survives between invocations **in the same environment** (a warm start), which is why you initialize clients there. But it is per environment, not per function: `envB` has its own counter and cache, and the router decides which environment serves each request. So in-memory counters are wrong, and in-memory caches can serve stale data (`envA` still says `Ana` after the rename). Treat module scope as an optimization only: anything that must be correct or shared goes to DynamoDB, ElastiCache or similar, with TTLs on caches.',
    hint:
      'Module scope runs once per environment; track each environment\'s counter and cache separately, and note that a cache entry is only written when missing.',
  },
  {
    id: 'serverless-cost-model-steady-load',
    domain: 'cloud',
    subject: 'serverless',
    topic: 'serverless-architecture',
    level: 'mid',
    kind: 'single',
    prompt:
      'An internal API on Lambda now handles a **steady 2,000 requests per second, 24/7**, at 150 ms average duration and 1 GB memory. The monthly bill surprised finance. Which statement best describes the cost model?',
    options: [
      { id: 'a', text: 'Lambda is always the cheapest option because you only pay while code runs, and idle environments between requests cost nothing' },
      { id: 'b', text: 'Lambda bills per request plus GB-seconds of duration; at sustained high utilization that often exceeds right-sized containers running near full capacity, while spiky or low traffic favors Lambda' },
      { id: 'c', text: 'Lambda cost depends only on the number of requests, so lowering memory or duration will not change the bill' },
      { id: 'd', text: 'The cost is dominated by cold starts, because at a steady 2,000 requests per second almost every invocation creates a new execution environment' },
    ],
    answer: 'b',
    tags: ['lambda', 'cost', 'fargate'],
    source: 'topic-list',
    explanation:
      'Lambda pricing is a per-request fee plus **duration x memory** (GB-seconds), rounded to the millisecond; since August 2025 the init phase is billed as well. That is ideal when traffic is bursty or idle much of the time, because idle costs nothing. With a constant, high load, you are effectively paying a premium for capacity you could run at high utilization on Fargate or EC2 with Savings Plans. Levers before migrating: right-size memory with Lambda Power Tuning (more memory can finish faster and cost the same or less), use Graviton (arm64), and batch work. Cold starts are rare here: 2,000 requests per second at 150 ms keep about 300 environments continuously busy. Provisioned concurrency is in fact a cost lever at this utilization: its per-GB-second price (standby plus duration) beats on-demand above roughly 60% utilization, and Compute Savings Plans also apply to Lambda. Remember the hidden costs around the function too: API Gateway requests, NAT gateway data, CloudWatch Logs ingestion.',
    hint: 'Recall the two components of a Lambda bill, do rough arithmetic for this load, and ask how the total compares with other ways to host it.',
  },
  {
    id: 'serverless-when-it-fits',
    domain: 'cloud',
    subject: 'serverless',
    topic: 'serverless-architecture',
    level: 'senior',
    kind: 'open',
    prompt:
      'A product team wants to build their next backend "fully serverless". What questions do you ask to decide whether it fits, and how do you design for its constraints?',
    modelAnswer:
      'Serverless fits event-driven and spiky workloads: APIs with uneven traffic, file and stream processing, scheduled jobs, webhooks, and glue between managed services, especially for small teams that do not want to run infrastructure. It fits poorly for long-running or stateful work (Lambda caps at 15 minutes), sustained high-throughput services where containers are cheaper, very low and predictable latency requirements where cold starts hurt, and workloads that need persistent connections or large local state. I ask about traffic shape, latency SLOs, execution duration, data access patterns and the team\'s operational maturity. Design for the constraints: keep functions **stateless** and idempotent because triggers are at-least-once, put queues between services to absorb bursts and protect databases (Lambda can scale faster than a relational database accepts connections, so use RDS Proxy or DynamoDB), use Step Functions for multi-step workflows instead of functions calling functions, and invest in structured logs, tracing and alarms from day one because there is no box to SSH into.',
    rubric: [
      'Names good fits: event-driven, spiky or low traffic, glue and async processing',
      'Names poor fits: long-running, steady high throughput, strict latency, stateful or persistent connections',
      'Designs for statelessness and idempotency under at-least-once delivery',
      'Protects downstream systems from scale-out (queues, reserved concurrency, RDS Proxy)',
      'Mentions orchestration (Step Functions) and observability',
    ],
    tags: ['serverless', 'architecture', 'trade-offs', 'idempotency'],
    source: 'topic-list',
    explanation:
      'Senior signal: answering "it depends" with the concrete dimensions (traffic shape, duration, latency, state) and then naming the design patterns that make serverless reliable.\n\n**Say this out loud:** "Serverless wins for spiky, event-driven work and small teams; I design every function to be stateless and idempotent, buffer with queues so scale-out cannot overwhelm the database, and orchestrate with Step Functions instead of chaining functions."',
    hint:
      'Cover traffic shape, execution duration, latency SLOs and state, then the patterns that make it reliable: idempotency, queues to protect downstream, orchestration.',
  },
  {
    id: 'serverless-vendor-lock-in',
    domain: 'cloud',
    subject: 'serverless',
    topic: 'serverless-architecture',
    level: 'senior',
    kind: 'single',
    prompt:
      'Leadership worries that going serverless on AWS locks the company in. Where does most of the **real** lock-in live, and what is a pragmatic mitigation?',
    options: [
      { id: 'a', text: 'In the handler signature; wrapping every function in a cross-cloud framework keeps handlers unchanged, which removes most of the switching cost' },
      { id: 'b', text: 'In the Node.js runtime version AWS provides; bundling your own runtime as a custom runtime or container image removes the lock-in' },
      { id: 'c', text: 'In the event sources, IAM, managed data stores and workflows around the code; keep domain logic behind ports and adapters and accept managed-service coupling where it pays off' },
      { id: 'd', text: 'Nowhere significant: any Lambda function can be moved to another cloud by redeploying the same zip to that provider\'s function service' },
    ],
    answer: 'c',
    tags: ['serverless', 'architecture', 'hexagonal', 'trade-offs'],
    source: 'topic-list',
    explanation:
      'Handler code is the cheap part to move; the expensive parts are the integrations around it: event shapes and triggers, IAM policies, DynamoDB access patterns, Step Functions state machines, EventBridge rules, plus the dashboards and runbooks. A hexagonal layout keeps the business rules in framework-free modules and makes the Lambda handler a thin adapter that parses the event and calls the domain, which also makes it easy to unit test and run in a container if needed. Full cloud neutrality usually costs more (lowest-common-denominator services, more to operate) than the switching cost it insures against, so decide deliberately which couplings are worth it.\n\n**Say this out loud:** "The lock-in is in the managed services and integrations, not in the handler, so I keep domain logic behind thin adapters and accept coupling to managed services where the operational savings outweigh the switching cost."',
    hint: 'Estimate the switching cost of each layer of a serverless app, and ask which couplings are worth insuring against.',
  },
];
