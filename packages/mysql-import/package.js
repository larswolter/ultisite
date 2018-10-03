Npm.depends({});

Package.describe({
    // Short two-sentence summary.
    summary: "Importing data from mysql source with dj dahlem scheme",
    // Version number.
    version: "1.0.0",
    // Optional.  Default is package directory name.
    name: "ultisite:mysql-import",
    // Optional github URL to your source repository.
    git: "",
});

/* This defines your actual package */
Package.onUse(function (api) {
    api.use(['fourseven:scss',
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
        'pcel:mysql'
    ]);
    api.versionsFrom('1.2.0.1');
    api.addFiles("import.js", "server");
    api.addFiles(["import-template.html", "import-template.js"], "client");
});