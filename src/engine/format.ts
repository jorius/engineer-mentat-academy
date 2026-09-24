/** JSON-ish rendering of a runtime value for test lists and grader feedback. */
export function formatValue(value: unknown): string {
  try {
    const json = JSON.stringify(value);
    return json === undefined ? String(value) : json;
  } catch {
    return String(value);
  }
}

/** The call a hidden test makes, e.g. `solution(["a","b"], 2)`. */
export function formatCall(args: readonly unknown[]): string {
  return `solution(${args.map(formatValue).join(', ')})`;
}
