import React from 'react';
import { createRoot } from 'react-dom/client';
import App, { AuthProvider } from './App'; // Import App and AuthProvider

// Select the root HTML element where your React app will be mounted
const container = document.getElementById('root');
const root = createRoot(container); // Create a root

// Render your App component wrapped in AuthProvider
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
