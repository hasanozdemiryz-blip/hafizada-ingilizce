import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * Gorunum varyanti: ?look=bold  /  ?look=calm
 * Karsilastirma icin gecici. Secim yapilinca bu blok ve
 * index.css'teki [data-look='bold'] katmani silinir.
 */
try {
  const fromUrl = new URLSearchParams(location.search).get('look');
  const look = fromUrl ?? localStorage.getItem('look');
  if (fromUrl) localStorage.setItem('look', fromUrl);
  if (look === 'bold') document.documentElement.dataset.look = 'bold';
  else delete document.documentElement.dataset.look;
} catch {
  /* localStorage kapaliysa sakin gorunumde kal */
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
