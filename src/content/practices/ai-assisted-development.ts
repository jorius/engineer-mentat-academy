// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  {
    id: 'ai-assisted-development-tooling-responsible-use',
    domain: 'practices',
    subject: 'ai-assisted-development',
    topic: 'tooling',
    level: 'senior',
    kind: 'open',
    prompt:
      'Your team has adopted AI coding assistants (Copilot, Claude Code, Cursor). As a senior engineer, **how do you use them on a production codebase, and what rules would you set for the team?**',
    modelAnswer:
      'I treat the assistant as a fast junior pair: useful for boilerplate, exploring an unfamiliar codebase, drafting tests and refactors, but everything it produces is my code once I commit it, so it gets the same review as a colleague\'s pull request. Tests are the contract: I write or at least review the failing tests from the requirements first, then let the tool implement against them, so the tests are not derived from the generated code. I prompt with constraints, such as the language version, existing patterns and files to follow, "no new dependencies", the edge cases and the error handling I expect, and I ask for small diffs I can actually read. I do not trust output on security-sensitive code (auth, crypto, input handling), on library APIs it may invent or remember from an older version, or on package names, which I verify exist and are maintained before installing. For the team I would set rules: no secrets or customer data in prompts, follow the licence and data policy of the tool, keep CI, linting and code review unchanged, and have authors be able to explain every line they submit. Used this way it speeds up the typing, while the thinking, the verification and the accountability stay with the engineer.',
    rubric: [
      'Owns generated code: same review bar as human code, author can explain every line',
      'Uses tests as the contract, written or reviewed independently of the generated implementation',
      'Prompts with explicit constraints (patterns, versions, no new deps, edge cases) and asks for small reviewable diffs',
      'Names where not to trust output: security-sensitive code, hallucinated or outdated APIs, invented packages',
      'Sets team guardrails: no secrets or customer data in prompts, licensing and data policy, unchanged CI and review',
    ],
    tags: ['ai-tools', 'code-review', 'engineering-practice'],
    source: 'topic-list',
    explanation:
      'Interviewers are not testing enthusiasm or scepticism; they want to hear that you get the speed without giving up verification and accountability.\n\n**Say this out loud:** "AI writes a draft; I own the result. Tests are the contract, I review every diff as if a new colleague wrote it, and I never trust it blindly on security, on APIs it might invent, or on dependencies."',
  },
  {
    id: 'ai-assisted-development-tooling-tautological-tests',
    domain: 'practices',
    subject: 'ai-assisted-development',
    topic: 'tooling',
    level: 'mid',
    kind: 'single',
    prompt:
      'You ask an assistant to "implement `calculateRefund()` and write tests for it". It returns the function and 12 passing tests with 100% coverage. What is the main risk?',
    options: [
      { id: 'a', text: 'None: 100% coverage and green tests prove the function is correct' },
      { id: 'b', text: 'The tests were derived from the generated implementation, so they encode whatever it does, bugs included; they check that the code does what it does, not what the business rules require' },
      { id: 'c', text: 'Generated tests always run slower than hand-written tests' },
      { id: 'd', text: 'The tests will fail on the next model version' },
    ],
    answer: 'b',
    tags: ['ai-tools', 'testing', 'coverage'],
    source: 'topic-list',
    explanation:
      'Tests generated from the implementation are **tautological**: if the function rounds refunds down instead of up, the expected value in the test was computed the same wrong way. Coverage only proves lines ran, not that the assertions are right. Keep tests as an independent contract: derive the cases from the requirements (partial refund after 30 days, currency rounding, already-refunded order), write or review them before generating the implementation, and check that each one fails when you break the code.',
  },
  {
    id: 'ai-assisted-development-tooling-prompt-constraints',
    domain: 'practices',
    subject: 'ai-assisted-development',
    topic: 'tooling',
    level: 'junior',
    kind: 'single',
    prompt: 'You need a debounced search input in an existing React 18 + TypeScript codebase. Which prompt is most likely to produce code you can merge with little rework?',
    options: [
      { id: 'a', text: '"Write a search box."' },
      { id: 'b', text: '"Write the best possible debounced search component using modern best practices."' },
      { id: 'c', text: '"Add debouncing to `SearchInput.tsx` (React 18, TypeScript strict). Follow the pattern in `useDebouncedValue.ts`, 300 ms delay, no new dependencies, cancel the pending call on unmount, and keep the existing props. Make the tests in `SearchInput.test.tsx` pass."' },
      { id: 'd', text: '"Copy how Google does search suggestions."' },
    ],
    answer: 'c',
    tags: ['ai-tools', 'prompting'],
    source: 'topic-list',
    explanation:
      'Good prompts read like a good ticket: the exact file, the stack and versions, an existing pattern to follow, explicit constraints ("no new dependencies", keep the props), the edge case that usually gets missed (cleanup on unmount), and an objective finish line (the tests pass). Vague prompts get generic code that ignores your conventions, pulls in a library, or targets a different framework version, and the time saved typing is lost in review.',
  },
  {
    id: 'ai-assisted-development-tooling-hallucinated-package',
    domain: 'practices',
    subject: 'ai-assisted-development',
    topic: 'tooling',
    level: 'mid',
    kind: 'single',
    prompt:
      'While fixing a token refresh bug, the assistant tells you to run `npm install react-query-auth-refresh` and import `useSilentRefresh` from it. You have never heard of the package. What do you do?',
    options: [
      { id: 'a', text: 'Install it; the assistant would not suggest a package that does not exist' },
      { id: 'b', text: 'Verify it first: check the registry and repository (does it exist, who publishes it, downloads, recent maintenance, licence), confirm the API it suggested is real, and prefer solving it with dependencies you already have; a plausible but non-existent name is exactly what attackers register as malware' },
      { id: 'c', text: 'Install it, but only in `devDependencies`, so it cannot reach production' },
      { id: 'd', text: 'Ask the assistant whether the package is safe and install it if it says yes' },
    ],
    answer: 'b',
    tags: ['ai-tools', 'supply-chain', 'dependencies'],
    source: 'topic-list',
    explanation:
      'Models generate **plausible** names and APIs, not verified ones. Attackers watch for hallucinated package names and publish malicious packages under them ("slopsquatting", a cousin of typosquatting), and an `npm install` runs install scripts on your machine and in CI, so `devDependencies` is no protection. Asking the model to vouch for its own output is not verification. Check the registry and source, confirm the API against real documentation, and ask whether a new dependency is justified at all; auth refresh logic is also security-sensitive code that deserves extra scrutiny.',
  },
];
