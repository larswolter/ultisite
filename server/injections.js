import { onPageLoad } from 'meteor/server-render';
import handlebars from 'handlebars';

onPageLoad((sink) => {
  sink.appendToBody('<script type="text/javascript" src="/libs/jquery-3.2.1.min.js"></script>');

  const wiki = UltiSite.WikiPages.findOne(UltiSite.settings().wikiStart);
  const layout = handlebars.compile(Assets.getText('mail-templates/static-layout.html'));
  const context = {
    settings: UltiSite.settings(),
    content: wiki.content,
  };

  sink.appendToBody(layout(context));
});
