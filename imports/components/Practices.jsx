import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import UltiSite from '../Ultisite';
import dayjs from 'dayjs';
import { Skeleton } from '@mui/material';
import Practice from './Practice.jsx';
import WikiPage from './WikiPage.jsx';

window.history.replaceState({}, 'Wetter', window.location.toString().split('?')[0]);

const Practices = ({ currentOnly }) => {
  const { practices, isLoading } = useTracker(() => {
    const handler = Meteor.subscribe('Practices');

    if (!handler.ready()) {
      return { practices: [], isLoading: true };
    }

    return {
      practices: UltiSite.Practices.find(
        currentOnly
          ? {
              start: { $lte: dayjs().add(1, 'week').toDate() },
              end: { $gte: dayjs().subtract(1, 'day').toDate() },
            }
          : {}
      ).fetch(),
    };
  });
  console.log(practices);

  return (
    <Box display="flex" flexDirection="row" flexWrap="wrap" gap={2} alignItems="stretch" justifyContent="space-evenly">
      {!currentOnly ? <WikiPage name="Trainings" /> : null}
      {isLoading ? (
        <Practice />
      ) : (
        <>
          {practices.map((practice) => (
            <Practice practice={practice} key={practice._id} />
          ))}
          {practices.length === 0 ? <Typography>Aktuell keine Trainingszeiten</Typography> : null}
        </>
      )}
    </Box>
  );
};

export default Practices;
