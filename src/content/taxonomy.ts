/** Spanish copy for a taxonomy node; English `name` / `blurb` stay the fallback. */
export type SpanishText = { name: string; blurb?: string };

export type Topic = { id: string; name: string; es?: SpanishText };
export type Subject = { id: string; name: string; es?: SpanishText; topics: Topic[] };
export type Domain = { id: string; name: string; blurb: string; es?: SpanishText; subjects: Subject[] };

function t(id: string, name: string, esName: string): Topic {
  return { id, name, es: { name: esName } };
}

export const DOMAINS: Domain[] = [
  {
    id: 'languages',
    name: 'Languages',
    blurb: 'JavaScript and TypeScript, the runtime model and the type system.',
    es: { name: 'Lenguajes', blurb: 'JavaScript y TypeScript: el modelo de ejecución y el sistema de tipos.' },
    subjects: [
      {
        id: 'javascript',
        name: 'JavaScript',
        es: { name: 'JavaScript' },
        topics: [
          t('fundamentals', 'Fundamentals', 'Fundamentos'),
          t('event-loop', 'Event loop, call stack, microtasks and macrotasks', 'Event loop, pila de llamadas, microtareas y macrotareas'),
          t('closures', 'Closures', 'Closures (clausuras)'),
          t('references-and-copies', 'Object references, mutation, shallow vs deep copy, structuredClone', 'Referencias a objetos, mutación, copia superficial vs profunda, structuredClone'),
          t('array-methods', 'Array methods: map, filter, some, every', 'Métodos de arrays: map, filter, some, every'),
          t('this-binding', 'this, bind, call, apply', 'this, bind, call, apply'),
          t('async', 'Promises and async/await', 'Promesas y async/await'),
          t('coercion-and-equality', 'Type coercion, == vs ===', 'Coerción de tipos, == vs ==='),
          t('hoisting-and-scope', 'Hoisting, TDZ, var/let/const', 'Hoisting, TDZ, var/let/const'),
          t('prototypes', 'Prototypes and inheritance', 'Prototipos y herencia'),
          t('functional', 'Pure functions, higher-order functions, immutability, memoization', 'Funciones puras, funciones de orden superior, inmutabilidad, memoización'),
          t('es-features', 'Destructuring, spread, Set/Map, arrow functions, strict mode, classes', 'Desestructuración, spread, Set/Map, funciones flecha, modo estricto, clases'),
          t('event-delegation', 'DOM events and delegation', 'Eventos del DOM y delegación'),
        ],
      },
      {
        id: 'typescript',
        name: 'TypeScript',
        es: { name: 'TypeScript' },
        topics: [
          t('basics', 'Basics and inference', 'Fundamentos e inferencia'),
          t('generics', 'Generics and constraints', 'Genéricos y restricciones'),
          t('aliases-vs-interfaces', 'Type aliases vs interfaces', 'Alias de tipo vs interfaces'),
          t('enums', 'Enums and literal types', 'Enums y tipos literales'),
          t('unions-and-narrowing', 'Union types and type narrowing', 'Tipos unión y estrechamiento de tipos'),
          t('optional-fields', 'Optional fields and strictness', 'Campos opcionales y modo estricto'),
          t('utility-types', 'Utility and mapped types', 'Tipos utilitarios y mapeados'),
          t('boundaries', 'Typing boundaries and runtime validation', 'Tipado de fronteras y validación en tiempo de ejecución'),
        ],
      },
    ],
  },
  {
    id: 'libraries',
    name: 'Libraries',
    blurb: 'React and the libraries that usually ship next to it.',
    es: { name: 'Librerías', blurb: 'React y las librerías que suelen acompañarlo.' },
    subjects: [
      {
        id: 'react',
        name: 'React',
        es: { name: 'React' },
        topics: [
          t('components-and-lifecycle', 'Class vs functional components and lifecycle', 'Componentes de clase vs funcionales y ciclo de vida'),
          t('hooks', 'useState, useEffect, useCallback, useMemo, useContext, useReducer', 'useState, useEffect, useCallback, useMemo, useContext, useReducer'),
          t('dependency-arrays', 'Dependency arrays', 'Arrays de dependencias'),
          t('re-rendering', 'Re-rendering behavior', 'Comportamiento de los re-renderizados'),
          t('props-and-state', 'Props and state management', 'Props y gestión del estado'),
          t('forms', 'Forms', 'Formularios'),
          t('performance', 'Frontend performance optimization', 'Optimización del rendimiento en el frontend'),
        ],
      },
      { id: 'redux', name: 'Redux', es: { name: 'Redux' }, topics: [t('core', 'Redux core', 'Núcleo de Redux'), t('redux-toolkit', 'Redux Toolkit', 'Redux Toolkit')] },
      { id: 'react-router', name: 'React Router', es: { name: 'React Router' }, topics: [t('routing', 'Routing, loaders and navigation', 'Enrutamiento, loaders y navegación')] },
      { id: 'react-testing-library', name: 'React Testing Library', es: { name: 'React Testing Library' }, topics: [t('rtl', 'Queries, user events and async assertions', 'Consultas, eventos de usuario y aserciones asíncronas')] },
      { id: 'typeorm', name: 'TypeORM', es: { name: 'TypeORM' }, topics: [t('orm-usage', 'Entities, relations and queries', 'Entidades, relaciones y consultas'), t('n-plus-one', 'The N+1 problem', 'El problema N+1')] },
      { id: 'prisma', name: 'Prisma', es: { name: 'Prisma' }, topics: [t('orm-usage', 'Schema, client and migrations', 'Esquema, cliente y migraciones'), t('n-plus-one', 'The N+1 problem', 'El problema N+1')] },
    ],
  },
  {
    id: 'frameworks',
    name: 'Frameworks',
    blurb: 'Opinionated application frameworks on top of Node and React.',
    es: { name: 'Frameworks', blurb: 'Frameworks de aplicación con convenciones propias sobre Node y React.' },
    subjects: [
      { id: 'express', name: 'Express', es: { name: 'Express' }, topics: [t('middleware', 'Middleware', 'Middleware'), t('routing', 'Routing', 'Enrutamiento'), t('error-handling', 'Error handling', 'Manejo de errores')] },
      { id: 'nestjs', name: 'NestJS', es: { name: 'NestJS' }, topics: [t('modules', 'Modules and providers', 'Módulos y providers'), t('pipes-and-guards', 'Pipes, guards and interceptors', 'Pipes, guards e interceptores')] },
      { id: 'nextjs', name: 'Next.js', es: { name: 'Next.js' }, topics: [t('app-router', 'App Router', 'App Router'), t('rendering-modes', 'SSR, SSG, ISR and client components', 'SSR, SSG, ISR y componentes de cliente')] },
    ],
  },
  {
    id: 'runtimes',
    name: 'Runtimes',
    blurb: 'Node.js as an ecosystem: daemon, API, serverless function, script.',
    es: { name: 'Entornos de ejecución', blurb: 'Node.js como ecosistema: demonio, API, función serverless, script.' },
    subjects: [
      {
        id: 'nodejs',
        name: 'Node.js',
        es: { name: 'Node.js' },
        topics: [
          t('fundamentals', 'Fundamentals', 'Fundamentos'),
          t('event-loop-phases', 'Event loop phases', 'Fases del event loop'),
          t('streams-and-large-files', 'Streams, backpressure and large files', 'Streams, backpressure y archivos grandes'),
          t('worker-threads-and-cpu-work', 'Worker threads, CPU-intensive work, avoiding blocking', 'Worker threads, trabajo intensivo en CPU, cómo evitar bloqueos'),
          t('execution-models', 'Daemon, serverless, API and scripting', 'Demonio, serverless, API y scripting'),
          t('request-batching', 'Request batching', 'Agrupación de peticiones'),
        ],
      },
    ],
  },
  {
    id: 'apis',
    name: 'APIs',
    blurb: 'Designing, exposing and protecting HTTP APIs.',
    es: { name: 'APIs', blurb: 'Diseñar, exponer y proteger APIs HTTP.' },
    subjects: [
      { id: 'rest', name: 'REST', es: { name: 'REST' }, topics: [t('http-methods', 'HTTP methods', 'Métodos HTTP'), t('status-codes', 'Status codes', 'Códigos de estado'), t('idempotency', 'Safe and idempotent methods', 'Métodos seguros e idempotentes')] },
      { id: 'graphql', name: 'GraphQL', es: { name: 'GraphQL' }, topics: [t('schema-and-resolvers', 'Schema and resolvers', 'Esquema y resolvers'), t('graphql-vs-rest', 'GraphQL vs REST', 'GraphQL vs REST')] },
      { id: 'api-design', name: 'API design', es: { name: 'Diseño de APIs' }, topics: [t('pagination', 'Pagination', 'Paginación'), t('versioning', 'Versioning', 'Versionado'), t('response-shape', 'Response shape and errors', 'Forma de la respuesta y errores')] },
      { id: 'api-security', name: 'API security', es: { name: 'Seguridad de APIs' }, topics: [t('authn-vs-authz', 'Authentication vs authorization', 'Autenticación vs autorización'), t('rate-limiting', 'Rate limiting', 'Limitación de peticiones (rate limiting)'), t('common-practices', 'Common API security practices', 'Prácticas comunes de seguridad en APIs')] },
    ],
  },
  {
    id: 'architecture',
    name: 'Architecture',
    blurb: 'Patterns, principles and distributed-system trade-offs.',
    es: { name: 'Arquitectura', blurb: 'Patrones, principios y compromisos de los sistemas distribuidos.' },
    subjects: [
      { id: 'design-patterns', name: 'Design patterns', es: { name: 'Patrones de diseño' }, topics: [t('creational', 'Creational', 'Creacionales'), t('structural', 'Structural', 'Estructurales'), t('behavioral', 'Behavioral', 'De comportamiento')] },
      { id: 'solid', name: 'SOLID', es: { name: 'SOLID' }, topics: [t('srp', 'Single responsibility', 'Responsabilidad única'), t('ocp', 'Open-closed', 'Abierto/cerrado'), t('lsp', 'Liskov substitution', 'Sustitución de Liskov'), t('isp', 'Interface segregation', 'Segregación de interfaces'), t('dip', 'Dependency inversion', 'Inversión de dependencias')] },
      { id: 'clean-code', name: 'Clean code', es: { name: 'Código limpio' }, topics: [t('naming', 'Naming', 'Nombres'), t('functions', 'Functions and structure', 'Funciones y estructura')] },
      { id: 'architecture-patterns', name: 'Architecture patterns', es: { name: 'Patrones de arquitectura' }, topics: [t('layered-and-hexagonal', 'Layered and hexagonal', 'Por capas y hexagonal'), t('bff', 'Backend-for-frontend', 'Backend-for-frontend (BFF)'), t('event-driven', 'Event-driven', 'Orientada a eventos')] },
      { id: 'distributed-systems', name: 'Distributed systems', es: { name: 'Sistemas distribuidos' }, topics: [t('microservices', 'Microservices', 'Microservicios'), t('kafka', 'Kafka', 'Kafka'), t('dead-letter-queues', 'Dead letter queues', 'Colas de mensajes fallidos (DLQ)'), t('idempotency', 'Idempotency', 'Idempotencia'), t('retries', 'Message retries', 'Reintentos de mensajes'), t('correlation-ids-and-tracing', 'Correlation IDs and tracing', 'IDs de correlación y trazabilidad')] },
    ],
  },
  {
    id: 'databases',
    name: 'Databases',
    blurb: 'SQL, NoSQL and the managed engines you meet on AWS.',
    es: { name: 'Bases de datos', blurb: 'SQL, NoSQL y los motores gestionados que encontrarás en AWS.' },
    subjects: [
      { id: 'sql', name: 'SQL', es: { name: 'SQL' }, topics: [t('fundamentals', 'Fundamentals', 'Fundamentos'), t('aggregation', 'Aggregation', 'Agregación'), t('joins', 'Joins', 'Joins'), t('group-by', 'Group by', 'GROUP BY'), t('indexing', 'Indexing', 'Índices'), t('query-optimization', 'Query optimization', 'Optimización de consultas')] },
      { id: 'nosql', name: 'NoSQL', es: { name: 'NoSQL' }, topics: [t('use-cases', 'Use cases', 'Casos de uso'), t('sql-vs-nosql', 'SQL vs NoSQL', 'SQL vs NoSQL')] },
      { id: 'dynamodb', name: 'DynamoDB', es: { name: 'DynamoDB' }, topics: [t('keys-and-access-patterns', 'Keys and access patterns', 'Claves y patrones de acceso')] },
      { id: 'rds', name: 'RDS', es: { name: 'RDS' }, topics: [t('engines-and-operations', 'Engines and operations', 'Motores y operación')] },
    ],
  },
  {
    id: 'cloud',
    name: 'Cloud',
    blurb: 'AWS services, containers, infrastructure as code and delivery.',
    es: { name: 'Nube', blurb: 'Servicios de AWS, contenedores, infraestructura como código y entrega continua.' },
    subjects: [
      { id: 'aws', name: 'AWS', es: { name: 'AWS' }, topics: [t('lambda', 'Lambda', 'Lambda'), t('api-gateway', 'API Gateway', 'API Gateway'), t('s3', 'S3 and static hosting', 'S3 y hosting estático'), t('s3-event-notifications', 'S3 event notifications', 'Notificaciones de eventos de S3'), t('sns', 'SNS', 'SNS'), t('s3-to-sns', 'Connecting S3 events to SNS', 'Conectar eventos de S3 con SNS'), t('ecs', 'ECS', 'ECS'), t('fargate', 'Fargate', 'Fargate'), t('cognito', 'Cognito', 'Cognito')] },
      { id: 'containers', name: 'Containers', es: { name: 'Contenedores' }, topics: [t('docker-basics', 'Docker basics', 'Fundamentos de Docker'), t('containerization', 'Containerization', 'Contenedorización')] },
      { id: 'iac', name: 'Infrastructure as code', es: { name: 'Infraestructura como código' }, topics: [t('iaas-vs-iac', 'IaaS vs IaC', 'IaaS vs IaC'), t('terraform', 'Terraform', 'Terraform'), t('cloudformation', 'CloudFormation', 'CloudFormation')] },
      { id: 'serverless', name: 'Serverless', es: { name: 'Serverless' }, topics: [t('serverless-architecture', 'Serverless architecture', 'Arquitectura serverless')] },
      { id: 'cicd', name: 'CI/CD', es: { name: 'CI/CD' }, topics: [t('pipelines', 'Pipelines and basics', 'Pipelines y fundamentos')] },
    ],
  },
  {
    id: 'practices',
    name: 'Practices',
    blurb: 'Testing, security, operations and working with AI tools.',
    es: { name: 'Prácticas', blurb: 'Testing, seguridad, operaciones y trabajo con herramientas de IA.' },
    subjects: [
      { id: 'testing', name: 'Testing', es: { name: 'Testing' }, topics: [t('strategies', 'Strategies', 'Estrategias'), t('unit', 'Unit', 'Unitarias'), t('integration', 'Integration', 'De integración'), t('frontend', 'Frontend', 'Frontend'), t('backend', 'Backend', 'Backend')] },
      { id: 'security', name: 'Security', es: { name: 'Seguridad' }, topics: [t('web-security-basics', 'Web security basics', 'Fundamentos de seguridad web'), t('xss', 'XSS', 'XSS'), t('csrf', 'CSRF', 'CSRF')] },
      { id: 'operations', name: 'Operations', es: { name: 'Operaciones' }, topics: [t('production-debugging', 'Production debugging', 'Depuración en producción'), t('logging-and-monitoring', 'Logging and monitoring', 'Logging y monitorización'), t('performance-optimization', 'Performance optimization', 'Optimización del rendimiento')] },
      { id: 'ai-assisted-development', name: 'AI-assisted development', es: { name: 'Desarrollo asistido por IA' }, topics: [t('tooling', 'Tooling and workflow', 'Herramientas y flujo de trabajo')] },
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

function spanish(node: { es?: SpanishText }, locale: string): SpanishText | undefined {
  return locale === 'es' ? node.es : undefined;
}

/** Domain name in `locale`, falling back to English. */
export function domainName(domain: Domain, locale: string): string {
  return spanish(domain, locale)?.name ?? domain.name;
}

/** Domain blurb in `locale`, falling back to English. */
export function domainBlurb(domain: Domain, locale: string): string {
  return spanish(domain, locale)?.blurb ?? domain.blurb;
}

/** Subject name in `locale`, falling back to English. */
export function subjectName(subject: Subject, locale: string): string {
  return spanish(subject, locale)?.name ?? subject.name;
}

/** Topic name in `locale`, falling back to English. */
export function topicName(topic: Topic, locale: string): string {
  return spanish(topic, locale)?.name ?? topic.name;
}
