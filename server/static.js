import handlebars from 'handlebars';


WebApp.connectHandlers.use("/staticStartpage", function(req, res, next) {
    const query = Npm.require('url').parse(req.url,true).query;
    const wiki = UltiSite.WikiPages.findOne(UltiSite.settings().wikiStart);
    const layout = handlebars.compile(Assets.getText('mail-templates/static-layout.html'));
    const context = {
        settings: UltiSite.settings(),
        content: ''
    };
    res.writeHead(200,{ "content-type": "text/html; charset=utf-8" });
    res.end(layout(context));
});
