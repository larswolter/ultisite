Meteor.startup(function () {
  if (Meteor.isServer) {
    Inject.rawBody('jquery', '<script type="text/javascript" src="/libs/jquery-3.2.1.min.js"></script>');
    Inject.rawHead('loadingInjection', `${'<style type="text/css">' +
            'body {background-color:'}${UltiSite.settings().backgroundColor};} ` +
            `iframe.static-start-page {z-index:1;position:absolute;overflow:hidden; border:none; width:100%;height:100%;padding:0px;margin:0px;}` +
            `</style>`);

    Inject.rawBody('loadingInjection',
            '<iframe class="static-start-page" src="/staticStartpage"></iframe>');
  }
});
