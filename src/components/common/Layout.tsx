// packages
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiMoon, FiSun } from 'react-icons/fi';
import type { ChangeEvent, JSX } from 'react';

// contexts
import { useTheme } from '../../contexts/ThemeContext';

// i18n
import { SUPPORTED_LANGUAGES } from '../../i18n';

// utils
import { containerWidth } from '../../utils/containerWidth';

const links = [
  { to: '/', key: 'nav.home' },
  { to: '/browse', key: 'nav.browse' },
  { to: '/drill', key: 'nav.drill' },
  { to: '/mock', key: 'nav.mock' },
  { to: '/review', key: 'nav.review' },
  { to: '/settings', key: 'nav.settings' },
] as const;

const LANGUAGE_NAMES = { en: 'common.english', es: 'common.spanish' } as const;

export function Layout(): JSX.Element {
  const { theme, toggle } = useTheme();
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const width = containerWidth(pathname);
  const active = i18n.resolvedLanguage ?? 'en';
  const themeLabel = theme === 'dark' ? t('common.switchToLight') : t('common.switchToDark');
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <nav className={`mx-auto flex ${width} items-center gap-1 overflow-x-auto px-4 py-2 text-sm`}>
          <span className="mr-3 whitespace-nowrap font-semibold text-accent-500">{t('nav.brand')}</span>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }): string =>
                `rounded px-2 py-1 whitespace-nowrap ${isActive ? 'bg-zinc-200 dark:bg-zinc-800' : 'hover:bg-zinc-100 dark:hover:bg-zinc-900'}`
              }
            >
              {t(link.key)}
            </NavLink>
          ))}
          <select
            aria-label={t('common.language')}
            value={active}
            onChange={(event: ChangeEvent<HTMLSelectElement>): void => void i18n.changeLanguage(event.target.value)}
            className="ml-auto rounded border border-zinc-300 bg-transparent px-2 py-1 dark:border-zinc-700 dark:bg-zinc-950"
          >
            {SUPPORTED_LANGUAGES.map((language) => (
              <option key={language} value={language} lang={language}>
                {t(LANGUAGE_NAMES[language])}
              </option>
            ))}
          </select>
          <button type="button" onClick={toggle} className="rounded p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900" aria-label={themeLabel} title={themeLabel}>
            {theme === 'dark' ? <FiSun aria-hidden="true" /> : <FiMoon aria-hidden="true" />}
          </button>
        </nav>
      </header>
      <main className={`mx-auto ${width} px-4 py-6`}>
        <Outlet />
      </main>
    </div>
  );
}
