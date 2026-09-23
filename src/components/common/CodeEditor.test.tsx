// packages
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// components
import { CodeEditor } from './CodeEditor';

// contexts
import { ThemeProvider } from '../../contexts/ThemeContext';

// hooks
import { PreferencesProvider } from '../../hooks/usePreferences';

describe('CodeEditor', () => {
  it('mounts CodeMirror with the initial value', () => {
    const onChange = vi.fn();
    render(
      <PreferencesProvider>
        <ThemeProvider>
          <CodeEditor value="const a = 1;" onChange={onChange} language="typescript" ariaLabel="Solution" />
        </ThemeProvider>
      </PreferencesProvider>,
    );
    expect(screen.getByLabelText('Solution')).toHaveTextContent('const a = 1;');
  });
});
