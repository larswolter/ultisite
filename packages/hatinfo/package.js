Npm.depends({});

Package.describe({
  // Short two-sentence summary.
  summary: 'Hat Info request plugin for ultisite',
  // Version number.
  version: '1.0.0',
  // Optional.  Default is package directory name.
  name: 'ultisite:hatinfo',
  // Optional github URL to your source repository.
  git: '',
});

/* This defines your actual package */
Package.onUse(function (api) {
  api.versionsFrom('2.13');
  api.use([
    'fourseven:scss',
    'ecmascript',
    'ostrio:flow-router-extra',
    'standard-minifiers',
    'meteor-base',
    'mobile-experience',
    'mongo',
    'blaze-html-templates',
    'session',
    'tracker',
    'logging',
    'reload',
    'random',
    'ejson',
    'spacebars',
    'underscore',
    'check',
    'reactive-var',
    'ultisite:autoform',
  ]);
  api.mainModule('client/client.js', 'client');
  api.mainModule('server/server.js', 'server');
  api.addAssets(['private/confirm.html', 'private/reminder.html'], 'server');
});
