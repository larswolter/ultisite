import React, { useEffect, useState } from 'react';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Box from '@mui/material/Box';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HistoryIcon from '@mui/icons-material/ShowChart';
import CompareIcon from '@mui/icons-material/StackedLineChart';
import Router from './Router.jsx';
import { useHref } from 'react-router-dom';
import { Link } from '@mui/material';

const App = () => {
  const [view, setView] = useState('Dashboard');
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
