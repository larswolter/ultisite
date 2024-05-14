import { Meteor } from 'meteor/meteor';

const refreshDownloadToken = function (userId) {
  Meteor.users.update(userId, {
    $set: {
      'profile.downloadToken': Random.id(40),
    },
  });
};

Accounts.onLogin(function (attempt) {
  refreshDownloadToken(attempt.user && attempt.user._id);
});
Accounts.onLogout(function (attempt) {
  refreshDownloadToken(attempt.user && attempt.user._id);
});

