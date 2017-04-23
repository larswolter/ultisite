Meteor.startup(function () {
    if (Meteor.isServer) {
        Inject.rawBody('jquery', '<script type="text/javascript" src="/libs/jquery-3.2.1.slim.min.js"></script>');
        Inject.rawHead('loadingInjection', '<style type="text/css">' +
            'body {background-color:' + UltiSite.settings().backgroundColor + ';} ' +
            '#injectedLoadingIndicator { position:fixed;bottom:0px;left:0px;right:0px;z-index:0;text-align:center;font-size:20px;padding:50px 10px;}' +
            '#injectedLoadingImage { position:fixed;top:50%;text-align:center;width:100%;margin-top:-64px;}' +
            '</style>');

        Inject.rawBody('loadingInjection', '<div id="injectedLoadingIndicator">' +
            '<span class="fa fa-spinner fa-spin" ></span> Lade ' + UltiSite.settings().teamname + ' WebApp' +
            '</div>' +
            '<div id="injectedLoadingImage">' +
            '<img src="/dynamicAppIcon?size=128" />' +
            '</div>');
    }/*
    if (Meteor.isClient)
        /$('#injectedLoadingIndicator, #injectedLoadingImage').fadeOut();
*/
});
