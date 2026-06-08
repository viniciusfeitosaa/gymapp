import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/capacitor-native.css'
import './styles/student-brand.css'
import './i18n'
import App from './App'
import { registerGymCodeBilling } from './lib/registerGymCodeBilling'
import { Capacitor } from '@capacitor/core'
import { applyNativeSafeAreas } from './lib/applyNativeSafeAreas'
import { isCapacitorApp } from './lib/capacitorApp'
import { AppErrorBoundary } from './components/AppErrorBoundary'

registerGymCodeBilling()

if (isCapacitorApp()) {
  document.documentElement.classList.add('capacitor-native')
  const platform = Capacitor.getPlatform()
  if (platform === 'ios' || platform === 'android') {
    document.documentElement.classList.add(`capacitor-${platform}`)
  }
  applyNativeSafeAreas()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </Suspense>
  </StrictMode>,
)
