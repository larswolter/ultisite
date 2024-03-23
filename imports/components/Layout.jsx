import React, { useEffect, useState } from 'react';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HistoryIcon from '@mui/icons-material/ShowChart';
import CompareIcon from '@mui/icons-material/StackedLineChart';
import Router from './Router.jsx';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMediaQuery, Tabs, Tab } from '@mui/material';
import { useAuth } from './Authenticator.jsx';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const sm = useMediaQuery((theme) => theme.breakpoints.down('sm'));

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleLogout = () => {
    Meteor.logout();
    handleClose();
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1 }}
            onClick={(event) => {
              navigate('/');
            }}>
            Ultisite
          </Typography>
          {!sm ? (
            <Tabs
              value={location.pathname}
              onChange={(event, newValue) => {
                navigate(newValue);
              }}>
              <Tab value="/training" label="Training" />
              {user ? (
                [
                  <Tab key="turniere" value="/turniere" label="Turniere" />,
                  <Tab key="docs" value="/dokumente" label="Dokumente" />,
                ]
              ) : (
                <Tab value="/anmelden" label="Anmelden" />
              )}
            </Tabs>
          ) : null}
          {user ? (
            <div>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit">
                <AccountCircle />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}>
                <MenuItem onClick={handleClose}>Profil</MenuItem>
                <MenuItem onClick={handleLogout}>Abmelden</MenuItem>
              </Menu>
            </div>
          ) : null}
        </Toolbar>
      </AppBar>{' '}
      <Box flexBasis="100%" overflow="auto" padding={2}>
        {children}
      </Box>
      {sm ? (
        <BottomNavigation
          value={location.pathname}
          onChange={(event, newValue) => {
            navigate(newValue);
          }}
          showLabels>
          <BottomNavigationAction value="/" label="Dashboard" icon={<DashboardIcon />} />
          {user ? <BottomNavigationAction value="/turniere" label="Turniere" icon={<HistoryIcon />} /> : null}
          <BottomNavigationAction value="/training" label="Training" icon={<CompareIcon />} />
        </BottomNavigation>
      ) : null}
    </>
  );
};
export default Layout;
