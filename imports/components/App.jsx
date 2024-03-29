import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Router from './Router.jsx';

const App = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        alignContent: 'stretch',
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      }}>
      <Router />
    </Box>
  );
};
export default App;
