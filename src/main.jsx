import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import KeywordVideoPicker from './KeywordVideoPicker.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <KeywordVideoPicker />
  </StrictMode>,
)
