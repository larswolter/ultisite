import React, { useEffect, useState } from 'react';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Box from '@mui/material/Box';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HistoryIcon from '@mui/icons-material/ShowChart';
import CompareIcon from '@mui/icons-material/StackedLineChart';
import Router from './Router.jsx';
import { useNavigate, useLocation } from 'react-router-dom';
import { Link } from '@mui/material';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <Box flexBasis="100%" overflow="hidden">
        {children}
      </Box>
      <BottomNavigation
        value={location.pathname}
        onChange={(event, newValue) => {
          navigate(newValue);
        }}
        showLabels>
        <BottomNavigationAction value="/" label="Dashboard" icon={<DashboardIcon />} />
        <BottomNavigationAction value="/turniere" label="Historie" icon={<HistoryIcon />} />
        <BottomNavigationAction value="/training" label="Vergleich" icon={<CompareIcon />} />
      </BottomNavigation>
    </>
  );
};
export default Layout;
