// packages
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// components
import { ConsolePanel } from './ConsolePanel';

// engine
import type { RunResult } from '../../engine/runner/execute';
import type { TestCase } from '../../engine/question';

// i18n
import i18n from '../../i18n';

const tests: TestCase[] = [
  { name: 'sums', args: [1, 2], expected: 3 },
  { name: 'tags', args: [], expected: { tags: ['a'] } },
];

const run: RunResult = {
  status: 'ok',
  logs: ['hello', '42'],
  tests: [
    { name: 'sums', passed: true, actual: 3 },
    { name: 'tags', passed: false, actual: { tags: ['b'] } },
  ],
};

function body(): HTMLElement {
  const toggle = screen.getByRole('button', { name: /console/i });
  const id = toggle.getAttribute('aria-controls') ?? '';
  const element = document.getElementById(id);
  if (element === null) {
    throw new Error('console body missing');
  }
  return element;
}

describe('ConsolePanel', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('starts collapsed with an empty state and no count or Clear', () => {
    render(<ConsolePanel run={null} tests={tests} open={false} onToggle={vi.fn()} onClear={vi.fn()} />);
    const toggle = screen.getByRole('button', { name: 'Console' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(body()).not.toBeVisible();
    expect(body()).toHaveTextContent('Nothing logged yet. Run the tests to see console output.');
    expect(screen.queryByText(/lines?$/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('lists the logs in order, then one line per test with JavaScript-style values', () => {
    render(<ConsolePanel run={run} tests={tests} open onToggle={vi.fn()} onClear={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Console' })).toHaveAttribute('aria-expanded', 'true');
    const lines = Array.from(body().querySelectorAll('[data-console-line]')).map((line) => line.textContent);
    expect(lines).toEqual(['hello', '42', '✓ passed: sums', "✗ failed: tags — expected { tags: ['a'] }, got { tags: ['b'] }"]);
    expect(screen.getByText('4 lines')).toBeInTheDocument();
    expect(body()).toHaveClass('max-h-64', 'overflow-auto');
  });

  it('shows a test error in place of expected and got', () => {
    const errored: RunResult = { status: 'ok', logs: [], tests: [{ name: 'sums', passed: false, error: 'TypeError: boom' }] };
    render(<ConsolePanel run={errored} tests={tests} open onToggle={vi.fn()} onClear={vi.fn()} />);
    expect(body()).toHaveTextContent('✗ failed: sums — TypeError: boom');
    expect(screen.getByText('1 line')).toBeInTheDocument();
  });

  it('shows a runtime error or timeout in the danger colour after the logs', () => {
    const failed: RunResult = { status: 'timeout', logs: ['before'], tests: [], error: 'Timed out after 3000 ms' };
    render(<ConsolePanel run={failed} tests={tests} open onToggle={vi.fn()} onClear={vi.fn()} />);
    const error = screen.getByText('Timed out after 3000 ms');
    expect(error).toHaveClass('text-red-600');
    const lines = Array.from(body().querySelectorAll('[data-console-line]')).map((line) => line.textContent);
    expect(lines).toEqual(['before', 'Timed out after 3000 ms']);
  });

  it('toggles and clears through its callbacks', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const onClear = vi.fn();
    render(<ConsolePanel run={run} tests={tests} open={false} onToggle={onToggle} onClear={onClear} />);
    await user.click(screen.getByRole('button', { name: 'Console' }));
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('speaks Spanish', async () => {
    await i18n.changeLanguage('es');
    render(<ConsolePanel run={{ ...run, tests: [] }} tests={tests} open onToggle={vi.fn()} onClear={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Consola' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Limpiar' })).toBeInTheDocument();
    expect(screen.getByText('2 líneas')).toBeInTheDocument();
  });
});
