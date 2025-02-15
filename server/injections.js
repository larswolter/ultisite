import { onPageLoad } from 'meteor/server-render';
import handlebars from 'handlebars';

onPageLoad((sink) => {
  sink.appendToHead(
    `<style type="text/css">@media(min-width: 768px) {#serverRendered .page-content {  padding-top: ${
      Number(settings().titleImageHeight) + 90
    }px; } }</style>`
  );

  const wiki = WikiPages.findOne(settings().wikiStart);
  const layout = handlebars.compile(Assets.getText('mail-templates/static-layout.html'));
  const context = {
    settings: settings(),
    content: wiki && wiki.content,
  };

  sink.appendToBody(layout(context));
});
