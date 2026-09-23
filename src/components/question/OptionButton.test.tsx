// packages
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// components
import { OptionButton } from './OptionButton';

describe('OptionButton', () => {
  it('shows the letter badge and the option text with an accessible name', () => {
    render(<OptionButton id="b" text="Option B" selected={false} onToggle={vi.fn()} />);
    expect(screen.getByText('b')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Option B' })).toBeInTheDocument();
  });

  it('renders as a checkbox with aria-checked in multi mode', () => {
    render(<OptionButton id="a" text="Option A" selected multi onToggle={vi.fn()} />);
    expect(screen.getByRole('checkbox', { name: 'Option A' })).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onToggle with the option id when clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<OptionButton id="a" text="Option A" selected={false} onToggle={onToggle} />);
    await user.click(screen.getByRole('radio', { name: 'Option A' }));
    expect(onToggle).toHaveBeenCalledWith('a');
  });

  it('carries the accent border when selected', () => {
    render(<OptionButton id="a" text="Option A" selected onToggle={vi.fn()} />);
    expect(screen.getByRole('radio', { name: 'Option A' })).toHaveClass('border-accent-500');
  });

  it('marks a locked option struck through, dimmed and aria-disabled', () => {
    render(<OptionButton id="a" text="Option A" selected={false} locked onToggle={vi.fn()} />);
    const button = screen.getByRole('radio', { name: 'Option A' });
    expect(button).toHaveClass('line-through', 'opacity-50');
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('ignores a click on a locked option', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<OptionButton id="a" text="Option A" selected={false} locked onToggle={onToggle} />);
    await user.click(screen.getByRole('radio', { name: 'Option A' }));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('ignores a click when disabled', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<OptionButton id="a" text="Option A" selected={false} disabled onToggle={onToggle} />);
    await user.click(screen.getByRole('radio', { name: 'Option A' }));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('shows the success style and a decorative check mark when correct', () => {
    render(<OptionButton id="a" text="Option A" selected={false} correct onToggle={vi.fn()} />);
    const button = screen.getByRole('radio', { name: 'Option A' });
    expect(button).toHaveClass('border-emerald-500/50');
    expect(screen.getByText('✓')).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not show a check mark when not correct', () => {
    render(<OptionButton id="a" text="Option A" selected={false} onToggle={vi.fn()} />);
    expect(screen.queryByText('✓')).not.toBeInTheDocument();
  });

  it('shows a dimmed, not-allowed cue for a plain disabled (not locked) option', () => {
    render(<OptionButton id="a" text="Option A" selected={false} disabled onToggle={vi.fn()} />);
    const button = screen.getByRole('radio', { name: 'Option A' });
    expect(button).toHaveClass('opacity-60', 'cursor-not-allowed');
    expect(button).not.toHaveClass('line-through');
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });
});
