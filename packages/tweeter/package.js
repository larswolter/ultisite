Npm.depends({});

Package.describe({
    // Short two-sentence summary.
    summary: 'Message plugin for ultisite',
    // Version number.
    version: '1.0.0',
    // Optional.  Default is package directory name.
    name: 'ultisite:tweeter',
    // Optional github URL to your source repository.
    git: '',
});

/* This defines your actual package */
Package.onUse(function (api) {
    api.versionsFrom('1.2.0.1');
    api.use(['less',
        'ecmascript',
        'kadira:flow-router',
        'kadira:blaze-layout',
        'standard-minifiers',
        'meteor-base',
        'mobile-experience',
        'mongo',
        'blaze-html-templates',
        'session',
        'jquery',
        'tracker',
        'logging',
        'reload',
        'random',
        'ejson',
        'spacebars',
        'check',
        'alanning:roles',
        'reactive-var',
    ]);

    api.addFiles(['tweeter.less','tweeter.html', 'tweeter.js'], 'client');
    api.addFiles('server.js', 'server');
});