import sharp from 'sharp';
import { Images } from '../common/lib/ultisite';

WebApp.connectHandlers.use('/_image', (req, resp) => {
  if (!req.query.imageId) {
    resp.writeHead(404);
    resp.end('Param imageId required');
    return;
  }
  const image = Images.findOne({ _id: req.query.imageId, base64: { $exists: true } });
  if (!image) {
    resp.writeHead(404);
    resp.end('image not found');
    return;
  }
  const { size } = req.query;
  resp.setHeader('Content-Type', size ? 'image/jpeg' : image.type);
  resp.setHeader('Cache-Control', 'max-age=864000');
  if (size) {
    if (image.thumb && image.thumb[size]) {
      const buf = Buffer.from(image.thumb[size], 'base64');
      resp.setHeader('Content-Length', buf.length + '');
      resp.writeHead(200);
      resp.end(buf);
    } else {
      const scale = size.split('x').map((x) => Number(x));
      if (scale.length === 1) {
        scale.push(scale[0]);
      }
      console.log('resizing image', scale);
      sharp(Buffer.from(image.base64, 'base64'))
        .resize(scale[0], scale[1], { fit: 'inside', withoutEnlargement: true })
        .toFormat('jpeg')
        .toBuffer()
        .then(
          Meteor.bindEnvironment((data) => {
            if (scale[0] + scale[1] < 400 || scale[0] + scale[1] === 1600) {
              const thumb = {};
              thumb['thumb.' + size] = data.toString('base64');
              Images.update(image._id, { $set: thumb });
            }
            resp.setHeader('Content-Length', data.length + '');
            resp.writeHead(200);
            resp.end(data);
          })
        )
        .catch((err) => {
          console.log(err);
          resp.writeHead(500);
          resp.end(JSON.stringify(err));
        });
    }
  } else {
    const buf = Buffer.from(image.base64, 'base64');
    resp.setHeader('Content-Length', buf.length + '');
    resp.writeHead(200);
    resp.end(buf);
  }
});
