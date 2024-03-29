import React from 'react';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  useMediaQuery,
  Tabs,
  Tab,
  Drawer,
  List,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
} from '@mui/material';
import { useAuth } from './Authenticator.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import { AppBar, DrawerHeader, Main } from './LayoutHelpers.jsx';

const drawerWidth = 240;
const navigation = [
  { label: 'Startseite', target: '/', isPublic: true },
  { label: 'Training', target: '/training', isPublic: true },
  { label: 'Was ist Ultimate', target: '/wasistultimate', isPublic: true },
  { label: 'Turniere', target: '/turniere' },
  { label: 'Dokumente', target: '/dokumente' },
  { label: 'Infos', target: '/info' },
];

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const md = useMediaQuery((theme) => theme.breakpoints.up('sm'));
  const theme = useTheme();
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
      <AppBar position="sticky" drawerWidth={drawerWidth} open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={() => setOpen(true)}
            edge="start"
            sx={{ marginRight: 2, ...(open && { display: 'none' }) }}>
            <MenuIcon />
          </IconButton>{' '}
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1 }}
            onClick={(event) => {
              navigate('/');
            }}>
            Ultisite
          </Typography>
          <Box display="flex" gap={2}>
            {user ? (
              <>
                {md ? (
                  <Button color="inherit" onClick={() => navigate('/turniere')}>
                    Turniere
                  </Button>
                ) : null}
                {md ? (
                  <Button color="inherit" onClick={() => navigate('/infos')}>
                    Infos
                  </Button>
                ) : null}
              </>
            ) : (
              <>
                {md ? (
                  <Button color="inherit" onClick={() => navigate('/wasistultimate')}>
                    Was ist Ultimate Frisbee
                  </Button>
                ) : null}
                {md ? (
                  <Button color="inherit" onClick={() => navigate('/training')}>
                    Zum Training
                  </Button>
                ) : null}
                <Button color="inherit" onClick={() => navigate('/anmelden')}>
                  Anmelden
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}>
        <DrawerHeader>
          <IconButton onClick={() => setOpen(false)}>
            {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          {navigation
            .filter(({ isPublic }) => isPublic || user)
            .map(({ label, target }) => (
              <ListItem key={target} disablePadding>
                <ListItemButton onClick={() => navigate(target)}>
                  <ListItemText primary={label} />
                </ListItemButton>
              </ListItem>
            ))}
          {user ? (
            <>
              <Divider />
              <ListItem disablePadding>
                <ListItemButton onClick={handleLogout}>
                  <ListItemText primary="Abmelden" />
                </ListItemButton>
              </ListItem>
            </>
          ) : null}
        </List>
      </Drawer>
      <Main drawerWidth={drawerWidth} open={open}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </Main>
    </>
  );
};
export default Layout;
