import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/plus-jakarta-sans'
import './index.css'
import ReelMatch from './ReelMatch.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ReelMatch />
  </StrictMode>,
)
