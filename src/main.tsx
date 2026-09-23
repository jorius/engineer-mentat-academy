// packages
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

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
