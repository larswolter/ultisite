Npm.depends({});

Package.describe({
    // Short two-sentence summary.
    summary: "Offline collection caching using localforage",
    // Version number.
    version: "1.0.0",
    // Optional.  Default is package directory name.
    name: "ultisite:offline-col-cache",
    // Optional github URL to your source repository.
    git: "",
});

/* This defines your actual package */
Package.onUse(function (api) {
    api.versionsFrom('1.2.0.1');
    api.addFiles("offline.js", "client");
    api.export('OfflineColCache')
});