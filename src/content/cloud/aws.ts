// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  {
    id: 'aws-lambda-layer-cold-start-myth',
    domain: 'cloud',
    subject: 'aws',
    topic: 'lambda',
    level: 'mid',
    kind: 'single',
    prompt:
      'A Node.js Lambda has a 45 MB deployment package, almost all of it `node_modules`. To cut cold-start latency, a teammate moves every dependency into a **Lambda layer** and redeploys a 200 KB function zip. What is the realistic effect on cold starts?',
    options: [
      { id: 'a', text: 'Cold starts drop sharply, because layers are cached on the Lambda host and skip the download step' },
      { id: 'b', text: 'No meaningful improvement: the layer is still unpacked into `/opt` when the execution environment is created, and the same modules are still `require`d during init' },
      { id: 'c', text: 'Cold starts disappear, because layers are loaded once per account and shared by every execution environment' },
      { id: 'd', text: 'Cold starts get worse, because each layer adds a separate network round trip on every invocation' },
    ],
    answer: 'b',
    tags: ['lambda', 'layers', 'cold-start'],
    source: 'topic-list',
    explanation:
      'A cold start is the time to create an execution environment: fetch and unpack the code (function **plus** layers), start the runtime, then run your init code (top-level imports, SDK clients). Layers change *where* the bytes live, not how many are loaded, so init time is essentially the same. Layers are for **sharing** code or binaries across functions and keeping the function artifact small to deploy; limits are 5 layers per function and 250 MB unzipped for function plus layers (container images go up to 10 GB). What actually shortens cold starts: a smaller bundle (tree-shaken, only the SDK v3 clients you use), lazy imports on rare paths, more memory (CPU scales with it), provisioned concurrency, or SnapStart on the runtimes that support it. Layers are not reloaded per invocation, so the claim that each layer adds a network round trip on every invocation is also wrong.',
  },
  {
    id: 'aws-lambda-concurrency-controls',
    domain: 'cloud',
    subject: 'aws',
    topic: 'lambda',
    level: 'senior',
    kind: 'multi',
    prompt:
      'A payments function shares a region with 40 other functions. Which statements about Lambda concurrency are true? Select all that apply.',
    options: [
      { id: 'a', text: 'Reserved concurrency both guarantees and caps the function: that amount is carved out of the regional pool, so no other function can use it' },
      { id: 'b', text: 'Provisioned concurrency is free as long as you also set reserved concurrency to the same value' },
      { id: 'c', text: 'Setting reserved concurrency to 0 throttles every invocation, which makes it a fast kill switch during an incident' },
      { id: 'd', text: 'When a synchronous (API Gateway) invocation is throttled, Lambda queues it and retries automatically for up to 6 hours' },
    ],
    answer: ['a', 'c'],
    tags: ['lambda', 'concurrency', 'throttling'],
    source: 'topic-list',
    explanation:
      'Concurrency is the number of in-flight invocations; the regional default quota is 1,000 (soft limit) shared by every function. **Reserved concurrency** is free and is both a floor (reserved for this function) and a ceiling (it cannot exceed it), which also protects a downstream database from a scale-out stampede. Setting it to 0 is the documented way to stop a function. **Provisioned concurrency** keeps N environments initialized to remove cold starts and is billed for the time it is configured, whether used or not. Throttling behaves differently by invocation type: **synchronous** callers get `429 TooManyRequestsException` and must retry themselves; **asynchronous** events (S3, SNS, EventBridge) sit in the internal queue and are retried for up to 6 hours before going to a DLQ or on-failure destination.\n\n**Say this out loud:** "Reserved concurrency is a free guarantee and a cap, provisioned concurrency is paid pre-warming, and a throttled sync call is the caller\'s problem while a throttled async event is retried by Lambda."',
  },
  {
    id: 'aws-lambda-timeout-sqs-visibility',
    domain: 'cloud',
    subject: 'aws',
    topic: 'lambda',
    level: 'senior',
    kind: 'single',
    prompt:
      'An SQS queue triggers a Lambda whose timeout is 5 minutes; a typical batch takes about 2 minutes. The queue still has its default 30-second visibility timeout. Orders are occasionally processed **twice**. What is the root cause and the right fix?',
    options: [
      { id: 'a', text: 'Lambda retries every batch by default; set the maximum retry attempts on the event source mapping to 0' },
      { id: 'b', text: 'Messages become visible again after 30 s while the first invocation is still working, so another poller picks them up; set the visibility timeout to at least six times the function timeout and make the handler idempotent' },
      { id: 'c', text: 'Standard queues deliver every message twice by design; switch to a FIFO queue and the duplicates disappear' },
      { id: 'd', text: 'The function timeout is too long; lower it to 30 s so it matches the visibility timeout' },
    ],
    answer: 'b',
    tags: ['lambda', 'sqs', 'timeouts', 'idempotency'],
    source: 'topic-list',
    explanation:
      'The visibility timeout is how long a received message stays hidden. If processing outlasts it, the message reappears and a concurrent invocation receives it again. AWS recommends a queue visibility timeout of **at least 6x the function timeout** (plus any batching window) so retries after throttling still fit. Even then SQS standard is at-least-once, so the handler must be idempotent (for example a conditional write on the order id), and partial batch failures should be reported with `ReportBatchItemFailures` instead of failing the whole batch. FIFO reduces duplicates within a 5-minute deduplication window but does not fix a visibility timeout that is shorter than the work. Lowering the function timeout to 30 s would just kill 2-minute batches. Remember the ceilings: Lambda max timeout is 15 minutes, and API Gateway integrations time out far sooner (29 s default on REST, 30 s max on HTTP APIs).\n\n**Say this out loud:** "Visibility timeout must comfortably exceed processing time, AWS says six times the function timeout, and the consumer must be idempotent anyway because SQS is at-least-once."',
  },
  {
    id: 'aws-api-gateway-rest-vs-http-features',
    domain: 'cloud',
    subject: 'aws',
    topic: 'api-gateway',
    level: 'mid',
    kind: 'multi',
    prompt:
      'You are choosing between an API Gateway **REST API (v1)** and an **HTTP API (v2)**. Which of these requirements force you to use a REST API? Select all that apply.',
    options: [
      { id: 'a', text: 'Per-client API keys with usage plans (quotas and throttling per customer)' },
      { id: 'b', text: 'Validating JWTs from any OIDC issuer (Auth0, Entra ID, Cognito) without writing a Lambda authorizer' },
      { id: 'c', text: 'Response caching at the stage level' },
      { id: 'd', text: 'Attaching an AWS WAF web ACL directly to the API' },
    ],
    answer: ['a', 'c', 'd'],
    tags: ['api-gateway', 'http-api', 'rest-api'],
    source: 'topic-list',
    explanation:
      'HTTP APIs are the cheaper, lower-latency option (roughly $1.00 vs $3.50 per million requests) with a **native JWT authorizer**, simple Lambda proxy and HTTP proxy integrations, and automatic deployments. REST APIs keep the richer feature set: API keys and usage plans, stage caching, direct WAF association, request validation, mapping templates (VTL) for request/response transformation, private endpoints inside a VPC, edge-optimized endpoints and direct integrations with many AWS services. Rule of thumb: start with HTTP API unless you need one of those REST-only features. Validating JWTs from any OIDC issuer is the one HTTP APIs do natively; REST only has a Cognito-specific authorizer, otherwise you write a Lambda authorizer.',
  },
  {
    id: 'aws-api-gateway-throttling-status',
    domain: 'cloud',
    subject: 'aws',
    topic: 'api-gateway',
    level: 'junior',
    kind: 'single',
    prompt:
      'A client exceeds the rate and burst limits configured on an API Gateway stage. What does the client receive, and what should it do?',
    options: [
      { id: 'a', text: '`503 Service Unavailable`; the backend is down, so the client should fail over to another region' },
      { id: 'b', text: '`429 Too Many Requests`; the client should retry with exponential backoff and jitter' },
      { id: 'c', text: '`504 Gateway Timeout`; the client should raise its own timeout' },
      { id: 'd', text: '`403 Forbidden`; the client needs a new API key' },
    ],
    answer: 'b',
    tags: ['api-gateway', 'throttling', 'retries'],
    source: 'topic-list',
    explanation:
      'API Gateway throttles with a **token bucket**: the *rate* is the steady refill in requests per second and the *burst* is the bucket size. Limits apply at several levels: the account per region (10,000 rps steady with a 5,000 burst by default), stage and method settings, and per-client usage plans on REST APIs. Excess requests are rejected with `429` before they reach Lambda, so they cost nothing downstream. Clients should back off exponentially with jitter. `504` means the integration took longer than the integration timeout, a different problem.',
  },
  {
    id: 'aws-api-gateway-authorizer-choice',
    domain: 'cloud',
    subject: 'aws',
    topic: 'api-gateway',
    level: 'senior',
    kind: 'open',
    prompt:
      'Your API is fronted by API Gateway. Users log in through an OIDC provider, and some routes also need a tenant-level permission check that lives in your database. Which authorizer types would you use, and what are the pitfalls of authorizer caching?',
    modelAnswer:
      'For plain token validation I would use the **JWT authorizer** on an HTTP API (or the Cognito user pool authorizer on a REST API): API Gateway validates signature, issuer, audience and expiry, and checks scopes per route, with no code and no extra latency from a Lambda. For the tenant permission I would use a **Lambda authorizer** only where it is needed, returning an IAM policy (REST) or a simple allow/deny response with context (HTTP API), and pass the resolved tenant id to the backend through the authorizer context. Authorizer results are cached by identity source (for example the `Authorization` header) for a TTL of up to one hour. The classic bug is a REST Lambda authorizer that returns a policy only for the **specific** method ARN being called; that policy is cached and the same token is then denied on every other route, so either return a wildcard resource policy or include the route in the cache key. The reverse risk is caching an allow after a permission was revoked, so keep the TTL short for sensitive checks. The backend must still enforce authorization on the data it returns; the gateway check is coarse.',
    rubric: [
      'Picks the built-in JWT or Cognito authorizer for token validation instead of custom code',
      'Uses a Lambda authorizer only for custom logic and passes context to the backend',
      'Explains result caching by identity source and TTL (max one hour)',
      'Names the per-method policy caching bug or the stale-allow-after-revocation risk',
      'States that the backend still enforces fine-grained authorization',
    ],
    tags: ['api-gateway', 'authorizers', 'jwt', 'security'],
    source: 'topic-list',
    explanation:
      'Senior signal: separating authentication (cheap, declarative JWT validation at the edge) from authorization (custom, data-driven), and knowing that cached authorizer responses are the source of confusing intermittent 403s.\n\n**Say this out loud:** "Let the gateway validate the JWT for free, use a Lambda authorizer only for custom rules, and remember the cached policy is keyed by the token, so a policy scoped to one method will deny the next route."',
  },
  {
    id: 'aws-s3-strong-consistency',
    domain: 'cloud',
    subject: 'aws',
    topic: 's3',
    level: 'junior',
    kind: 'single',
    prompt:
      'A service overwrites `reports/latest.json` in S3 with a successful `PutObject`, and immediately afterwards another service issues a `GetObject` for the same key. What does the reader get?',
    options: [
      { id: 'a', text: 'Possibly the old version for a few seconds, because overwrites are eventually consistent' },
      { id: 'b', text: 'The new version: S3 has strong read-after-write consistency for PUTs (including overwrites) and DELETEs, and LIST reflects them too' },
      { id: 'c', text: 'A `409 Conflict` until replication across Availability Zones finishes' },
      { id: 'd', text: 'The new version only if versioning is enabled on the bucket' },
    ],
    answer: 'b',
    tags: ['s3', 'consistency'],
    source: 'topic-list',
    explanation:
      'Since December 2020 every S3 read after a successful write returns the latest data, for new objects, overwrites, deletes and list operations, at no extra cost. The "eventually consistent overwrites" answer describes the old model that many blog posts still repeat. Strong consistency does not mean locking: two concurrent writers still produce last-writer-wins. For optimistic concurrency use **conditional writes** (`If-None-Match: *` to create only if absent, `If-Match` with an ETag to update only the version you read).',
  },
  {
    id: 'aws-s3-static-spa-hosting',
    domain: 'cloud',
    subject: 'aws',
    topic: 's3',
    level: 'mid',
    kind: 'multi',
    prompt:
      'You deploy a React single-page app to S3 and serve it on `https://app.example.com`. Which statements are true? Select all that apply.',
    options: [
      { id: 'a', text: 'The S3 **website endpoint** serves HTTP only, so HTTPS on a custom domain requires CloudFront (or another CDN) in front' },
      { id: 'b', text: 'With CloudFront and **Origin Access Control** pointing at the bucket REST endpoint, the bucket can stay private with Block Public Access on' },
      { id: 'c', text: 'Deep links such as `/orders/42` work automatically, because S3 falls back to `index.html` for unknown keys' },
      { id: 'd', text: 'Turning on static website hosting makes every object in the bucket publicly readable' },
    ],
    answer: ['a', 'b'],
    tags: ['s3', 'cloudfront', 'static-hosting', 'spa'],
    source: 'topic-list',
    explanation:
      'The modern setup is a **private** bucket, CloudFront with OAC (the successor to Origin Access Identity), and a bucket policy that allows `s3:GetObject` only for the `cloudfront.amazonaws.com` service principal with `aws:SourceArn` set to your distribution. You then do not need the website endpoint at all. Client-side routes do not exist as objects, so S3 returns 403/404; you fix it with a CloudFront custom error response (403 and 404 to `/index.html` with status 200) or a CloudFront Function rewrite. Website hosting only changes how the bucket is served; objects become public only if you also disable Block Public Access and add a public-read policy. Deploys should upload hashed assets with long `Cache-Control` and `index.html` with `no-cache`, then invalidate `/index.html`.',
  },
  {
    id: 'aws-s3-presigned-url-behavior',
    domain: 'cloud',
    subject: 'aws',
    topic: 's3',
    level: 'senior',
    kind: 'multi',
    prompt:
      'A Lambda generates presigned URLs so browsers can upload avatars straight to S3. Which statements are true? Select all that apply.',
    options: [
      { id: 'a', text: 'The URL carries the permissions of the credentials that signed it, evaluated when it is used; if the signer loses `s3:PutObject`, the URL stops working' },
      { id: 'b', text: 'A URL signed with the Lambda role\'s temporary credentials stops working when that session expires, even if `X-Amz-Expires` is longer' },
      { id: 'c', text: 'A presigned PUT URL is the right tool to enforce an upload size range such as 0 to 5 MB' },
      { id: 'd', text: 'A SigV4 presigned URL signed by an IAM user can stay valid for up to 30 days' },
    ],
    answer: ['a', 'b'],
    tags: ['s3', 'presigned-urls', 'security', 'uploads'],
    source: 'topic-list',
    explanation:
      'A presigned URL is a bearer token: anyone holding it can perform exactly that operation on exactly that key until it expires, with the signer\'s permissions. Maximum validity with SigV4 is **7 days**, and with temporary credentials (Lambda roles, STS) it ends when the credentials do, often within hours. A presigned PUT cannot express a size *range*; use a **presigned POST** with a policy containing `content-length-range` (and a key prefix and `Content-Type` condition), or sign an exact `Content-Length`. Keep expiries short, generate a server-side key (never trust the client file name), and process the upload asynchronously from an S3 event.\n\n**Say this out loud:** "A presigned URL is a short-lived bearer credential with the signer\'s rights; for uploads I use presigned POST so the policy can cap size and content type."',
  },
  {
    id: 'aws-s3-event-parse-records',
    domain: 'cloud',
    subject: 'aws',
    topic: 's3-event-notifications',
    level: 'mid',
    kind: 'code',
    language: 'typescript',
    prompt:
      'A Lambda receives S3 event notifications. Implement `solution(event)` that returns `[{ bucket, key }]` for every record whose `eventName` starts with `ObjectCreated:`, in record order. Object keys arrive **URL-encoded**, with spaces encoded as `+` (and sometimes `%20`), so decode them into the real key. Ignore other event types and return `[]` when `Records` is missing.',
    starter: `type S3Record = {
  eventName: string;
  s3: { bucket: { name: string }; object: { key: string; size?: number } };
};
type S3Event = { Records?: S3Record[] };

export function solution(event: S3Event): { bucket: string; key: string }[] {
  return [];
}`,
    tests: [
      {
        name: 'single put',
        args: [{ Records: [{ eventName: 'ObjectCreated:Put', s3: { bucket: { name: 'uploads' }, object: { key: 'avatars/42.png', size: 10 } } }] }],
        expected: [{ bucket: 'uploads', key: 'avatars/42.png' }],
      },
      {
        name: 'plus becomes a space',
        args: [{ Records: [{ eventName: 'ObjectCreated:Put', s3: { bucket: { name: 'uploads' }, object: { key: 'invoices/March+2026.pdf' } } }] }],
        expected: [{ bucket: 'uploads', key: 'invoices/March 2026.pdf' }],
      },
      {
        name: 'percent-encoded space, literal plus and unicode',
        args: [{ Records: [{ eventName: 'ObjectCreated:CompleteMultipartUpload', s3: { bucket: { name: 'media' }, object: { key: 'caf%C3%A9%20menu%2Bv2.jpg' } } }] }],
        expected: [{ bucket: 'media', key: 'café menu+v2.jpg' }],
      },
      {
        name: 'skips removals and keeps order',
        args: [
          {
            Records: [
              { eventName: 'ObjectCreated:Copy', s3: { bucket: { name: 'a' }, object: { key: 'one.txt' } } },
              { eventName: 'ObjectRemoved:Delete', s3: { bucket: { name: 'a' }, object: { key: 'two.txt' } } },
              { eventName: 'ObjectCreated:Post', s3: { bucket: { name: 'b' }, object: { key: 'dir/three+four.txt' } } },
            ],
          },
        ],
        expected: [
          { bucket: 'a', key: 'one.txt' },
          { bucket: 'b', key: 'dir/three four.txt' },
        ],
      },
      { name: 'missing Records', args: [{}], expected: [] },
    ],
    solution: `type S3Record = {
  eventName: string;
  s3: { bucket: { name: string }; object: { key: string; size?: number } };
};
type S3Event = { Records?: S3Record[] };

function decodeKey(raw: string): string {
  // '+' means space in S3 event keys; a real '+' arrives as %2B, so replace before decoding
  return decodeURIComponent(raw.replace(/\\+/g, ' '));
}

export function solution(event: S3Event): { bucket: string; key: string }[] {
  return (event.Records ?? [])
    .filter((record) => record.eventName.startsWith('ObjectCreated:'))
    .map((record) => ({ bucket: record.s3.bucket.name, key: decodeKey(record.s3.object.key) }));
}`,
    tags: ['s3', 'lambda', 'events', 'url-encoding'],
    source: 'topic-list',
    explanation:
      'S3 encodes object keys in notifications like an HTML form: spaces become `+` and everything else is percent-encoded, so a literal `+` arrives as `%2B`. The order matters: replace `+` with a space **first**, then `decodeURIComponent`; decoding first would turn `%2B` into `+` and then wrongly into a space. Forgetting this is a classic production bug: `GetObject` on the raw key returns `NoSuchKey` only for files with spaces or accents. Also filter on `eventName` (or configure the notification for `s3:ObjectCreated:*` only), and remember one invocation can carry several records.',
  },
  {
    id: 'aws-s3-event-delivery-semantics',
    domain: 'cloud',
    subject: 'aws',
    topic: 's3-event-notifications',
    level: 'senior',
    kind: 'multi',
    prompt:
      'You build an image pipeline on S3 event notifications. Which statements are true? Select all that apply.',
    options: [
      { id: 'a', text: 'Notifications are delivered at least once, so the consumer must tolerate duplicates' },
      { id: 'b', text: 'Events for the same key always arrive in the order the writes happened' },
      { id: 'c', text: 'A Lambda triggered by `ObjectCreated` on `uploads/` that writes its thumbnail back under `uploads/` can trigger itself in a loop' },
      { id: 'd', text: 'You can add two notification configurations with overlapping prefixes for the same event type, each pointing at a different Lambda' },
    ],
    answer: ['a', 'c'],
    tags: ['s3', 'events', 'idempotency', 'lambda'],
    source: 'topic-list',
    explanation:
      'S3 notifications are **at-least-once** and usually arrive within seconds, but can take longer and can be duplicated. Ordering is not guaranteed; each record carries a `sequencer` value you can compare (as a hex string of equal length) to discard stale events for the same key. Writing output to the prefix that triggers the function creates a recursive loop that scales and bills fast; write to a different prefix or bucket and filter by prefix/suffix. S3 rejects overlapping prefix/suffix filters for the same event type, so to fan out to several consumers either publish to one SNS topic (and subscribe several queues) or enable **EventBridge** on the bucket and use rules, which also gives you content filtering, archive and replay.\n\n**Say this out loud:** "S3 events are at-least-once and unordered, so I make consumers idempotent, use the sequencer for ordering, never write back to the triggering prefix, and use SNS or EventBridge when more than one consumer needs the same event."',
  },
  {
    id: 'aws-sns-fan-out-vs-sqs',
    domain: 'cloud',
    subject: 'aws',
    topic: 'sns',
    level: 'junior',
    kind: 'single',
    prompt:
      'When an order is placed, the email, billing and analytics services must **each** receive every order event, and any of them may be down for an hour without losing messages. Which design fits?',
    options: [
      { id: 'a', text: 'One SQS queue that all three services poll' },
      { id: 'b', text: 'One SNS topic with three SQS queues subscribed, one per service' },
      { id: 'c', text: 'One SNS topic with each service subscribed directly over HTTPS' },
      { id: 'd', text: 'Three SNS topics that each service polls when it comes back up' },
    ],
    answer: 'b',
    tags: ['sns', 'sqs', 'fan-out', 'messaging'],
    source: 'topic-list',
    explanation:
      '**SNS** is push-based pub/sub: one publish is copied to every subscription, but SNS does not store messages for later reading. **SQS** is a pull-based queue with retention (up to 14 days); consumers of one queue *compete*, so each message goes to only one of them (the single shared queue gives each order to one service, not all three). The fan-out pattern combines them: SNS copies the event, each SQS queue buffers it for its own service, and each service scales and fails independently. Direct HTTPS subscriptions have limited retries, so a service down for an hour loses events. Topics cannot be polled at all.',
  },
  {
    id: 'aws-s3-to-sns-required-wiring',
    domain: 'cloud',
    subject: 'aws',
    topic: 's3-to-sns',
    level: 'senior',
    kind: 'multi',
    prompt:
      'You call `PutBucketNotificationConfiguration` to publish `s3:ObjectCreated:*` from bucket `my-uploads` to SNS topic `uploads`, and it fails with *"Unable to validate the following destination configurations"*. Which of these are actually required for the wiring to work? Select all that apply.',
    options: [
      { id: 'a', text: 'A statement in the **SNS topic access policy** allowing principal `s3.amazonaws.com` to `sns:Publish`, scoped with `aws:SourceArn` = the bucket ARN and `aws:SourceAccount`' },
      { id: 'b', text: 'A **bucket policy** granting `sns.amazonaws.com` permission to `s3:GetObject` so SNS can read the new objects' },
      { id: 'c', text: 'If the topic uses SSE-KMS, a customer managed key whose key policy lets `s3.amazonaws.com` call `kms:GenerateDataKey*` and `kms:Decrypt`' },
      { id: 'd', text: 'An IAM role that S3 assumes to publish, referenced by ARN in the notification configuration' },
    ],
    answer: ['a', 'c'],
    tags: ['s3', 'sns', 'iam', 'resource-policy', 'kms'],
    source: 'topic-list',
    explanation:
      'S3 publishes as a **service principal** governed by the destination\'s resource policy; there is no role to assume and no bucket policy involved (the bucket policy controls access *to* the bucket, and SNS never reads objects). When you save the configuration, S3 sends a test event, and it fails with that validation error if the topic policy does not allow it. The topic policy statement looks like:\n\n```json\n{\n  "Effect": "Allow",\n  "Principal": { "Service": "s3.amazonaws.com" },\n  "Action": "SNS:Publish",\n  "Resource": "arn:aws:sns:us-east-1:111122223333:uploads",\n  "Condition": {\n    "ArnLike": { "aws:SourceArn": "arn:aws:s3:::my-uploads" },\n    "StringEquals": { "aws:SourceAccount": "111122223333" }\n  }\n}\n```\n\nThe conditions prevent the confused-deputy problem (someone else\'s bucket publishing to your topic). An encrypted topic needs a **customer managed** KMS key, because the AWS managed `aws/sns` key policy cannot be edited to admit S3. The topic must be a standard topic (FIFO topics are not supported as S3 destinations) in the same region as the bucket. Downstream, each SQS queue subscribed to the topic needs its own queue policy allowing `sns.amazonaws.com` with `aws:SourceArn` = the topic ARN, and **raw message delivery** saves consumers from unwrapping the SNS envelope around the S3 event JSON.\n\n**Say this out loud:** "S3 to SNS is resource-policy wiring: the topic policy lets the S3 service principal publish, scoped by SourceArn and SourceAccount, plus a customer managed KMS key policy if the topic is encrypted; no bucket policy and no role."',
  },
  {
    id: 'aws-ecs-task-role-vs-execution-role',
    domain: 'cloud',
    subject: 'aws',
    topic: 'ecs',
    level: 'mid',
    kind: 'single',
    prompt:
      'An ECS service runs a Node.js API. Its task definition pulls an image from private ECR, reads a DB password from Secrets Manager via the `secrets` field, ships logs to CloudWatch, and the **application code** writes to DynamoDB with the AWS SDK. Where should `dynamodb:PutItem` be granted?',
    options: [
      { id: 'a', text: 'On the **task execution role**, because it already has the ECR and CloudWatch permissions' },
      { id: 'b', text: 'On the **task role**, which the SDK inside the container picks up automatically from the container credentials endpoint' },
      { id: 'c', text: 'On the EC2 container instance profile, so every task on the host can use it' },
      { id: 'd', text: 'On an IAM user whose access keys are injected as environment variables' },
    ],
    answer: 'b',
    tags: ['ecs', 'iam', 'least-privilege'],
    source: 'topic-list',
    explanation:
      'ECS has two roles with different consumers. The **task execution role** is used by the ECS agent / Fargate *before and around* your code: pulling from ECR, fetching `secrets` from Secrets Manager or SSM to inject as env vars, and writing logs. The **task role** is assumed by your application; the SDK finds its credentials through `AWS_CONTAINER_CREDENTIALS_RELATIVE_URI`. Mixing them either breaks startup (`CannotPullContainerError`, secrets errors) or over-privileges. The instance profile works only on the EC2 launch type and leaks the permission to every task on the host; long-lived access keys are never the answer. Vocabulary check: a *task definition* is the versioned blueprint, a *task* is a running instance of it, a *service* keeps N tasks running behind a load balancer, and a *cluster* is the logical grouping of capacity.',
  },
  {
    id: 'aws-fargate-vs-ec2-launch-type',
    domain: 'cloud',
    subject: 'aws',
    topic: 'fargate',
    level: 'senior',
    kind: 'open',
    prompt:
      'You are moving a set of containerized services to ECS. How do you decide between the **Fargate** and **EC2** launch types (or capacity providers)? Give concrete criteria.',
    modelAnswer:
      '**Fargate** is serverless compute for containers: you declare CPU and memory per task and AWS runs it in an isolated micro-VM, so there are no instances to patch, scale or bin-pack, and each task gets its own ENI (`awsvpc` networking). It is my default for most web services and workers because it removes a whole operational layer and scales per task. **EC2** makes sense when I need things Fargate does not give me: GPUs, specific instance families, very large tasks, host-level access or daemons, or when steady high utilization makes bin-packing Reserved or Savings-Plan instances meaningfully cheaper. The trade-off on EC2 is owning AMI patching, cluster auto scaling through capacity providers, and instance draining during deploys. Fargate costs more per vCPU-hour and has slower task start (image pull every time, no warm host cache), but Fargate Spot and Graviton (ARM) close much of the gap for interruptible or ARM-ready workloads. A common mix is Fargate for services and a capacity provider strategy that adds Spot for batch.',
    rubric: [
      'Explains Fargate removes instance management (patching, scaling, bin-packing) with per-task isolation',
      'Names concrete EC2-only needs such as GPUs, host access, daemons or specific instance types',
      'Compares cost: Fargate premium versus bin-packed EC2 at steady high utilization',
      'Mentions Fargate Spot, Graviton or capacity providers as levers',
      'Notes operational cost of EC2 (AMI patching, draining, cluster autoscaling)',
    ],
    tags: ['ecs', 'fargate', 'ec2', 'cost'],
    source: 'topic-list',
    explanation:
      'Senior signal: framing it as "who owns the hosts" plus a cost-at-utilization argument, not "Fargate is serverless so it is better".\n\n**Say this out loud:** "Fargate by default because it deletes host operations; EC2 only when I need GPUs or host-level control, or when steady utilization makes bin-packed reserved capacity clearly cheaper."',
  },
  {
    id: 'aws-cognito-user-pool-vs-identity-pool',
    domain: 'cloud',
    subject: 'aws',
    topic: 'cognito',
    level: 'mid',
    kind: 'single',
    prompt:
      'A mobile app signs users in with email and password, then uploads photos **directly to S3**, each user limited to their own `users/<id>/` prefix. Which Cognito setup is correct?',
    options: [
      { id: 'a', text: 'A user pool alone: its ID token is accepted by S3 as a credential' },
      { id: 'b', text: 'A user pool to authenticate and issue JWTs, plus an identity pool that exchanges the token for temporary AWS credentials from an IAM role scoped with the `${cognito-identity.amazonaws.com:sub}` policy variable' },
      { id: 'c', text: 'An identity pool alone: it stores the users and passwords and issues JWTs' },
      { id: 'd', text: 'A user pool plus an API Gateway Cognito authorizer, which grants the app S3 permissions' },
    ],
    answer: 'b',
    tags: ['cognito', 'iam', 'authentication', 's3'],
    source: 'topic-list',
    explanation:
      '**User pools** are the user directory and OIDC identity provider: sign-up, sign-in, MFA, federation with social or SAML providers, and they issue ID, access and refresh tokens (JWTs) for *your* APIs. **Identity pools** (federated identities) do not store users; they take a token from a user pool or another provider and call STS to hand out **temporary AWS credentials** for an IAM role, so the client can call AWS services directly. Policy variables such as `${cognito-identity.amazonaws.com:sub}` in the role policy restrict each identity to its own prefix. AWS services never accept a user pool JWT directly, and an API Gateway authorizer only protects your API routes. Often the simpler alternative is to skip identity pools and have your API return presigned URLs.',
  },
];
