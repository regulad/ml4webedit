import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { rootErrorHooks, startDiagnostics } from './diagnostics.ts'
import './index.css'

startDiagnostics()

createRoot(document.getElementById('root')!, rootErrorHooks).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
