import { ReactiveVar } from 'meteor/reactive-var';

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

Template.ultisiteWysiwyg.onCreated(function () {
  this.state = new ReactiveVar({});
});
Template.ultisiteWysiwyg.onRendered(function () {
  const template = this;
  import('wysiwyg.js').then((wysiwyg) => {
    template.textEditor = wysiwyg.default({
      element: template.$('textarea')[0],
    });
    UltiSite.wysi = template.textEditor;
    template.textEditor.getElement().classList.add('rich-text-input');
    template.syncField = () => {
      template.textEditor.sync();
      template.$('textarea').trigger('change');
      this.selectHandler();
    };
    template.textEditor.getElement().addEventListener('keyup', template.syncField);
  });
  this.selectHandler = () => {
    const state = {};
    const checkState = (elem) => {
      if (!elem) {
        return;
      }
      if (elem.tagName === 'B') {
        state.bold = true;
      }
      if (elem.tagName === 'I') {
        state.italic = true;
      }
      if (elem.tagName === 'FONT') {
        state.color = true;
      }
      if (elem.tagName === 'STRIKE') {
        state.strikethrough = true;
      }
      if (elem.tagName === 'U') {
        state.underline = true;
      }
      if (elem.tagName === 'UL') {
        state.listUl = true;
      }
      if (elem.tagName === 'OL') {
        state.listOl = true;
      }
      if (elem.tagName === 'H1') {
        state.heading = 1;
      }
      if (elem.tagName === 'H2') {
        state.heading = 2;
      }
      if (elem.tagName === 'H3') {
        state.heading = 3;
      }
      if (elem.tagName === 'H4') {
        state.heading = 4;
      }
      state.align = elem.style && elem.style.textAlign;
    };
    let elem = document.getSelection().anchorNode && document.getSelection().anchorNode.parentNode;
    while (elem && elem.className !== 'rich-text-input') {
      checkState(elem);
      elem = elem.parentNode;
    }
    this.state.set(state);
  };
  document.addEventListener("selectionchange", this.selectHandler);

  this.scrollHandler = function () {
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
  $(window).off('selectionchange', this.selectHandler);
});
Template.ultisiteWysiwyg.helpers({
  state() {
    return Template.instance().state.get();
  },
});

Template.ultisiteWysiwyg.events({
  'click .bold'(evt, tmpl) {
    evt.preventDefault();
    tmpl.textEditor.bold();
    tmpl.syncField();
  },
  'click .italic'(evt, tmpl) {
    evt.preventDefault();
    tmpl.textEditor.italic();
    tmpl.syncField();
  },
  'click .underline'(evt, tmpl) {
    evt.preventDefault();
    tmpl.textEditor.underline();
    tmpl.syncField();
  },
  'click .strikethrough'(evt, tmpl) {
    evt.preventDefault();
    tmpl.textEditor.strikethrough();
    tmpl.syncField();
  },
  'click .list-ul'(evt, tmpl) {
    evt.preventDefault();
    tmpl.textEditor.insertList(false);
    tmpl.syncField();
  },
  'click .list-ol'(evt, tmpl) {
    evt.preventDefault();
    tmpl.textEditor.insertList(true);
    tmpl.syncField();
  },
  'click .remove-format'(evt, tmpl) {
    evt.preventDefault();
    tmpl.textEditor.removeFormat();
    tmpl.syncField();
  },
  'click .align-right'(evt, tmpl) {
    evt.preventDefault();
    if (evt.currentTarget.className.indexOf('active') >= 0) {
      tmpl.textEditor.align('left');
    } else {
      tmpl.textEditor.align('right');
    }
    tmpl.syncField();
  },
  'click .align-center'(evt, tmpl) {
    evt.preventDefault();
    if (evt.currentTarget.className.indexOf('active') >= 0) {
      tmpl.textEditor.align('left');
    } else {
      tmpl.textEditor.align('center');
    }
    tmpl.syncField();
  },
  'click .align-justify'(evt, tmpl) {
    evt.preventDefault();
    if (evt.currentTarget.className.indexOf('active') >= 0) {
      tmpl.textEditor.align('left');
    } else {
      tmpl.textEditor.align('justify');
    }
    tmpl.syncField();
  },
  'click .add-image'(evt, tmpl) {
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
  'click .rich-text-input a'(evt, tmpl) {
    evt.preventDefault();
    evt.stopPropagation();
    const linkElem = evt.currentTarget;
    console.log('clicked', linkElem, linkElem.parentNode, linkElem.parentNode.className);
    if (linkElem.parentNode.className.indexOf('editable-image') >= 0) {
      UltiSite.showModal('editImageDialog', {
        elem: linkElem.parentNode,
        callback() {
          tmpl.syncField();
        },
      });
    } else {
      UltiSite.getTextDialog({ text: linkElem.href, header: 'Link ändern' }, function (text) {
        if (text) {
          linkElem.href = text;
          tmpl.syncField();
        }
      });
    }
  },
  'click .add-video'(evt, tmpl) {
    evt.preventDefault();
    UltiSite.getTextDialog({ text: 'Gib eine Video URL ein', header: 'Video einfügen' }, function (text) {
      if (text) {
        tmpl.textEditor.insertHTML(`<video src="${htmlEncode(text)}" />`);
      }
    });
  },
  'click .add-link'(evt, tmpl) {
    evt.preventDefault();
    tmpl.textEditor.openPopup();
    UltiSite.getTextDialog({ text: 'https://', header: 'Link einfügen' }, function (text) {
      if (text) {
        tmpl.textEditor.closePopup();
        tmpl.textEditor.insertLink(text);
        tmpl.syncField();
      }
    });
  },
  'click .forecolor'(evt, tmpl) {
    evt.preventDefault();
    const color = tmpl.$(evt.currentTarget).attr('data-color');
    tmpl.textEditor.forecolor(color);
    tmpl.syncField();
  },
  'click .headings a'(evt, tmpl) {
    evt.preventDefault();
    const heading = tmpl.$(evt.currentTarget).attr('class');
    tmpl.textEditor.format(heading);
    tmpl.syncField();
  },
});

Template.editImageDialog.onCreated(function () {
  this.imgInfo = new ReactiveVar({});
  this.elem = new ReactiveVar();
  this.autorun(() => {
    const elem = Template.currentData().elem;
    this.elem.set(elem);
    const imgLink = elem.children[0].children[0].src.split(/[\?\&]/);
    this.imgInfo.set({
      size: imgLink[2].split('=')[1],
      id: imgLink[1].split('=')[1],
      pos: elem.className.replace('editable-image', '').trim(),
    });
  });
});

Template.editImageDialog.helpers({
  imgInfo() {
    return Template.instance().imgInfo.get();
  },
  sizes() {
    return [80, 120, 160, 200, 240, 320, 480];
  },
});

Template.editImageDialog.events({
  'click .action-set-size'(evt, tmpl) {
    evt.preventDefault();
    const cur = tmpl.imgInfo.get();
    cur.size = this;
    tmpl.imgInfo.set(cur);
  },
  'click .action-set-left'(evt, tmpl) {
    evt.preventDefault();
    const cur = tmpl.imgInfo.get();
    cur.pos = 'pull-left';
    tmpl.imgInfo.set(cur);
  },
  'click .action-set-line'(evt, tmpl) {
    evt.preventDefault();
    const cur = tmpl.imgInfo.get();
    cur.pos = '';
    tmpl.imgInfo.set(cur);
  },
  'click .action-set-right'(evt, tmpl) {
    evt.preventDefault();
    const cur = tmpl.imgInfo.get();
    cur.pos = 'pull-right';
    tmpl.imgInfo.set(cur);
  },
  'click .action-apply'(evt, tmpl) {
    evt.preventDefault();
    const cur = tmpl.imgInfo.get();
    tmpl.elem.get().className = `editable-image ${cur.pos}`;
    tmpl.elem.get().children[0].children[0].src = `/_image?imageId=${cur.id}&size=${cur.size}`;
    Template.currentData().callback();
    UltiSite.hideModal();
  },
  'click .action-remove'(evt, tmpl) {
    evt.preventDefault();
    tmpl.elem.get().parentNode.removeChild(tmpl.elem.get());
    Template.currentData().callback();
    UltiSite.hideModal();
  },
});
