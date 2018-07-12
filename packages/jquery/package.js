Package.describe({
  name: 'jquery',
  summary: 'jQuery replacement',
  version: '1.11.12',
});

Package.onUse(function (api) {
  api.use('ecmascript');
  api.mainModule('main.js', 'client');
});
