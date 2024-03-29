import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import UltiSite from '../Ultisite';
import Practices from './Practices.jsx';
import { Skeleton } from '@mui/material';
import WikiPage from './WikiPage.jsx';

const Dashboard = () => {
  return (
    <Box display="flex" flexDirection="row" gap={2} width="100%">
      <Box display="flex" flexDirection="column" gap={1} flex={1}>
        <WikiPage name="Startseite" />
      </Box>
      <Box display="flex" flexDirection="column" gap={1} minWidth={300}>
        <Typography variant="h5">Trainingszeiten</Typography>
        <Practices currentOnly />
      </Box>
    </Box>
  );
};

export default Dashboard;
