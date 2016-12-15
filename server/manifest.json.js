const manifest = {
    "name": UltiSite.settings().siteTitle,
    "icons": [],
    "background_color": UltiSite.settings().backgroundColor,
    "theme_color": UltiSite.settings().themeColor,
    "display": "standalone",
    "orientation": "portrait"
};

WebApp.connectHandlers.use("/chrome-manifest", function (req, res, next) {
    const iconres = [36, 48, 72, 96, 128, 144, 192, 256, 384, 512];
    iconres.forEach((res) => {
        manifest.icons.push({
            src: '/dynamicAppIcon?size=' + res,
            sizes: res + 'x' + res,
            type: 'image/png'
        });
    });
    res.writeHead(200, { "content-type": "text/json" });
    res.end(JSON.stringify(manifest));
});


