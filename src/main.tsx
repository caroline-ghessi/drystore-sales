import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { SafeStorage } from './lib/storage';

// 🚨 CORREÇÃO CRÍTICA: Limpar storage corrompido antes da inicialização
console.log('🧹 Limpando storage corrompido...');
SafeStorage.cleanCorruptedData();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
