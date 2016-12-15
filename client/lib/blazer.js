var viewMap = window.viewMap = {};
var HTML = Package.htmljs.HTML

Template.cacher = new Template("Template.cacher", function() {
  var wrapperView = this;
  var templateName = Spacebars.call(wrapperView.lookup("template"));
  var id = Spacebars.call(wrapperView.lookup("id"));
  var data = Spacebars.call(wrapperView.lookup("data")) || {};

  if(!templateName) {
    throw new Error("Template name is required");
  }

  var baseView = Blaze._TemplateWith({}, function() {
    return HTML.Raw('<p></p>');
  });

  var view = viewMap[id];
  if(!view) {
    view = Blaze._TemplateWith(data, function() {
      return Spacebars.include(Template[templateName]);
    });
    viewMap[id] = view;
    view.dom = $('<div></div>');
    Blaze.render(view, view.dom.get(0));
    view._superView = true;
    view._domrange._superRange = true;
  }

  baseView.onViewReady(function() {
    // here's we mark this node to destroy innter elements
    // we need to override Blaze._destroyNode to overcome this
    this.firstNode()._ignoreElements = true;
    
    // now we need to append our original node here
    $(this.firstNode()).append(view.dom);
  });

  return baseView;
});

var originalDestroyNode = Blaze._destroyNode;
Blaze._destroyNode = function(elem) {
  // We don't need to if the element marked with ignoreElements
  if(elem._ignoreElements) {
    return;
  }

  originalDestroyNode(elem);
};