import { onPageLoad } from 'meteor/server-render';
import handlebars from 'handlebars';
import { settings, WikiPages } from '../common/lib/ultisite';

onPageLoad(async (sink) => {
  const set = await settings();
  const colorProps = [];
  if(set.secondaryColor)colorProps.push(`--secondary-color: ${set.secondaryColor};`);
  if(set.primaryColor)colorProps.push(`--primary-color: ${set.primaryColor};`);
  if(set.backgroundColor)colorProps.push(`--background-color: ${set.backgroundColor};`);
  sink.appendToHead(
    `<style type="text/css">@media(min-width: 768px) {
      :root {
        ${colorProps.join('\n')}
      }

      #serverRendered .page-content {  padding-top: ${Number((await settings()).titleImageHeight) + 90}px; } }</style>`
  );

  const wiki = await WikiPages.findOneAsync((await settings()).wikiStart);
  const layout = handlebars.compile(await Assets.getTextAsync('mail-templates/static-layout.html'));
  const context = {
    settings: await settings(),
    content: wiki && wiki.content,
  };

  sink.appendToBody(layout(context));
});
