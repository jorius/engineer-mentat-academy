// packages
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';

// components
import { Stepper } from './Stepper';

function Harness({ initial, hint }: { initial: number; hint?: string }): JSX.Element {
  const [value, setValue] = useState(initial);
  return (
    <>
      <Stepper label="Questions" value={value} min={1} max={5} onChange={setValue} hint={hint} />
      <output data-testid="value">{value}</output>
    </>
  );
}

describe('Stepper', () => {
  it('renders a label, a number input, labelled -/+ buttons and the hint', () => {
    render(<Harness initial={3} hint="3 min each" />);
    expect(screen.getByText('Questions')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: 'Questions' })).toHaveValue(3);
    expect(screen.getByRole('button', { name: 'Decrease Questions' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Increase Questions' })).toBeInTheDocument();
    expect(screen.getByText('3 min each')).toBeInTheDocument();
  });

  it('steps with the buttons and clamps to min and max', async () => {
    const user = userEvent.setup();
    render(<Harness initial={4} />);
    const increase = screen.getByRole('button', { name: 'Increase Questions' });
    await user.click(increase);
    await user.click(increase);
    expect(screen.getByTestId('value')).toHaveTextContent('5');
    const decrease = screen.getByRole('button', { name: 'Decrease Questions' });
    for (let i = 0; i < 6; i += 1) {
      await user.click(decrease);
    }
    expect(screen.getByTestId('value')).toHaveTextContent('1');
  });

  it('commits typed values clamped to the range and shows the value again on blur', async () => {
    const user = userEvent.setup();
    render(<Harness initial={3} />);
    const input = screen.getByRole('spinbutton', { name: 'Questions' });
    await user.clear(input);
    expect(screen.getByTestId('value')).toHaveTextContent('3');
    await user.type(input, '2');
    expect(screen.getByTestId('value')).toHaveTextContent('2');
    await user.clear(input);
    await user.type(input, '99');
    expect(screen.getByTestId('value')).toHaveTextContent('5');
    await user.tab();
    expect(input).toHaveValue(5);
  });

  it('rounds typed values to the step', async () => {
    const user = userEvent.setup();
    render(<Harness initial={3} />);
    const input = screen.getByRole('spinbutton', { name: 'Questions' });
    await user.clear(input);
    await user.type(input, '2.4');
    expect(screen.getByTestId('value')).toHaveTextContent('2');
    await user.tab();
    expect(input).toHaveValue(2);
  });
});
