import './wysiwyg.less';
import './wysiwyg.html';

const htmlEncode = function (string) {
  return string.replace(/[&<>"]/g, function (tag) {
    const charsToReplace = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
    };
    return charsToReplace[tag] || tag;
  });
};


Template.ultisiteWysiwyg.onRendered(function () {
  const template = this;
  import('wysiwyg.js').then((wysiwyg) => {
    template.textEditor = wysiwyg.default({
      element: template.$('textarea')[0],
    });
    template.textEditor.getElement().classList.add('rich-text-input');
    template.syncField = () => {
      template.textEditor.sync();
      template.$('textarea').trigger('change');
    };
    template.textEditor.getElement().addEventListener('keyup', template.syncField);
  });
  this.scrollHandler = function() {
    if (this.$('.ultisite-wysiwyg').offset().top - $(window).scrollTop() < 50) {
      this.$('.wysiwyg-toolbar').addClass('fixed');
    } else {
      this.$('.wysiwyg-toolbar').removeClass('fixed');
    }
  };
  $(window).on('scroll', this.scrollHandler);
});
Template.ultisiteWysiwyg.onDestroyed(function () {
  $(window).off('scroll', this.scrollHandler);
});

Template.ultisiteWysiwyg.events({
  'click .bold' (evt, tmpl) {
    evt.preventDefault();
    tmpl.textEditor.bold();
    tmpl.syncField();
  },
  'click .italic' (evt, tmpl) {
    evt.preventDefault();
    tmpl.textEditor.italic();
    tmpl.syncField();
  },
  'click .underline' (evt, tmpl) {
    evt.preventDefault();
    tmpl.textEditor.underline();
    tmpl.syncField();
  },
  'click .strikethrough' (evt, tmpl) {
    evt.preventDefault();
    tmpl.textEditor.strikethrough();
    tmpl.syncField();
  },
  'click .list-ul' (evt, tmpl) {
    evt.preventDefault();
    tmpl.textEditor.insertList(false);
    tmpl.syncField();
  },
  'click .list-ol' (evt, tmpl) {
    evt.preventDefault();
    tmpl.textEditor.insertList(true);
    tmpl.syncField();
  },
  'click .remove-format' (evt, tmpl) {
    evt.preventDefault();
    tmpl.textEditor.removeFormat();
    tmpl.syncField();
  },
  'click .add-image' (evt, tmpl) {
    evt.preventDefault();
    import('/imports/client/files/files.js').then(() => {
      UltiSite.fileBrowserShowDialog(tmpl.data.source._id, function (fileObj) {
        if (fileObj) {
          const path = FlowRouter.path("image", {
            _id: fileObj._id,
          });
          tmpl.textEditor.insertHTML(`<div class="editable-image"><a href="${path}"><img src="${fileObj.url(120)}"></a></div>`);
        }
        UltiSite.fileBrowserHideDialog();
      });
    });
  },
  'click .add-video' (evt, tmpl) {
    evt.preventDefault();
    UltiSite.getTextDialog({ text: 'Gib eine Video URL ein', header: 'Video einfügen' }, function (text) {
      if (text) {
        tmpl.textEditor.insertHTML(`<video src="${htmlEncode(text)}" />`);
      }
    });
  },
  'click .forecolor' (evt, tmpl) {
    evt.preventDefault();
    const color = tmpl.$(evt.currentTarget).attr('data-color');
    tmpl.textEditor.forecolor(color);
    tmpl.syncField();
  },
});
