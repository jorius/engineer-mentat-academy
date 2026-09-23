// packages
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// i18n
import './i18n';

// components
import { App } from './App';

// styles
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('Root element #root not found');
}
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
