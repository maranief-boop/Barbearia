import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { applyBrandTheme } from './config/brand'
import './index.css'

applyBrandTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
