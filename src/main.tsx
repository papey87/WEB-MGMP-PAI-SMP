import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {MGMPProvider} from './contexts/MGMPContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MGMPProvider>
      <App />
    </MGMPProvider>
  </StrictMode>,
);
