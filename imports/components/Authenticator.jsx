import React, { createContext, useContext } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';

const authContext = createContext({});

const Authenticator = ({ children }) => {
  const user = useTracker(() => Meteor.user());
  return <authContext.Provider value={{ user }}>{children}</authContext.Provider>;
};
export const useAuth = () => useContext(authContext);

export default Authenticator;
