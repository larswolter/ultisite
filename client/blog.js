const activeImage = new ReactiveVar(null);
const activePublication = new ReactiveVar(false);

function getBlog() {
  return UltiSite.Blogs.findOne({
    _id: FlowRouter.getParam('_id'),
  }) || {};
}

Meteor.startup(function () {
  UltiSite.registerStartPageTemplate({
    name: 'Artikel',
    template: 'blogsStart',
    route: 'blog',
  });
});

Template.blogs.onCreated(function () {
  this.limit = new ReactiveVar(10);
  this.autorun(() => {
    this.subscribe('Blogs', this.limit.get());
  });
});
Template.blogsStart.onCreated(function () {
  this.subscribe('BlogsStart');
});

Template.blogs.helpers({
  blogs() {
    return UltiSite.Blogs.find({}, {
      sort: {
        date: -1,
      },
    });
  },
});
Template.blogsStart.helpers({
  blogs() {
    return UltiSite.Blogs.find({}, {
      limit: 3,
      sort: {
        date: -1,
      },
    });
  },
});


Template.blog.onCreated(function () {
  const self = this;
  self.autorun(() => {
    self.subscribe('Blog', FlowRouter.getParam('_id'));
  });
  self.autorun(function () {
    const blog = getBlog();
    self.data = blog;
  });
});

Template.blog.helpers({
  blog() {
    return getBlog();
  },
  canRemove() {
    return UltiSite.isAdmin() || (getBlog() && getBlog().author === Meteor.userId());
  },
});

Template.blog.events({
  'click .action-remove-blog': function (evt) {
    UltiSite.confirmDialog('Willst du den Artikel wirklich löschen?', () => {
      UltiSite.Blogs.remove(FlowRouter.getParam('_id'));
      FlowRouter.go('blog');
    });
  },
});


Template.blogPreview.helpers({
  blog() {
    return this;
  },
});

Template.blogPreview.events({
  'click .action-preview-extender, click .blog-preview-text': function (evt, tmpl) {
    tmpl.$('.blog-container').addClass('extended');
    tmpl.$('.action-preview-extender').fadeOut(200);
  },
});

Template.blogUpdate.onCreated(function () {
  const self = this;
  this.wysiwygLoaded = new ReactiveVar(false);
  this.autorun((comp) => {
    if (!Meteor.user()) { return; }
    import('/imports/client/forms/wysiwyg.js').then(() => this.wysiwygLoaded.set(true));
  });
  self.autorun(function () {
    self.subscribe('Blog', FlowRouter.getParam('_id'));
  });
  self.autorun(function () {
    const blog = getBlog();
    console.log('resetting image to blog');
    activeImage.set(blog.image);
    activePublication.set(blog.public);
  });
});

Template.blogUpdate.helpers({
  wysiwygLoaded() {
    return Template.instance().wysiwygLoaded.get();
  },
  isPublic() {
    return activePublication.get();
  },
  imageId() {
    return activeImage.get();
  },
  blog() {
    return getBlog();
  },
});

const imageSelect = function (item) {
  console.log('setting active image', item);
  UltiSite.fileBrowserHideDialog();
  if (item) { activeImage.set(item._id); } else { activeImage.set(undefined); }
};

Template.blogUpdate.events({
  'click .btn-edit-image': function (e, t) {
    e.preventDefault();
    const id = $('.blogUpdateForm input.id').val();

    UltiSite.fileBrowserShowDialog(id, imageSelect);
  },
  'click .btn-remove-image': function (e, t) {
    e.preventDefault();
    activeImage.set(undefined);
  },
  'click .fa-square-o': function () {
    activePublication.set(!activePublication.get());
  },
  'click .btn-cancel': function (e, t) {
    FlowRouter.go('blog', {
      _id: t.data._id,
      edit: undefined,
    });
  },
  'submit .blogUpdateForm': function (e, t) {
    e.preventDefault();
    const content = t.$('textarea.wysiwyg-textarea').val();
    const title = t.$('input.title').val();
    const id = t.$('input.id').val();
    const image = activeImage.get();
    const isPublic = activePublication.get();
    const div = document.createElement('div');
    div.innerHTML = content;
    const preview = (div.textContent || div.innerText || '').substr(0, 300);
    if (id) {
      UltiSite.Blogs.update({
        _id: id,
      }, {
          $set: {
            lastChange: new Date(),

            title,
            content,
            image,
            preview,
            public: isPublic,
          },
        }, function (err) {
          if (err) { console.log(err); } else {
            FlowRouter.go('blog', {
              _id: id,
              edit: undefined,
            });
            Meteor.call('storeContentVersion', id, content);
            Meteor.call('addEvent', {
              type: 'blog',
              _id: id,
              text: 'Artikel bearbeitet',
            });
          }
        });
    } else {
      UltiSite.Blogs.insert({
        title,
        content,
        preview: content.substr(0, 300),
        public: isPublic,
        author: Meteor.userId(),
        authorName: Meteor.user().username,
        date: new Date(),
        lastChange: new Date(),
      }, function (err, res) {
        if (err) { console.log(err); } else {
          FlowRouter.go('blog');
          Meteor.call('storeContentVersion', res, content);
          Meteor.call('addEvent', {
            type: 'blog',
            _id: res,
            text: 'Artikel angelegt',
          });
        }
      });
    }
  },
});

Template.blogFileList.helpers({
  images() {
    return UltiSite.Images.find({
      associated: this._id,
    });
  },
  documents() {
    return UltiSite.Documents.find({
      associated: this._id,
    });
  },
});
