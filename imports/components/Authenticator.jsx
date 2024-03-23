import React, { createContext, useContext, useEffect, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';

const authContext = createContext({});

const Authenticator = ({ children }) => {
  const user = useTracker(() => Meteor.user());
  return <authContext.Provider value={{ user }}>{children}</authContext.Provider>;
};
export const useAuth = () => useContext(authContext);

export default Authenticator;
