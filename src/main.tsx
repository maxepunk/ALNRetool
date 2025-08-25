import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializeAppViews } from './views/viewInitializer'

// Initialize all views BEFORE React renders to prevent 404 errors
// This ensures ViewRegistry is populated when AppRouter generates routes
initializeAppViews()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
