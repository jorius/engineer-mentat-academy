// packages
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// components
import { MultiChoice } from './MultiChoice';

// engine
import type { MultiQuestion } from '../../engine/question';

// utils
import { orderOptions } from '../../utils/optionOrder';

const question: MultiQuestion = {
  id: 'multi-test',
  domain: 'languages',
  subject: 'javascript',
  topic: 'closures',
  level: 'junior',
  kind: 'multi',
  prompt: 'Pick A and B',
  options: [
    { id: 'a', text: 'A' },
    { id: 'b', text: 'B' },
    { id: 'c', text: 'C' },
  ],
  answer: ['a', 'b'],
  tags: [],
  source: 'notion',
  explanation: 'A and B are correct.',
};

describe('MultiChoice', () => {
  it('wraps its options in a labeled group', () => {
    render(<MultiChoice question={question} disabled={false} onSubmit={vi.fn()} />);
    expect(screen.getByRole('group', { name: 'Answer options' })).toBeInTheDocument();
  });

  it('lists the options in their stable shuffled order with position letters', () => {
    render(<MultiChoice question={question} disabled={false} onSubmit={vi.fn()} />);
    const expected = orderOptions(question.options, question.id).map((option, index) => `${String.fromCharCode(65 + index)}${option.text}`);
    expect(screen.getAllByRole('checkbox').map((checkbox) => checkbox.textContent)).toEqual(expected);
  });

  it('toggles an option on and off through onChange in controlled mode', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <MultiChoice question={question} disabled={false} onSubmit={vi.fn()} value={[]} onChange={onChange} />,
    );

    await user.click(screen.getByRole('checkbox', { name: 'A' }));
    expect(onChange).toHaveBeenLastCalledWith(['a']);

    rerender(<MultiChoice question={question} disabled={false} onSubmit={vi.fn()} value={['a']} onChange={onChange} />);
    await user.click(screen.getByRole('checkbox', { name: 'B' }));
    expect(onChange).toHaveBeenLastCalledWith(['a', 'b']);

    rerender(<MultiChoice question={question} disabled={false} onSubmit={vi.fn()} value={['a', 'b']} onChange={onChange} />);
    await user.click(screen.getByRole('checkbox', { name: 'A' }));
    expect(onChange).toHaveBeenLastCalledWith(['b']);
  });

  it('ignores a click on a locked option in controlled mode', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MultiChoice
        question={question}
        disabled={false}
        onSubmit={vi.fn()}
        value={[]}
        onChange={onChange}
        lockedOptionIds={['a']}
      />,
    );
    await user.click(screen.getByRole('checkbox', { name: 'A' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('submits the selected option ids with its own button in legacy (uncontrolled) mode', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<MultiChoice question={question} disabled={false} onSubmit={onSubmit} />);

    await user.click(screen.getByRole('checkbox', { name: 'A' }));
    await user.click(screen.getByRole('checkbox', { name: 'B' }));
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(onSubmit).toHaveBeenCalledWith({ kind: 'multi', optionIds: ['a', 'b'] });
  });
});
