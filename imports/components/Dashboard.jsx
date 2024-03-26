import React, {  } from 'react';
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
import { CircularProgress } from '@mui/material';

window.history.replaceState({}, 'Wetter', window.location.toString().split('?')[0]);

const Dashboard = ({ children }) => {
  const { blogs, isLoading } = useTracker(() => {
    const handler = Meteor.subscribe('BlogsStart');
    const handler2 = Meteor.subscribe('Blogs', 3);

    if (!handler.ready() || !handler2.ready()) {
      return { blogs: [], isLoading: true };
    }

    return { blogs: UltiSite.Blogs.find({}).fetch() };
  });
  console.log(blogs, isLoading);
  return (
    <Box display="flex" flexDirection="row" gap={1} width="100%">
      <Box display="flex" flexDirection="column" gap={1}>
        <Typography variant="h5">Aktuelle Infos</Typography>
        {isLoading ? (
          <CircularProgress />
        ) : (
          blogs.map((blog) => (
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
          ))
        )}
        {blogs.length === 0 ? <Typography>Keine Einträge vorhanden</Typography> : null}
      </Box>
      <Box>
        <Typography variant="h5">Trainingszeiten</Typography>
        <Practices currentOnly />
      </Box>
    </Box>
  );
};

export default Dashboard;
