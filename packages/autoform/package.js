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
    api.use(['less',
        'ecmascript',
        'kadira:blaze-layout',
        'standard-minifiers',
        'meteor-base',
        'modules',
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
        'aldeed:simple-schema',
        'reactive-var'
    ]);
//    api.addFiles('server.js','server');
//    api.addFiles(['client.js', 'forms.html', 'forms.js'],'client');
    api.mainModule('client.js', 'client');
    api.mainModule('server.js', 'server');
//    api.export('AutoForm', 'client');
});