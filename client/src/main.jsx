import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './i18n.js';
import './index.css';
import 'leaflet/dist/leaflet.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ModalProvider } from './context/ModalContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { MeProvider } from './context/MeContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ModalProvider>
            <MeProvider>
              <App />
            </MeProvider>
          </ModalProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
