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

const Dashboard = ({ children }) => {
  const { blogs, isLoading } = useTracker(() => {
    const handler = Meteor.subscribe('BlogsStart');
    const handler2 = Meteor.subscribe('Blogs');

    if (!handler.ready() || !handler2.ready()) {
      return { blogs: [], isLoading: true };
    }

    return { blogs: UltiSite.Blogs.find({}).fetch() };
  });
  console.log(blogs, isLoading);
  return (
    <Box display="flex" flexDirection="column" gap={1}>
      {blogs.map((blog) => (
        <Card sx={{}} key={blog._id}>
          <CardHeader
            action={
              <IconButton aria-label="settings">
                <MoreVertIcon />
              </IconButton>
            }
            title={blog.title}
            subheader={blog.date.toLocaleString('de')}
          />
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              {blog.preview}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default Dashboard;
