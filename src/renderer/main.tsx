import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { useWorldStore } from './store/useWorldStore'

if (typeof window !== 'undefined') {
  ;(window as any).__orosWorldStore = useWorldStore
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
