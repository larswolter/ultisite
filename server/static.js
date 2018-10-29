import handlebars from 'handlebars';


WebApp.connectHandlers.use('/staticStartpage', function (req, res, next) {
  const wiki = UltiSite.WikiPages.findOne(UltiSite.settings().wikiStart);
  const layout = handlebars.compile(Assets.getText('mail-templates/static-layout.html'));
  const context = {
    settings: UltiSite.settings(),
    content: wiki && wiki.content,
  };

  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.write('<html><head>');
  res.write('<link rel="stylesheet" type="text/css" class="__meteor-css__" href="/merged-stylesheets.css">');
  res.write(`<style type="text/css">@media(min-width: 768px) {#serverRendered .page-content {  padding-top: ${Number(UltiSite.settings().titleImageHeight || 150) + 90}px; } }</style>`);
  res.write('</head><body>');
  res.write(layout(context));
  res.write('</body></html>');
  res.end();
});
