import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ReactLenis } from 'lenis/react'
import { App } from './ui/App'
import { AuthProvider } from './core/auth'
import { WalletProvider } from './web3/wallet'
import './style.css'

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ReactLenis root>
        <WalletProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </WalletProvider>
      </ReactLenis>
    </BrowserRouter>
  </React.StrictMode>,
)

