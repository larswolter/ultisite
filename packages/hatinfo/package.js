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
    api.use(['less',
        'ecmascript',
        'kadira:flow-router',
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
        'check',
        'alanning:roles',
        'reactive-var',
        'ultisite:autoform',
    ]);

    api.addFiles(['schema.js'], ['client','server']);
    api.addFiles(['client/hat.html', 'client/hat.js', 'client/hat.less'], 'client');
    api.addFiles('server/hat.js', 'server');
});