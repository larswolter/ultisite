import React from 'react';
import { createRoot } from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material';
import StyledEngineProvider from '@mui/material/StyledEngineProvider';
import Authenticator from '../imports/components/Authenticator.jsx';
import App from '../imports/components/App.jsx';

const palette = Meteor.settings?.public?.palette || {};

const AppShell = () => {
  const theme = createTheme({
    palette,
  });
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Authenticator>
          <App />
        </Authenticator>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};

const root = createRoot(document.getElementById('react-target')); // createRoot(container!) if you use TypeScript
root.render(<AppShell />);

if (window.navigator.serviceWorker) {
  console.log('unregistering any service worker...');
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((reg) => {
      reg.unregister();
    });
  });
}
