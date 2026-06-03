import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/capacitor-native.css'
import App from './App'
import { registerGymCodeBilling } from './lib/registerGymCodeBilling'
import { isCapacitorApp } from './lib/capacitorApp'
import { AppErrorBoundary } from './components/AppErrorBoundary'

registerGymCodeBilling()

if (isCapacitorApp()) {
  document.documentElement.classList.add('capacitor-native')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
