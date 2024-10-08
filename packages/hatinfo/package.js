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
  api.versionsFrom('1.2.0.1');
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
    'alanning:roles',
    'reactive-var',
    'ultisite:autoform',
  ]);

  api.addFiles(['schema.js'], ['client', 'server']);
  api.addFiles(['client/hat.html', 'client/hat.js', 'client/hat.scss'], 'client');
  api.addFiles('server/hat.js', 'server');
  api.addAssets(['private/confirm.html', 'private/reminder.html'], 'server');
});
