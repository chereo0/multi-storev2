import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'leaflet/dist/leaflet.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Prevent auth from being cleared by early API 401/403 responses during a hard page refresh.
// Some components (and axios) may make requests before AuthContext finishes restoring tokens.
// Set a short-lived flag so the response interceptor can detect a refresh and avoid clearing auth.
try {
  sessionStorage.setItem('is_refreshing', 'true');
  // Remove the flag shortly after mount to resume normal error handling
  setTimeout(() => {
    sessionStorage.removeItem('is_refreshing');
  }, 5000);
} catch (e) {
  // sessionStorage might be unavailable in some environments; ignore any errors
  // eslint-disable-next-line no-console
  console.warn('Could not set is_refreshing flag in sessionStorage', e);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
// Disable StrictMode to avoid double-mount duplicate effects in development
root.render(<App />);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
