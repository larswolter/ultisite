import { settings } from '../common/lib/ultisite';

const manifest = {
  start_url: Meteor.absoluteUrl('/'),
  name: (await settings()).siteTitle,
  short_name: (await settings()).siteTitle && (await settings()).siteTitle.split(' ')[0],
  icons: [36, 48, 72, 96, 128, 144, 192, 256, 384, 512].map((res) => {
    return {
      src: '/dynamicAppIcon.png?size=' + res,
      sizes: res + 'x' + res,
      type: 'image/png',
    };
  }),
  background_color: (await settings()).backgroundColor,
  theme_color: (await settings()).secondaryColor,
  display: 'standalone',
  orientation: 'portrait',
};

WebApp.connectHandlers.use('/chrome-manifest', function (req, res, next) {
  res.writeHead(200, { 'content-type': 'text/json' });
  res.end(JSON.stringify(manifest));
});
