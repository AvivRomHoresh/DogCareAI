import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './hooks/useAuth';
import { DogProvider } from './hooks/useDogs';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DogProvider>
          <App />
        </DogProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
