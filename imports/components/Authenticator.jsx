import React, { useEffect, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';

window.history.replaceState({}, 'Wetter', window.location.toString().split('?')[0]);

const Authenticator = ({ children }) => {
  const user = useTracker(() => Meteor.user());
  return children;
};

export default Authenticator;
