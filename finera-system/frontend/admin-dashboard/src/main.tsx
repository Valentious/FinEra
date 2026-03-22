/**
 * FinEra Admin Dashboard
 * Connects to API Gateway at /api/v1/admin/*
 * Requires ADMIN or SUPER_ADMIN role
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
