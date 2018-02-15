import { onPageLoad } from 'meteor/server-render';

onPageLoad((link) => {
  link.appendToBody('<script type="text/javascript" src="/libs/jquery-3.2.1.min.js"></script>');
  link.appendToHead(`${'<style type="text/css">' +
    'body {background-color:'}${UltiSite.settings().backgroundColor};} ` +
    'iframe.static-start-page {z-index:1;position:absolute;overflow:hidden; border:none; width:100%;height:100%;padding:0px;margin:0px;}' +
    '</style>');

  link.appendToBody('<iframe class="static-start-page" src="/staticStartpage"></iframe>');
});
