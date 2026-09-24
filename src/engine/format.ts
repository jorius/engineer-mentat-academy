/** JSON-ish rendering of a runtime value for test lists and grader feedback. */
export function formatValue(value: unknown): string {
  try {
    const json = JSON.stringify(value);
    return json === undefined ? String(value) : json;
  } catch {
    return String(value);
  }
}

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/** A value the way a JavaScript developer writes it: `{ total: 5, tags: ['a', 'b'] }`. */
export function formatJsValue(value: unknown): string {
  if (typeof value === 'string') {
    return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  }
  if (Array.isArray(value)) {
    return `[${value.map(formatJsValue).join(', ')}]`;
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).map(
      ([key, item]) => `${IDENTIFIER.test(key) ? key : formatJsValue(key)}: ${formatJsValue(item)}`,
    );
    return entries.length === 0 ? '{}' : `{ ${entries.join(', ')} }`;
  }
  return formatValue(value);
}

/** The call a hidden test makes, e.g. `solution(['a', 'b'], 2)`. */
export function formatCall(args: readonly unknown[]): string {
  return `solution(${args.map(formatJsValue).join(', ')})`;
}

/**
 * The hidden tests of a code exercise as one fenced, highlighted block: a comment line with the
 * test's name, then the call with its expected value as a trailing comment.
 */
export function formatTestBlock(tests: readonly { name: string; args: readonly unknown[]; expected: unknown }[], language: 'javascript' | 'typescript', label: (name: string) => string): string {
  const fence = language === 'typescript' ? 'ts' : 'js';
  const lines = tests.flatMap((test) => [`// ${label(test.name)}`, `${formatCall(test.args)} // → ${formatJsValue(test.expected)}`]);
  return `\`\`\`${fence}\n${lines.join('\n')}\n\`\`\``;
}
