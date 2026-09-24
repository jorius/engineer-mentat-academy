// packages
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// components
import { OptionButton } from './OptionButton';

describe('OptionButton', () => {
  it('shows the position letter in the badge, not the id, and names the option by its text', () => {
    render(<OptionButton id="b" letter="C" text="Option B" selected={false} onToggle={vi.fn()} />);
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.queryByText('b')).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Option B' })).toBeInTheDocument();
  });

  it('reports the option id, not the letter, when toggled', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<OptionButton id="b" letter="A" text="Option B" selected={false} onToggle={onToggle} />);
    await user.click(screen.getByRole('radio', { name: 'Option B' }));
    expect(onToggle).toHaveBeenCalledWith('b');
  });

  it('renders as a checkbox with aria-checked in multi mode', () => {
    render(<OptionButton id="a" letter="A" text="Option A" selected multi onToggle={vi.fn()} />);
    expect(screen.getByRole('checkbox', { name: 'Option A' })).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onToggle with the option id when clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<OptionButton id="a" letter="A" text="Option A" selected={false} onToggle={onToggle} />);
    await user.click(screen.getByRole('radio', { name: 'Option A' }));
    expect(onToggle).toHaveBeenCalledWith('a');
  });

  it('carries a neutral outline when selected, never the accent', () => {
    render(<OptionButton id="a" letter="A" text="Option A" selected onToggle={vi.fn()} />);
    expect(screen.getByRole('radio', { name: 'Option A' })).toHaveClass('border-zinc-900');
    expect(screen.getByRole('radio', { name: 'Option A' })).not.toHaveClass('border-accent-500');
  });

  it('marks a locked option struck through, dimmed and aria-disabled', () => {
    render(<OptionButton id="a" letter="A" text="Option A" selected={false} locked onToggle={vi.fn()} />);
    const button = screen.getByRole('radio', { name: 'Option A' });
    expect(button).toHaveClass('line-through', 'opacity-50');
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('ignores a click on a locked option', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<OptionButton id="a" letter="A" text="Option A" selected={false} locked onToggle={onToggle} />);
    await user.click(screen.getByRole('radio', { name: 'Option A' }));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('ignores a click when disabled', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<OptionButton id="a" letter="A" text="Option A" selected={false} disabled onToggle={onToggle} />);
    await user.click(screen.getByRole('radio', { name: 'Option A' }));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('shows the success style and a decorative check mark when correct', () => {
    render(<OptionButton id="a" letter="A" text="Option A" selected={false} correct onToggle={vi.fn()} />);
    const button = screen.getByRole('radio', { name: 'Option A' });
    expect(button).toHaveClass('border-emerald-500/50');
    expect(screen.getByText('✓')).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not show a check mark when not correct', () => {
    render(<OptionButton id="a" letter="A" text="Option A" selected={false} onToggle={vi.fn()} />);
    expect(screen.queryByText('✓')).not.toBeInTheDocument();
  });

  it('renders a fenced code block highlighted inside the option, not inside a button', () => {
    const text = '```js\nuseEffect(() => {\n  subscribe();\n}, []);\n```';
    render(<OptionButton id="a" letter="A" text={text} selected={false} onToggle={vi.fn()} />);
    const option = screen.getByRole('radio');
    const code = option.querySelector('pre > code');
    expect(code).not.toBeNull();
    expect(code).toHaveClass('language-js', 'hljs');
    expect(code?.querySelectorAll('.hljs-keyword, .hljs-title').length).toBeGreaterThan(0);
    expect(option.closest('button')).toBeNull();
    expect(option).toHaveAttribute('aria-label', 'useEffect(() => { subscribe(); }, []);');
  });

  it('names an inline-code option without backticks', () => {
    render(<OptionButton id="a" letter="A" text="Call `useMemo` once" selected={false} onToggle={vi.fn()} />);
    expect(screen.getByRole('radio', { name: 'Call useMemo once' })).toBeInTheDocument();
  });

  it('ignores Space and Enter that come from a focusable descendant', () => {
    const onToggle = vi.fn();
    const text = '```js\nconst veryLongLine = 1;\n```';
    render(<OptionButton id="a" letter="A" text={text} selected={false} onToggle={onToggle} />);
    const pre = screen.getByRole('radio').querySelector('pre');
    expect(pre).not.toBeNull();
    pre?.setAttribute('tabindex', '0');
    fireEvent.keyDown(pre as HTMLElement, { key: ' ' });
    fireEvent.keyDown(pre as HTMLElement, { key: 'Enter' });
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('is reachable with Tab and toggles on Space and on Enter, preventing the default', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<OptionButton id="a" letter="A" text="Option A" selected={false} onToggle={onToggle} />);
    const option = screen.getByRole('radio', { name: 'Option A' });
    await user.tab();
    expect(option).toHaveFocus();
    await user.keyboard(' ');
    expect(onToggle).toHaveBeenCalledTimes(1);
    await user.keyboard('{Enter}');
    expect(onToggle).toHaveBeenCalledTimes(2);
    expect(onToggle).toHaveBeenLastCalledWith('a');
    expect(fireEvent.keyDown(option, { key: ' ' })).toBe(false);
    expect(fireEvent.keyDown(option, { key: 'Enter' })).toBe(false);
  });

  it('ignores other keys', () => {
    const onToggle = vi.fn();
    render(<OptionButton id="a" letter="A" text="Option A" selected={false} onToggle={onToggle} />);
    expect(fireEvent.keyDown(screen.getByRole('radio', { name: 'Option A' }), { key: 'a' })).toBe(true);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('keeps a locked option out of the tab order and ignores Space and Enter on it', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<OptionButton id="a" letter="A" text="Option A" selected={false} locked onToggle={onToggle} />);
    const option = screen.getByRole('radio', { name: 'Option A' });
    expect(option).toHaveAttribute('tabindex', '-1');
    option.focus();
    await user.keyboard(' ');
    await user.keyboard('{Enter}');
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('ignores Space and Enter when disabled', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<OptionButton id="a" letter="A" text="Option A" selected={false} disabled multi onToggle={onToggle} />);
    const option = screen.getByRole('checkbox', { name: 'Option A' });
    expect(option).toHaveAttribute('tabindex', '-1');
    option.focus();
    await user.keyboard(' ');
    await user.keyboard('{Enter}');
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('shows a dimmed, not-allowed cue for a plain disabled (not locked) option', () => {
    render(<OptionButton id="a" letter="A" text="Option A" selected={false} disabled onToggle={vi.fn()} />);
    const button = screen.getByRole('radio', { name: 'Option A' });
    expect(button).toHaveClass('opacity-60', 'cursor-not-allowed');
    expect(button).not.toHaveClass('line-through');
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });
});
