// packages
import { NavLink, Outlet } from 'react-router-dom';
import type { JSX } from 'react';

// contexts
import { useTheme } from '../../contexts/ThemeContext';

const links = [
  { to: '/', label: 'Home' },
  { to: '/browse', label: 'Browse' },
  { to: '/drill', label: 'Drill' },
  { to: '/mock', label: 'Mock' },
  { to: '/review', label: 'Review' },
  { to: '/settings', label: 'Settings' },
];

export function Layout(): JSX.Element {
  const { theme, toggle } = useTheme();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <nav className="mx-auto flex max-w-5xl items-center gap-1 overflow-x-auto px-4 py-2 text-sm">
          <span className="mr-3 whitespace-nowrap font-semibold text-spice-500">Mentat Academy</span>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }): string =>
                `rounded px-2 py-1 whitespace-nowrap ${isActive ? 'bg-zinc-200 dark:bg-zinc-800' : 'hover:bg-zinc-100 dark:hover:bg-zinc-900'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <button type="button" onClick={toggle} className="ml-auto rounded px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-900" aria-label="Toggle theme">
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
