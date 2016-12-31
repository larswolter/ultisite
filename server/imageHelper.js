import sharp from 'sharp';

WebApp.connectHandlers.use('/_image', (req, resp) => {
  if (!req.query.imageId) {
    resp.writeHead(404);
    resp.end('Param imageId required');
    return;
  }
  const image = UltiSite.Images.findOne({_id:req.query.imageId,base64:{$exists:true}});
  if (!image) {
    resp.writeHead(404);
    resp.end('image not found');
    return;
  }
  const size = req.query.size;
  resp.setHeader('Content-Type', size?'image/jpeg':image.type);
  if(size) {
    if(image.thumb && image.thumb[size]) {
      resp.writeHead(200);
      resp.end(new Buffer(image.thumb[size], 'base64'));
    } else {
        const scale=size.split('x').map(x=>Number(x));
        if(scale.length===1)
          scale.push(scale[0]);
        console.log('resizing image', scale);
        sharp(new Buffer(image.base64, 'base64'))
            .resize(scale[0],scale[1])
            .max()
            .toBuffer()
            .then( data => {
                resp.writeHead(200);
                resp.end(data);                
            } )
            .catch( err => {
                resp.writeHead(500);
                resp.end(JSON.stringify(err));
            } );
    }
  } else {
      resp.writeHead(200);
      resp.end(new Buffer(image.base64, 'base64'));
  }
});