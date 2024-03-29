import React from 'react';
import { useTracker } from 'meteor/react-meteor-data';

const AdminStuff = ({ children }) => {
  const user = useTracker(() => Meteor.user());
  if (!user) return null;
  if (user.roles && user.roles.includes('admin')) return <>{children}</>;
  return null;
};

export default AdminStuff;
