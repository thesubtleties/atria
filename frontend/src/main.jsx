import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { Provider as ReduxProvider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { store } from './app/store';
import { router } from './app/router/routes';
import ErrorBoundary from './shared/components/ErrorBoundary';
import { Analytics } from './shared/components/Analytics';

import './styles/reset.css';
import './styles/design-tokens.css';
import '@mantine/core/styles.css';
import '@mantine/carousel/styles.css';
import '@mantine/notifications/styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ReduxProvider store={store}>
        <MantineProvider>
          <Analytics />
          <Notifications position="bottom-left" />
          <ModalsProvider>
            <RouterProvider router={router} />
          </ModalsProvider>
        </MantineProvider>
      </ReduxProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
