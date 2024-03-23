import React, { useEffect, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { red } from '@mui/material/colors';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import UltiSite from '../Ultisite';

window.history.replaceState({}, 'Wetter', window.location.toString().split('?')[0]);

const Practices = ({ children }) => {
  const { practices, isLoading } = useTracker(() => {
    const handler = Meteor.subscribe('Practices');

    if (!handler.ready()) {
      return { practices: [], isLoading: true };
    }

    return { practices: UltiSite.Practices.find({}).fetch() };
  });
  console.log(practices, isLoading);
  return (
    <Box display="flex" flexDirection="column" gap={1}>
      {practices.map((practice) => (
        <Card sx={{}} key={practice._id}>
          <CardHeader
            action={
              <IconButton aria-label="settings">
                <MoreVertIcon />
              </IconButton>
            }
            title={practice.weekday}
            subheader={practice.address.street}
          />
          <CardMedia component="img" height="200" image={'/_image?imageId=' + practice.mapImage} alt="Karte" />
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              {practice.description}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default Practices;
