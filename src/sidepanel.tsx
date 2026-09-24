import React from 'react';
import ReactDOM from 'react-dom/client';
import { SidePanelContent } from './components/sidepanel/SidePanelContent';
import { LanguageProvider } from './i18n';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <SidePanelContent />
    </LanguageProvider>
  </React.StrictMode>
);
