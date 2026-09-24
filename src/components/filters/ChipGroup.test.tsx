// packages
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// components
import { ChipGroup } from './ChipGroup';

const options = [
  { value: 'junior', label: 'Junior', hint: 'Entry level', count: 4 },
  { value: 'mid', label: 'Mid', count: 2 },
  { value: 'senior', label: 'Senior' },
];

describe('ChipGroup', () => {
  it('renders a labelled group of toggle chips with their pressed state, hint and count', () => {
    render(<ChipGroup label="Level" options={options} selected={['mid']} onChange={vi.fn()} />);
    expect(screen.getByRole('group', { name: 'Level' })).toBeInTheDocument();
    const junior = screen.getByRole('button', { name: /junior/i });
    expect(junior).toHaveAttribute('aria-pressed', 'false');
    expect(junior).toHaveAttribute('title', 'Entry level');
    expect(junior).toHaveTextContent('4');
    expect(screen.getByRole('button', { name: /mid/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders every chip unpressed when nothing is selected', () => {
    render(<ChipGroup label="Level" options={options} selected={[]} onChange={vi.fn()} />);
    for (const name of [/junior/i, /mid/i, /senior/i]) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'false');
    }
  });

  it('adds and removes a chip from the selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<ChipGroup label="Level" options={options} selected={['mid']} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /junior/i }));
    expect(onChange).toHaveBeenLastCalledWith(['mid', 'junior']);
    rerender(<ChipGroup label="Level" options={options} selected={['mid', 'junior']} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /mid/i }));
    expect(onChange).toHaveBeenLastCalledWith(['junior']);
  });

  it('selects every option with the All button', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ChipGroup label="Level" options={options} selected={['mid']} onChange={onChange} />);
    const all = screen.getByRole('button', { name: 'All' });
    expect(all).not.toHaveAttribute('aria-pressed');
    await user.click(all);
    expect(onChange).toHaveBeenCalledWith(['junior', 'mid', 'senior']);
  });
});
