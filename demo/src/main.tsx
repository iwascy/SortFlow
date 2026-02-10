import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { setupMocks } from './services/mocks';

if (import.meta.env.VITE_USE_MOCK === 'true') {
  setupMocks();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
