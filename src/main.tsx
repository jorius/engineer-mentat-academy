// packages
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// i18n
import './i18n';

// components
import { App } from './App';

// fonts (each package's index.css is weight 400 only, so both weights are imported)
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';
import '@fontsource/fira-code/400.css';
import '@fontsource/fira-code/700.css';
import '@fontsource/source-code-pro/400.css';
import '@fontsource/source-code-pro/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/700.css';
import '@fontsource/cascadia-code/400.css';
import '@fontsource/cascadia-code/700.css';
import '@fontsource/ubuntu-mono/400.css';
import '@fontsource/ubuntu-mono/700.css';
import '@fontsource/roboto-mono/400.css';
import '@fontsource/roboto-mono/700.css';
import '@fontsource/inconsolata/400.css';
import '@fontsource/inconsolata/700.css';
import '@fontsource/space-mono/400.css';
import '@fontsource/space-mono/700.css';
import '@fontsource/geist-mono/400.css';
import '@fontsource/geist-mono/700.css';
import '@fontsource/commit-mono/400.css';
import '@fontsource/commit-mono/700.css';
import '@fontsource/victor-mono/400.css';
import '@fontsource/victor-mono/700.css';

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
