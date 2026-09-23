export type Topic = { id: string; name: string };
export type Subject = { id: string; name: string; topics: Topic[] };
export type Domain = { id: string; name: string; blurb: string; subjects: Subject[] };

function t(id: string, name: string): Topic {
  return { id, name };
}

export const DOMAINS: Domain[] = [
  {
    id: 'languages',
    name: 'Languages',
    blurb: 'JavaScript and TypeScript, the runtime model and the type system.',
    subjects: [
      {
        id: 'javascript',
        name: 'JavaScript',
        topics: [
          t('fundamentals', 'Fundamentals'),
          t('event-loop', 'Event loop, call stack, microtasks and macrotasks'),
          t('closures', 'Closures'),
          t('references-and-copies', 'Object references, mutation, shallow vs deep copy, structuredClone'),
          t('array-methods', 'Array methods: map, filter, some, every'),
          t('this-binding', 'this, bind, call, apply'),
          t('async', 'Promises and async/await'),
          t('coercion-and-equality', 'Type coercion, == vs ==='),
          t('hoisting-and-scope', 'Hoisting, TDZ, var/let/const'),
          t('prototypes', 'Prototypes and inheritance'),
          t('functional', 'Pure functions, higher-order functions, immutability, memoization'),
          t('es-features', 'Destructuring, spread, Set/Map, arrow functions, strict mode, classes'),
          t('event-delegation', 'DOM events and delegation'),
        ],
      },
      {
        id: 'typescript',
        name: 'TypeScript',
        topics: [
          t('basics', 'Basics and inference'),
          t('generics', 'Generics and constraints'),
          t('aliases-vs-interfaces', 'Type aliases vs interfaces'),
          t('enums', 'Enums and literal types'),
          t('unions-and-narrowing', 'Union types and type narrowing'),
          t('optional-fields', 'Optional fields and strictness'),
          t('utility-types', 'Utility and mapped types'),
          t('boundaries', 'Typing boundaries and runtime validation'),
        ],
      },
    ],
  },
  {
    id: 'libraries',
    name: 'Libraries',
    blurb: 'React and the libraries that usually ship next to it.',
    subjects: [
      {
        id: 'react',
        name: 'React',
        topics: [
          t('components-and-lifecycle', 'Class vs functional components and lifecycle'),
          t('hooks', 'useState, useEffect, useCallback, useMemo, useContext, useReducer'),
          t('dependency-arrays', 'Dependency arrays'),
          t('re-rendering', 'Re-rendering behavior'),
          t('props-and-state', 'Props and state management'),
          t('forms', 'Forms'),
          t('performance', 'Frontend performance optimization'),
        ],
      },
      { id: 'redux', name: 'Redux', topics: [t('core', 'Redux core'), t('redux-toolkit', 'Redux Toolkit')] },
      { id: 'react-router', name: 'React Router', topics: [t('routing', 'Routing, loaders and navigation')] },
      { id: 'react-testing-library', name: 'React Testing Library', topics: [t('rtl', 'Queries, user events and async assertions')] },
      { id: 'typeorm', name: 'TypeORM', topics: [t('orm-usage', 'Entities, relations and queries'), t('n-plus-one', 'The N+1 problem')] },
      { id: 'prisma', name: 'Prisma', topics: [t('orm-usage', 'Schema, client and migrations'), t('n-plus-one', 'The N+1 problem')] },
    ],
  },
  {
    id: 'frameworks',
    name: 'Frameworks',
    blurb: 'Opinionated application frameworks on top of Node and React.',
    subjects: [
      { id: 'express', name: 'Express', topics: [t('middleware', 'Middleware'), t('routing', 'Routing'), t('error-handling', 'Error handling')] },
      { id: 'nestjs', name: 'NestJS', topics: [t('modules', 'Modules and providers'), t('pipes-and-guards', 'Pipes, guards and interceptors')] },
      { id: 'nextjs', name: 'Next.js', topics: [t('app-router', 'App Router'), t('rendering-modes', 'SSR, SSG, ISR and client components')] },
    ],
  },
  {
    id: 'runtimes',
    name: 'Runtimes',
    blurb: 'Node.js as an ecosystem: daemon, API, serverless function, script.',
    subjects: [
      {
        id: 'nodejs',
        name: 'Node.js',
        topics: [
          t('fundamentals', 'Fundamentals'),
          t('event-loop-phases', 'Event loop phases'),
          t('streams-and-large-files', 'Streams, backpressure and large files'),
          t('worker-threads-and-cpu-work', 'Worker threads, CPU-intensive work, avoiding blocking'),
          t('execution-models', 'Daemon, serverless, API and scripting'),
          t('request-batching', 'Request batching'),
        ],
      },
    ],
  },
  {
    id: 'apis',
    name: 'APIs',
    blurb: 'Designing, exposing and protecting HTTP APIs.',
    subjects: [
      { id: 'rest', name: 'REST', topics: [t('http-methods', 'HTTP methods'), t('status-codes', 'Status codes'), t('idempotency', 'Safe and idempotent methods')] },
      { id: 'graphql', name: 'GraphQL', topics: [t('schema-and-resolvers', 'Schema and resolvers'), t('graphql-vs-rest', 'GraphQL vs REST')] },
      { id: 'api-design', name: 'API design', topics: [t('pagination', 'Pagination'), t('versioning', 'Versioning'), t('response-shape', 'Response shape and errors')] },
      { id: 'api-security', name: 'API security', topics: [t('authn-vs-authz', 'Authentication vs authorization'), t('rate-limiting', 'Rate limiting'), t('common-practices', 'Common API security practices')] },
    ],
  },
  {
    id: 'architecture',
    name: 'Architecture',
    blurb: 'Patterns, principles and distributed-system trade-offs.',
    subjects: [
      { id: 'design-patterns', name: 'Design patterns', topics: [t('creational', 'Creational'), t('structural', 'Structural'), t('behavioral', 'Behavioral')] },
      { id: 'solid', name: 'SOLID', topics: [t('srp', 'Single responsibility'), t('ocp', 'Open-closed'), t('lsp', 'Liskov substitution'), t('isp', 'Interface segregation'), t('dip', 'Dependency inversion')] },
      { id: 'clean-code', name: 'Clean code', topics: [t('naming', 'Naming'), t('functions', 'Functions and structure')] },
      { id: 'architecture-patterns', name: 'Architecture patterns', topics: [t('layered-and-hexagonal', 'Layered and hexagonal'), t('bff', 'Backend-for-frontend'), t('event-driven', 'Event-driven')] },
      { id: 'distributed-systems', name: 'Distributed systems', topics: [t('microservices', 'Microservices'), t('kafka', 'Kafka'), t('dead-letter-queues', 'Dead letter queues'), t('idempotency', 'Idempotency'), t('retries', 'Message retries'), t('correlation-ids-and-tracing', 'Correlation IDs and tracing')] },
    ],
  },
  {
    id: 'databases',
    name: 'Databases',
    blurb: 'SQL, NoSQL and the managed engines you meet on AWS.',
    subjects: [
      { id: 'sql', name: 'SQL', topics: [t('fundamentals', 'Fundamentals'), t('aggregation', 'Aggregation'), t('joins', 'Joins'), t('group-by', 'Group by'), t('indexing', 'Indexing'), t('query-optimization', 'Query optimization')] },
      { id: 'nosql', name: 'NoSQL', topics: [t('use-cases', 'Use cases'), t('sql-vs-nosql', 'SQL vs NoSQL')] },
      { id: 'dynamodb', name: 'DynamoDB', topics: [t('keys-and-access-patterns', 'Keys and access patterns')] },
      { id: 'rds', name: 'RDS', topics: [t('engines-and-operations', 'Engines and operations')] },
    ],
  },
  {
    id: 'cloud',
    name: 'Cloud',
    blurb: 'AWS services, containers, infrastructure as code and delivery.',
    subjects: [
      { id: 'aws', name: 'AWS', topics: [t('lambda', 'Lambda'), t('api-gateway', 'API Gateway'), t('s3', 'S3 and static hosting'), t('s3-event-notifications', 'S3 event notifications'), t('sns', 'SNS'), t('s3-to-sns', 'Connecting S3 events to SNS'), t('ecs', 'ECS'), t('fargate', 'Fargate'), t('cognito', 'Cognito')] },
      { id: 'containers', name: 'Containers', topics: [t('docker-basics', 'Docker basics'), t('containerization', 'Containerization')] },
      { id: 'iac', name: 'Infrastructure as code', topics: [t('iaas-vs-iac', 'IaaS vs IaC'), t('terraform', 'Terraform'), t('cloudformation', 'CloudFormation')] },
      { id: 'serverless', name: 'Serverless', topics: [t('serverless-architecture', 'Serverless architecture')] },
      { id: 'cicd', name: 'CI/CD', topics: [t('pipelines', 'Pipelines and basics')] },
    ],
  },
  {
    id: 'practices',
    name: 'Practices',
    blurb: 'Testing, security, operations and working with AI tools.',
    subjects: [
      { id: 'testing', name: 'Testing', topics: [t('strategies', 'Strategies'), t('unit', 'Unit'), t('integration', 'Integration'), t('frontend', 'Frontend'), t('backend', 'Backend')] },
      { id: 'security', name: 'Security', topics: [t('web-security-basics', 'Web security basics'), t('xss', 'XSS'), t('csrf', 'CSRF')] },
      { id: 'operations', name: 'Operations', topics: [t('production-debugging', 'Production debugging'), t('logging-and-monitoring', 'Logging and monitoring'), t('performance-optimization', 'Performance optimization')] },
      { id: 'ai-assisted-development', name: 'AI-assisted development', topics: [t('tooling', 'Tooling and workflow')] },
    ],
  },
];

export function findDomain(domainId: string): Domain | undefined {
  return DOMAINS.find((d) => d.id === domainId);
}

export function findSubject(domainId: string, subjectId: string): Subject | undefined {
  return findDomain(domainId)?.subjects.find((s) => s.id === subjectId);
}

export function findTopic(domainId: string, subjectId: string, topicId: string): Topic | undefined {
  return findSubject(domainId, subjectId)?.topics.find((tp) => tp.id === topicId);
}
