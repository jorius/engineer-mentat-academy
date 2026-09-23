// packages
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

// components
import { App } from './App';

describe('App', () => {
  it('renders the academy title', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /engineer mentat academy/i })).toBeInTheDocument();
  });
});
