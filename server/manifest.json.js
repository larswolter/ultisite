const manifest = {
  'name': UltiSite.settings().siteTitle,
  'short_name': UltiSite.settings().siteTitle.split(' ')[0],
  'icons': [36, 48, 72, 96, 128, 144, 192, 256, 384, 512].map((res) => {
    return {
      src: '/dynamicAppIcon?size=' + res,
      sizes: res + 'x' + res,
      type: 'image/png',
    };
  }),
  'background_color': UltiSite.settings().backgroundColor,
  'theme_color': UltiSite.settings().themeColor,
  'display': 'standalone',
  'orientation': 'portrait',
};

WebApp.connectHandlers.use('/chrome-manifest', function (req, res, next) {
  res.writeHead(200, { 'content-type': 'text/json' });
  res.end(JSON.stringify(manifest));
});

