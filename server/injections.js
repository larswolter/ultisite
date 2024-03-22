import { onPageLoad } from 'meteor/server-render';
import handlebars from 'handlebars';

onPageLoad((sink) => {
  sink.appendToHead(`  <title>Ultisite</title>
  <meta charset="utf-8"/>
  <meta http-equiv="x-ua-compatible" content="ie=edge"/>
  <meta
      name="viewport"
      content="width=device-width, height=device-height, viewport-fit=cover, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no"
  />
  <meta name="mobile-web-app-capable" content="yes"/>
  <meta name="apple-mobile-web-app-capable" content="yes"/>
`);

  const wiki = UltiSite.WikiPages.findOne(UltiSite.settings().wikiStart);
  const layout = handlebars.compile(Assets.getText('mail-templates/static-layout.html'));
  const context = {
    settings: UltiSite.settings(),
    content: wiki && wiki.content,
  };

  sink.appendToBody('<div id="react-target"></div>');
});
