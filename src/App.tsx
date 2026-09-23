// packages
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import type { JSX } from 'react';

// contexts
import { ThemeProvider } from './contexts/ThemeContext';
import { GraderProvider } from './contexts/GraderContext';

// hooks
import { PreferencesProvider } from './hooks/usePreferences';
import { ProgressProvider } from './hooks/useProgress';

// components
import { Layout } from './components/common/Layout';

// pages
import { Home } from './pages/Home';
import { Browse } from './pages/Browse';
import { BrowseDomain } from './pages/BrowseDomain';
import { BrowseSubject } from './pages/BrowseSubject';
import { Drill } from './pages/Drill';
import { Mock } from './pages/Mock';
import { Review } from './pages/Review';
import { QuestionPage } from './pages/QuestionPage';
import { Settings } from './pages/Settings';

export const routes = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'browse', element: <Browse /> },
      { path: 'browse/:domain', element: <BrowseDomain /> },
      { path: 'browse/:domain/:subject', element: <BrowseSubject /> },
      { path: 'drill', element: <Drill /> },
      { path: 'mock', element: <Mock /> },
      { path: 'review', element: <Review /> },
      { path: 'q/:id', element: <QuestionPage /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
];

const router = createBrowserRouter(routes, { basename: import.meta.env.BASE_URL.replace(/\/$/, '') });

export function App(): JSX.Element {
  return (
    <PreferencesProvider>
      <ThemeProvider>
        <ProgressProvider>
          <GraderProvider>
            <RouterProvider router={router} />
          </GraderProvider>
        </ProgressProvider>
      </ThemeProvider>
    </PreferencesProvider>
  );
}
