import React, {  } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import UltiSite from '../Ultisite';
import dayjs from 'dayjs';
import { CircularProgress } from '@mui/material';
import Practice from './Practice.jsx';

window.history.replaceState({}, 'Wetter', window.location.toString().split('?')[0]);

const Practices = ({ children, currentOnly }) => {
  const { practices, isLoading } = useTracker(() => {
    const handler = Meteor.subscribe('Practices');

    if (!handler.ready()) {
      return { practices: [], isLoading: true };
    }

    return {
      practices: UltiSite.Practices.find(
        currentOnly
          ? {
              start: { $lte: dayjs().subtract(1, 'week') },
              end: { $gte: dayjs().add(1, 'day') },
            }
          : {}
      ).fetch(),
    };
  });
  console.log(practices, isLoading);
  if (isLoading) return <CircularProgress />;
  return (
    <Box display="flex" flexDirection="column" gap={1} alignItems="center">
      {practices.map((practice) => (
        <Practice practice={practice} key={practice._id} />
      ))}
      {practices.length === 0 ? <Typography>Aktuell keine Trainingszeiten</Typography> : null}
    </Box>
  );
};

export default Practices;
