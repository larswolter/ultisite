import handlebars from 'handlebars';
import { settings, WikiPages } from '../common/lib/ultisite';

WebApp.connectHandlers.use('/staticStartpage', function (req, res, next) {
  const wiki = WikiPages.findOne(settings().wikiStart);
  const layout = handlebars.compile(Assets.getText('mail-templates/static-layout.html'));
  const context = {
    settings: settings(),
    content: wiki && wiki.content,
  };

  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.write('<html lang="de"><head>');
  res.write('<link rel="stylesheet" type="text/css" class="__meteor-css__" href="/merged-stylesheets.css">');
  res.write(
    `<style type="text/css">@media(min-width: 768px) {#serverRendered .page-content {  padding-top: ${
      Number(settings().titleImageHeight || 150) + 90
    }px; } }</style>`
  );
  res.write('</head><body>');
  res.write(layout(context));
  res.write('</body></html>');
  res.end();
});
