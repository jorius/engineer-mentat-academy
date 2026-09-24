// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  {
    id: 'iac-iaas-vs-iac-definitions',
    domain: 'cloud',
    subject: 'iac',
    topic: 'iaas-vs-iac',
    level: 'junior',
    kind: 'single',
    prompt: 'Which statement correctly distinguishes **IaaS** from **IaC**?',
    options: [
      { id: 'a', text: 'They are the same thing: IaC is the newer name for IaaS' },
      { id: 'b', text: 'IaaS is a cloud service model where you rent compute, storage and networking (EC2, VPC, EBS); IaC is the practice of defining that infrastructure in versioned, reviewable code (Terraform, CloudFormation)' },
      { id: 'c', text: 'IaaS is for virtual machines and IaC is for containers' },
      { id: 'd', text: 'IaC is a provider offering, like IaaS or PaaS, where the provider writes the infrastructure code for you' },
    ],
    answer: 'b',
    tags: ['iac', 'iaas', 'fundamentals'],
    source: 'topic-list',
    explanation:
      '**IaaS / PaaS / SaaS** describe *what* you buy from a provider and how much of the stack you manage. **IaC** describes *how* you manage infrastructure of any kind: declarative files in Git, reviewed in pull requests, applied by automation, so environments are reproducible and changes are auditable instead of hand-clicked in a console. You can use IaC to manage IaaS resources, PaaS services, DNS, SaaS configuration (GitHub, Datadog) and more.',
    hint:
      'One term describes what you buy from a provider, the other how you manage infrastructure; match each to its category.',
  },
  {
    id: 'iac-terraform-saved-plan-apply',
    domain: 'cloud',
    subject: 'iac',
    topic: 'terraform',
    level: 'junior',
    kind: 'single',
    prompt:
      'Why does a CI pipeline run `terraform plan -out=tfplan`, have a human review it, and then run `terraform apply tfplan`, instead of running `terraform apply` later?',
    options: [
      { id: 'a', text: '`apply tfplan` executes exactly the reviewed set of changes, and refuses to run if the state changed since the plan was made' },
      { id: 'b', text: '`plan` creates the resources in a sandbox account and `apply` promotes them to production' },
      { id: 'c', text: 'A plain `terraform apply` skips refreshing state, so it can miss drift' },
      { id: 'd', text: 'The plan file is a readable summary meant to be committed to Git for audit' },
    ],
    answer: 'a',
    tags: ['terraform', 'plan', 'ci'],
    source: 'topic-list',
    explanation:
      '`terraform plan` refreshes state, compares it with your configuration and proposes create, update, replace or destroy actions without changing anything. A bare `terraform apply` computes a **new** plan at apply time, which may differ from what was reviewed if code, state or real infrastructure changed in between. A saved plan pins the reviewed actions, and Terraform rejects it as stale if state moved on. Plan files can contain sensitive values in plain text, so treat them as secret build artifacts, not commits; render them for review with `terraform show`.',
    hint:
      'Think about what a saved plan file guarantees about the changes that get applied, and what should happen if the world moved between review and apply.',
  },
  {
    id: 'iac-terraform-remote-state-locking',
    domain: 'cloud',
    subject: 'iac',
    topic: 'terraform',
    level: 'mid',
    kind: 'single',
    prompt:
      'A team keeps `terraform.tfstate` locally and commits it to Git. Twice this month two engineers applied at the same time and the state got corrupted. What is the standard fix?',
    options: [
      { id: 'a', text: 'Run `terraform refresh` before every apply so everyone starts from the same state' },
      { id: 'b', text: 'Give each engineer their own `terraform workspace` so they never share a state file' },
      { id: 'c', text: 'Move state to a remote backend with locking, such as S3 with native lockfiles (`use_lockfile = true`) or HCP Terraform, with encryption and versioning, and apply only from CI' },
      { id: 'd', text: 'Keep committing state, but require a pull request review for every change to `terraform.tfstate`' },
    ],
    answer: 'c',
    tags: ['terraform', 'state', 'locking', 'security'],
    source: 'topic-list',
    explanation:
      'State maps your resource addresses to real resource IDs and stores their attributes, so Terraform knows what it owns and what to change. It must be **shared** (everyone sees the latest), **locked** (one writer at a time) and **protected** (it contains secrets in plain text, such as generated passwords). A remote backend gives all three. For S3, Terraform 1.11+ supports native locking with a `.tflock` object in the bucket (experimental in 1.10); the older DynamoDB lock table is deprecated since 1.11. Enable bucket versioning to recover from a bad write. Workspaces with the same backend just create separate states for the same config; they do not solve concurrent applies to one environment.',
    hint:
      'The root problem is two writers on one shared file with no mutual exclusion; ask which change actually adds a lock and keeps state out of Git.',
  },
  {
    id: 'iac-terraform-module-practices',
    domain: 'cloud',
    subject: 'iac',
    topic: 'terraform',
    level: 'mid',
    kind: 'multi',
    prompt: 'Which are sound practices for reusable Terraform modules? Select all that apply.',
    options: [
      { id: 'a', text: 'Pin module versions (`version = "~> 5.0"` for registry modules, `?ref=v1.4.0` for Git sources)' },
      { id: 'b', text: 'Expose what callers need through `output` values and take inputs through typed `variable` blocks with validation' },
      { id: 'c', text: 'Declare `provider` blocks inside each child module so the module is self-contained' },
      { id: 'd', text: 'Wrap the whole production environment in one module so every change is a single apply' },
    ],
    answer: ['a', 'b'],
    tags: ['terraform', 'modules', 'versioning'],
    source: 'topic-list',
    explanation:
      'A module is a function: typed inputs, outputs, and no hidden global configuration. Version pinning keeps a module change from silently rolling into every environment. Provider configuration belongs in the **root** module and is passed down (implicitly, or with `providers = { aws = aws.us_east_1 }`); a child module with its own `provider` block cannot be used with `count`, `for_each` or `depends_on`, and removing it later orphans resources. One giant root means huge plans, slow applies, and a large blast radius; split state by lifecycle and ownership (network, data, services) and connect them through outputs or data sources.',
    hint:
      'Think about what makes a module safe to reuse across callers: versioning, a clear typed interface, and who should configure providers.',
  },
  {
    id: 'iac-terraform-plan-diff',
    domain: 'cloud',
    subject: 'iac',
    topic: 'terraform',
    level: 'mid',
    kind: 'code',
    language: 'typescript',
    prompt:
      'Model what `terraform plan` does. Implement `solution(desired, current, forceNew)` where `desired` (your configuration) and `current` (refreshed state) map resource addresses to flat attribute objects, and `forceNew` lists attribute names whose change requires replacement. Return a `Plan` in which every array lists its addresses in **sorted** order:\n\n```ts\ntype Plan = {\n  create: string[];\n  update: string[];\n  replace: string[];\n  destroy: string[];\n};\n```\n\n- `create`: in `desired` only.\n- `destroy`: in `current` only.\n- For addresses in both, compare the union of attribute keys with `!==` (a key missing on one side counts as a change). No change: omit. Any changed key in `forceNew`: `replace`. Otherwise: `update`.',
    starter: `type Attrs = Record<string, string | number | boolean>;
type Plan = { create: string[]; update: string[]; replace: string[]; destroy: string[] };

export function solution(desired: Record<string, Attrs>, current: Record<string, Attrs>, forceNew: string[]): Plan {
  return { create: [], update: [], replace: [], destroy: [] };
}`,
    tests: [
      {
        name: 'no changes',
        args: [{ 'aws_s3_bucket.logs': { bucket: 'logs' } }, { 'aws_s3_bucket.logs': { bucket: 'logs' } }, ['bucket']],
        expected: { create: [], update: [], replace: [], destroy: [] },
      },
      {
        name: 'new resource is created',
        args: [{ 'aws_sqs_queue.jobs': { name: 'jobs' } }, {}, []],
        expected: { create: ['aws_sqs_queue.jobs'], update: [], replace: [], destroy: [] },
      },
      {
        name: 'removed resource is destroyed',
        args: [{}, { 'aws_sqs_queue.old': { name: 'old' } }, []],
        expected: { create: [], update: [], replace: [], destroy: ['aws_sqs_queue.old'] },
      },
      {
        name: 'in-place tag change',
        args: [{ 'aws_instance.web': { ami: 'ami-1', tag_env: 'prod' } }, { 'aws_instance.web': { ami: 'ami-1', tag_env: 'staging' } }, ['ami']],
        expected: { create: [], update: ['aws_instance.web'], replace: [], destroy: [] },
      },
      {
        name: 'ami change forces replacement',
        args: [{ 'aws_instance.web': { ami: 'ami-2', tag_env: 'prod' } }, { 'aws_instance.web': { ami: 'ami-1', tag_env: 'staging' } }, ['ami']],
        expected: { create: [], update: [], replace: ['aws_instance.web'], destroy: [] },
      },
      {
        name: 'attribute removed from config is an update, and results are sorted',
        args: [
          { 'b.two': { size: 20 }, 'a.one': { size: 10 }, 'c.new': { size: 1 } },
          { 'a.one': { size: 10, encrypted: true }, 'b.two': { size: 10 }, 'z.gone': { size: 5 }, 'd.gone': { size: 5 } },
          ['engine'],
        ],
        expected: { create: ['c.new'], update: ['a.one', 'b.two'], replace: [], destroy: ['d.gone', 'z.gone'] },
      },
    ],
    solution: `type Attrs = Record<string, string | number | boolean>;
type Plan = { create: string[]; update: string[]; replace: string[]; destroy: string[] };

function changedKeys(a: Attrs, b: Attrs): string[] {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].filter((key) => a[key] !== b[key]);
}

export function solution(desired: Record<string, Attrs>, current: Record<string, Attrs>, forceNew: string[]): Plan {
  const plan: Plan = { create: [], update: [], replace: [], destroy: [] };
  for (const address of Object.keys(desired)) {
    if (!(address in current)) {
      plan.create.push(address);
      continue;
    }
    const changed = changedKeys(desired[address], current[address]);
    if (changed.length === 0) continue;
    if (changed.some((key) => forceNew.includes(key))) plan.replace.push(address);
    else plan.update.push(address);
  }
  for (const address of Object.keys(current)) {
    if (!(address in desired)) plan.destroy.push(address);
  }
  plan.create.sort();
  plan.update.sort();
  plan.replace.sort();
  plan.destroy.sort();
  return plan;
}`,
    tags: ['terraform', 'plan', 'drift', 'replacement'],
    source: 'topic-list',
    explanation:
      'This is the core of every declarative IaC tool: diff desired configuration against refreshed reality. The interesting case is **replace**: some attributes cannot change in place (an EC2 `ami`, an RDS `engine`, a bucket name), so the provider marks them `ForceNew` and the plan shows `-/+ must be replaced`. In production that is where incidents come from, so reviewers look for replacements first. Mitigations are `lifecycle { create_before_destroy = true }` to avoid downtime, `prevent_destroy = true` on stateful resources, and `moved` blocks when you only renamed an address (otherwise a rename looks like destroy plus create).',
    hint:
      'Walk the keys of both maps; for shared addresses compare the union of attribute names, check whether any changed one is in `forceNew`, and sort each list at the end.',
  },
  {
    id: 'iac-terraform-drift-handling',
    domain: 'cloud',
    subject: 'iac',
    topic: 'terraform',
    level: 'senior',
    kind: 'single',
    prompt:
      'During an incident someone opened port 5432 on a Terraform-managed security group through the AWS console. The group\'s rules are declared as inline `ingress` blocks inside its `aws_security_group` resource, not as separate `aws_security_group_rule` or `aws_vpc_security_group_ingress_rule` resources. What does the next `terraform plan` do, and what is the right way to handle it?',
    options: [
      { id: 'a', text: 'Nothing: Terraform only compares configuration with the state file, which still holds the old rules, so the extra rule stays until someone runs `terraform refresh`' },
      { id: 'b', text: 'Plan refreshes the group, shows the extra rule as drift and proposes removing it; the team either codifies the rule in HCL or lets apply remove it' },
      { id: 'c', text: 'Run `terraform import` on the new rule; that alone makes Terraform adopt it, with no change to the configuration needed' },
      { id: 'd', text: 'Terraform rewrites the `.tf` files to include the console change on the next plan, so the pull request shows it for review' },
    ],
    answer: 'b',
    tags: ['terraform', 'drift', 'operations'],
    source: 'topic-list',
    explanation:
      'By default `plan` refreshes managed resources from the provider API, so out-of-band edits show up as changes that apply would **revert** to match the code. That is the point of IaC: code is the source of truth. The decision is organizational: keep the change by adding it to HCL (reviewed, then plan shows no diff) or let apply remove it. `plan -refresh-only` / `apply -refresh-only` shows or accepts drift into state without touching infrastructure. For attributes legitimately managed elsewhere (an autoscaler\'s desired count), use `lifecycle { ignore_changes = [...] }`. Caveats: plan sees this rule only because the rules are inline, so the whole rule set is an attribute Terraform manages. With separate `aws_vpc_security_group_ingress_rule` resources, the console rule would be a new object Terraform never created and plan would show nothing, because drift is only detected on what Terraform manages. Mixing inline rules with separate rule resources causes endless flapping. Scheduled drift-detection plans in CI catch this early.\n\n**Say this out loud:** "Plan refreshes, so console changes show up as drift that apply would revert; we either codify the change or let Terraform put it back, and we run scheduled drift detection so this is not a surprise."',
    hint:
      'Remember what `plan` does with real infrastructure by default before diffing, and that inline rules make the resource own the full rule set.',
  },
  {
    id: 'iac-cloudformation-stacks-change-sets',
    domain: 'cloud',
    subject: 'iac',
    topic: 'cloudformation',
    level: 'senior',
    kind: 'multi',
    prompt: 'Which statements about CloudFormation stacks and change sets are true? Select all that apply.',
    options: [
      { id: 'a', text: 'A change set previews which resources will be added, modified or removed, and whether each modification requires replacement (`True`, `False` or `Conditional`), before you execute it' },
      { id: 'b', text: 'A failed stack update rolls back automatically by default; if the rollback itself fails, the stack sits in `UPDATE_ROLLBACK_FAILED` until you continue the rollback, possibly skipping resources' },
      { id: 'c', text: 'CloudFormation continuously detects drift and reverts console changes on the next update' },
      { id: 'd', text: 'CloudFormation keeps no record of what it deployed, so, unlike Terraform, it cannot know which resources a stack owns' },
    ],
    answer: ['a', 'b'],
    tags: ['cloudformation', 'change-sets', 'rollback', 'drift'],
    source: 'topic-list',
    explanation:
      'A **stack** is the unit of deployment: CloudFormation tracks its resources server-side (the equivalent of Terraform state, managed for you) and applies updates transactionally, rolling back on failure. **Change sets** are CloudFormation\'s `plan`; the `Replacement` column is what you check before touching databases. Drift detection is **on demand** and only reports. Reverting is opt-in: a drift-aware change set (`--deployment-mode REVERT_DRIFT`, available since November 2025) compares the template with the actual resource state and puts drifted properties back, while a standard change set compares only the old and new templates and ignores drift. Protect stateful resources with `DeletionPolicy: Retain` or `Snapshot` and `UpdateReplacePolicy`, add stack policies to block updates to critical resources, and turn on termination protection for production stacks.\n\n**Say this out loud:** "I always deploy through a change set and read the Replacement column, and I put Retain or Snapshot deletion policies on anything stateful, because a rollback cannot bring back deleted data."',
    hint:
      'Recall what a change set previews, the default behavior on a failed update, and how CloudFormation tracks the resources a stack owns and detects drift.',
  },
  {
    id: 'iac-terraform-vs-cloudformation-choice',
    domain: 'cloud',
    subject: 'iac',
    topic: 'cloudformation',
    level: 'senior',
    kind: 'open',
    prompt:
      'A new team asks whether to standardize on **Terraform** or **CloudFormation** (possibly via CDK) for their AWS platform. How do you decide?',
    modelAnswer:
      'I start from scope: if everything lives in AWS and the team wants AWS to own the state and rollback, **CloudFormation** is a solid choice; state is managed server-side, updates roll back automatically, new AWS features and StackSets for multi-account rollout are first-party, and CDK lets developers write it in TypeScript. If the platform spans more than AWS, such as DNS on Cloudflare, GitHub, Datadog, Kubernetes or another cloud, **Terraform** (or OpenTofu) gives one language and one workflow across providers, a large module ecosystem, and a `plan` that many engineers find clearer than change sets. The costs are different: Terraform means owning remote state, locking and secret handling in state, and it does not roll back a half-applied change; CloudFormation has resource limits per stack, slower feedback, and occasional stuck states such as `UPDATE_ROLLBACK_FAILED`. Hiring and existing skills matter as much as features. Whatever I pick, the practices are the same: code review on plans or change sets, applies only from CI, split state by blast radius, and drift detection.',
    rubric: [
      'Frames the decision around scope: AWS-only versus multi-provider',
      'Names CloudFormation strengths: managed state, automatic rollback, StackSets or CDK',
      'Names Terraform strengths: multi-provider, ecosystem, plan workflow',
      'States the operational costs of each (state and locking versus stack limits and stuck rollbacks)',
      'Mentions team skills and common practices (CI-only applies, review of plans or change sets)',
    ],
    tags: ['terraform', 'cloudformation', 'cdk', 'trade-offs'],
    source: 'topic-list',
    explanation:
      'Senior signal: no tool tribalism; the answer names who owns state, how failure and rollback behave, and what the organization already runs.\n\n**Say this out loud:** "AWS-only and want AWS to own state and rollback: CloudFormation or CDK. Multiple providers and one workflow for all of it: Terraform, accepting that we own the state backend."',
    hint:
      'Start from scope (AWS only or several providers), then weigh who manages state and rollback, the module ecosystem, CDK or HCL, and the team\'s skills.',
  },
];
