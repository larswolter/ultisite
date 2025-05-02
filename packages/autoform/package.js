Package.describe({
  // Short two-sentence summary.
  summary: 'Formular plugin for ultisite with autform api',
  // Version number.
  version: '1.0.0',
  // Optional.  Default is package directory name.
  name: 'ultisite:autoform',
  // Optional github URL to your source repository.
  git: '',
});

/* This defines your actual package */
Package.onUse(function (api) {
  api.versionsFrom('1.4.3.1');
  api.use(['ecmascript', 'meteor-base', 'modules', 'mongo', 'underscore', 'check']);
  api.use(
    [
      'fourseven:scss',
      'standard-minifiers',
      'mobile-experience',
      'blaze-html-templates',
      'session',
      'tracker',
      'logging',
      'reload',
      'random',
      'ejson',
      'spacebars',
      'reactive-var',
    ],
    'client'
  );
  //    api.addFiles('server.js','server');
  //    api.addFiles(['client.js', 'forms.html', 'forms.js'],'client');
  api.mainModule('client/client.js', 'client');

  api.mainModule('server.js', 'server');
  //    api.export('AutoForm', 'client');
});
