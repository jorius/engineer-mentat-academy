// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  {
    id: 'rds-multi-az-vs-read-replica',
    domain: 'databases',
    subject: 'rds',
    topic: 'engines-and-operations',
    level: 'mid',
    kind: 'single',
    prompt: 'For a classic RDS for PostgreSQL **Multi-AZ DB instance** deployment, which statement correctly contrasts it with a read replica?',
    options: [
      {
        id: 'a',
        text: 'Multi-AZ keeps a synchronously replicated standby that serves no traffic and exists for failover; a read replica is replicated asynchronously, serves reads, and has its own endpoint.',
      },
      { id: 'b', text: 'Multi-AZ standbys serve read traffic through the reader endpoint, so Multi-AZ doubles read capacity for free.' },
      { id: 'c', text: 'Read replicas use synchronous replication, so reading from them never returns stale data.' },
      { id: 'd', text: 'Multi-AZ and read replicas are the same feature; Multi-AZ is simply a read replica placed in another Availability Zone.' },
    ],
    answer: 'a',
    tags: ['multi-az', 'read-replicas', 'high-availability', 'replication-lag'],
    source: 'topic-list',
    explanation:
      'Multi-AZ is for **availability**: writes commit on the primary and the standby synchronously, so failover loses no committed data, but the standby is not readable. Read replicas are for **read scaling**: asynchronous replication means replica lag, so read-after-write flows must go to the primary. A replica can be promoted manually (and can be in another Region for disaster recovery), but that is a separate, deliberate operation. Newer options blur this: the **Multi-AZ DB cluster** deployment (PostgreSQL and MySQL) has two readable standbys with a reader endpoint, and Aurora replicas serve both reads and failover.',
    hint: 'Compare what each feature is for, availability or read scaling, and whether its replication is synchronous or asynchronous.',
  },
  {
    id: 'rds-failover-behavior',
    domain: 'databases',
    subject: 'rds',
    topic: 'engines-and-operations',
    level: 'mid',
    kind: 'multi',
    prompt:
      'Your RDS for MySQL **Multi-AZ DB instance** deployment (one primary, one standby) loses its primary. Which statements about the failover are true? Select all that apply.',
    options: [
      { id: 'a', text: 'RDS repoints the instance DNS endpoint to the standby, which is promoted to primary.' },
      { id: 'b', text: 'You must update the application connection string to the standby host name.' },
      { id: 'c', text: 'Clients that cache DNS for a long time (for example a JVM with an unbounded DNS cache) can keep failing after the failover completes.' },
      { id: 'd', text: 'Committed transactions are not lost, because replication to the standby is synchronous.' },
      { id: 'e', text: 'Existing read replicas are automatically promoted to take over from the failed primary.' },
    ],
    answer: ['a', 'c', 'd'],
    tags: ['failover', 'dns', 'multi-az', 'connection-handling'],
    source: 'topic-list',
    explanation:
      'The endpoint name stays the same; RDS flips its DNS record to the promoted standby, typically in one to two minutes. Applications therefore need a short DNS TTL, connection retries with backoff, and a pool that discards broken connections; RDS Proxy shortens and hides much of this. Synchronous replication means no committed data is lost, while in-flight transactions are rolled back. Read replicas are not part of RDS Multi-AZ failover, so the automatic replica promotion claim is false for RDS; in **Aurora**, by contrast, a replica is promoted using failover priority tiers.',
    hint: 'Think about what happens to the endpoint name, the client DNS cache and committed data, and which replicas take part in Multi-AZ failover.',
  },
  {
    id: 'rds-parameter-group-static-change',
    domain: 'databases',
    subject: 'rds',
    topic: 'engines-and-operations',
    level: 'junior',
    kind: 'single',
    prompt:
      'You need to change a **static** engine setting (for example `shared_buffers` on RDS for PostgreSQL). The instance uses the default parameter group. What is the correct procedure?',
    options: [
      {
        id: 'a',
        text: 'Create a custom DB parameter group, set the value there, associate it with the instance, then reboot; the change shows as `pending-reboot` until then.',
      },
      { id: 'b', text: 'Edit the value in the default parameter group; it applies immediately to every instance without a restart.' },
      { id: 'c', text: 'Connect as the master user and run `ALTER SYSTEM SET shared_buffers = ...`, then reload the configuration.' },
      { id: 'd', text: 'SSH into the RDS host and edit `postgresql.conf`, then restart the service.' },
    ],
    answer: 'a',
    tags: ['parameter-groups', 'configuration', 'operations'],
    source: 'topic-list',
    explanation:
      'Engine configuration on RDS is managed through parameter groups. Default groups cannot be modified, so you create a custom group (ideally in infrastructure as code) and attach it. **Dynamic** parameters apply without a restart; **static** ones wait for a reboot, which in production you schedule or perform with Multi-AZ to minimize downtime. RDS gives no host access, and the master user is not a true superuser, so `ALTER SYSTEM` is not available. Because a group can be shared by many instances, changing it changes all of them.',
    hint: 'Recall how engine settings are managed on a managed RDS instance, and what separates a static parameter from a dynamic one.',
  },
  {
    id: 'rds-when-to-choose-aurora',
    domain: 'databases',
    subject: 'rds',
    topic: 'engines-and-operations',
    level: 'senior',
    kind: 'open',
    prompt: 'When would you choose Amazon Aurora over standard RDS for PostgreSQL or MySQL, and when would you stay on standard RDS?',
    modelAnswer:
      "Aurora separates compute from a distributed storage layer that keeps six copies of the data across three Availability Zones and grows automatically (up to 256 TiB on current engine versions). Because replicas read the same storage, it supports up to 15 low-lag readers behind one reader endpoint, and failover to a replica usually takes well under a minute. It adds features standard RDS lacks: Global Database for cross-Region disaster recovery with about a second of lag, fast database cloning, backtrack on MySQL, and Serverless v2 for spiky or unpredictable load. I would pick it for read-heavy workloads that need many replicas, strict availability or recovery targets, or large and fast-growing data. I would stay on standard RDS for small or steady workloads where Aurora's higher instance prices and per-I/O charges cost more (or evaluate Aurora I/O-Optimized for I/O-heavy loads), when I need an engine version or extension Aurora does not support yet, or when portability to vanilla PostgreSQL or MySQL matters. The decision should come from measured read ratio, I/O profile and recovery objectives, priced with both storage configurations.",
    rubric: [
      'Explains the shared, distributed storage layer (six copies across three AZs) and why it makes replicas and failover faster',
      'Names concrete Aurora-only capabilities: up to 15 replicas, Global Database, cloning, Serverless v2',
      'Discusses cost: higher instance price, I/O charges versus I/O-Optimized',
      'Mentions compatibility limits: version lag, unsupported extensions or features',
      'Ties the choice to workload data (read ratio, I/O, RPO/RTO) rather than a blanket rule',
    ],
    tags: ['aurora', 'cost', 'high-availability', 'trade-offs'],
    source: 'topic-list',
    explanation:
      'The senior answer is a trade-off anchored in the storage architecture: Aurora buys faster failover, cheap replicas and elastic storage with a different cost model and some compatibility lag.\n\n**Say this out loud:** "Aurora moves durability into a shared storage layer, which is why its replicas are cheap and failover is fast; I pick it when availability or read scale justify the price, and I check the I/O bill and extension support before committing."',
    hint: 'Anchor the answer in Aurora\'s shared storage layer, then weigh its extra features against cost and compatibility using workload data.',
  },
];
