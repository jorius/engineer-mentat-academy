// packages
import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';

// contexts
import { useTheme } from '../../contexts/ThemeContext';

// i18n
import { SUPPORTED_LANGUAGES } from '../../i18n';

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
  const active = i18n.resolvedLanguage ?? 'en';
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <nav className="mx-auto flex max-w-5xl items-center gap-1 overflow-x-auto px-4 py-2 text-sm">
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
          <div role="group" aria-label={t('common.language')} className="ml-auto flex gap-1">
            {SUPPORTED_LANGUAGES.map((language) => (
              <button
                key={language}
                type="button"
                lang={language}
                title={t(LANGUAGE_NAMES[language])}
                aria-pressed={active === language}
                onClick={(): void => void i18n.changeLanguage(language)}
                className={`rounded px-2 py-1 ${active === language ? 'bg-zinc-200 dark:bg-zinc-800' : 'hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
              >
                {t(`common.${language}`)}
              </button>
            ))}
          </div>
          <button type="button" onClick={toggle} className="rounded px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-900" aria-label={t('common.toggleTheme')}>
            {theme === 'dark' ? t('common.light') : t('common.dark')}
          </button>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
