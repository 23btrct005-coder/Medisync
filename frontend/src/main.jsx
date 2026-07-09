import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './i18n'
import { CapacitorUpdater } from '@capgo/capacitor-updater'

// Tell Capgo that the app successfully loaded
CapacitorUpdater.notifyAppReady()

console.log('MEDISYNC FRONTEND RELOADED - 2026-05-07 19:53');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
