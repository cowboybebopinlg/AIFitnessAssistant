
/**
 * @file The main entry point for the React application.
 * This file is responsible for rendering the root `App` component into the DOM.
 * It locates the 'root' HTML element and uses `ReactDOM.createRoot` to initialize the React application.
 * The `App` component is wrapped in `React.StrictMode` to enable additional checks and warnings for its descendants.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
