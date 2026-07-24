import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import '../../../themes/article/app/styles/app.css';
import '@astra-spec/theme-astra/styles/astra.css';
import '@astra-spec/theme-astra/styles/inventory.css';
import './preview.css';
import { App } from './App';

const router = createBrowserRouter([{ path: '*', Component: App }]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
