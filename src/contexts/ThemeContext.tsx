// packages
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { JSX, ReactNode } from 'react';

type Theme = 'dark' | 'light';
type ThemeValue = { theme: Theme; toggle: () => void; reset: () => void };

const THEME_KEY = 'ema:theme';
const ThemeContext = createContext<ThemeValue | null>(null);

function readTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function ThemeProvider({ children }: { children: ReactNode }): JSX.Element {
  const [theme, setTheme] = useState<Theme>(readTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore blocked storage
    }
  }, [theme]);

  const toggle = useCallback((): void => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);
  const reset = useCallback((): void => {
    try {
      localStorage.removeItem(THEME_KEY);
    } catch {
      // ignore blocked storage
    }
    setTheme('dark');
  }, []);
  const value = useMemo((): ThemeValue => ({ theme, toggle, reset }), [theme, toggle, reset]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (value === null) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return value;
}
