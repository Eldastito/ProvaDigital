
import React from 'react';
import './index.css';
import './index.css';
import { createRoot } from 'react-dom/client';
import App from './App';
import { QueryClientProvider } from '@tanstack/react-query'; // Importa QueryClientProvider
import { queryClient } from './services/supabaseClient'; // Importa a instância do queryClient

const container = document.getElementById('root');

if (!container) {
  throw new Error("Elemento #root não encontrado no DOM");
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}> {/* Envolve o App com QueryClientProvider */}
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
