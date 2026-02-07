import React from 'react';
import ReactDOM from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import amplifyConfig from './config/amplify-config';
import App from './App';
import './index.css';

// Initialize Amplify with Cognito configuration
Amplify.configure(amplifyConfig);

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
    <App />
    </React.StrictMode>
);
