// packages
import { afterEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';

// components
import { HintPanel } from './HintPanel';

// i18n
import i18n from '../../i18n';

describe('HintPanel', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('shows the hint as Markdown in a note labelled Hint', () => {
    render(<HintPanel hint="Think about **scope**." />);
    const note = screen.getByRole('note');
    expect(within(note).getByText('Hint')).toBeInTheDocument();
    expect(within(note).getByText('scope').tagName).toBe('STRONG');
    expect(note.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('labels the panel in Spanish', async () => {
    await i18n.changeLanguage('es');
    render(<HintPanel hint="Piensa en el alcance." />);
    expect(within(screen.getByRole('note')).getByText('Pista')).toBeInTheDocument();
  });
});
