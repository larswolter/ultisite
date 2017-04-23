Npm.depends({});

Package.describe({
    // Short two-sentence summary.
    summary: 'Telegram Bot plugin for ultisite',
    // Version number.
    version: '1.0.0',
    // Optional.  Default is package directory name.
    name: 'ultisite:telegram-bot',
    // Optional github URL to your source repository.
    git: '',
});

/* This defines your actual package */
Package.onUse(function (api) {
    api.versionsFrom('1.2.0.1');
    api.use(['less',
    'kadira:flow-router',
    'momentjs:moment',
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
            ]);

    api.addFiles(['client/config.html', 'client/config.js'], 'client');
    api.addFiles('server/telegram.js', 'server');
});