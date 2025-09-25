import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/defaults.css'
import './styles/generated-defaults.css'
import './styles/generated-defaults-override.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
