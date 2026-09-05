import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import './i18n';
import store from './store';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { migrateLocalStorageToIDB } from './utils/storage';

// Safe non-blocking migration of heavy caches from localStorage to IndexedDB
migrateLocalStorageToIDB().catch((err) => {
  console.warn('IDB migration skipped:', err);
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ToastProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </ToastProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);
