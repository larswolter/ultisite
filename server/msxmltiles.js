import { Images } from '../common/lib/ultisite';
import { getEvents } from './events';
import { renderMailTemplate } from './mail';

WebApp.connectHandlers.use('/msxmltiles', function (req, res, next) {
  let query = Npm.require('url').parse(req.url, true).query;
  let content = query.content;
  if (!content) {
    res.writeHead(404);
    res.end();
    return;
  }
  var template = Assets.getText('xml-templates/ms-tiles.xml');
  var layout = Assets.getText('xml-templates/ms-tile-layout.xml');
  var data = {};
  if (content === 'events') {
    let eventList = getEvents(5);
    if (eventList.length > 0) {
      data.header = eventList[0].name;
      eventList[0].detail.forEach((detail, idx) => {
        if (idx < 4) data['text' + (idx + 1)] = detail.text;
      });
    } else {
      data.header = 'Nix passiert';
    }
  }
  if (content === 'images') {
    let img = Images.findOne({ tags: 'Teamfoto' }, { sort: { created: -1 }, fields: { base64: 0 } });
    if (img) {
      data.image = Meteor.absoluteUrl(img.url(150));
      data.header = 'Teamfoto';
    }
  }
  res.writeHead(200, { 'content-type': 'application/xml' });
  res.end(renderMailTemplate(layout, template, data));
});
