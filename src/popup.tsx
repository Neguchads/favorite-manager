import React from 'react';
import ReactDOM from 'react-dom/client';
import { PopupContent } from './components/popup/PopupContent';
import { LanguageProvider } from './i18n';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <PopupContent />
    </LanguageProvider>
  </React.StrictMode>
);
