var activeImage = new ReactiveVar(null);
var activePublication = new ReactiveVar(false);

Template.blogs.onCreated(function(){
    this.limit = new ReactiveVar(10);
    this.autorun(()=>{
        this.subscribe('Blogs',this.limit.get());
    });
});
Template.blogsStart.onCreated(function(){
    this.subscribe('BlogsStart');
});

Template.blogs.helpers({
    blogs: function () {
        return UltiSite.Blogs.find({}, {
            sort: {
                date: -1,
            },
        });
    }
});
Template.blogsStart.helpers({
    blogs: function () {
        return UltiSite.Blogs.find({}, {
            sort: {
                date: -1,
            },
        });
    }
});


Template.blog.onCreated(function () {
    var self = this;
    self.autorun(() => {
        self.subscribe('Blog',FlowRouter.getParam("_id"));
    });
    self.autorun(function () {
        var blog = getBlog();
        self.data = blog;
    });
});

Template.blog.helpers({
    blog: function () {
        return getBlog();
    }
});

Template.blogPreview.helpers({
    blog: function () {
        return this;
    }
});

Template.blogPreview.events({
    'click .action-preview-extender, click .blog-preview-text': function(evt, tmpl) {
        tmpl.$('.blog-container').addClass('extended');
        tmpl.$('.action-preview-extender').fadeOut(200);
    }
});

Template.blogUpdate.onCreated(function () {
    var self = this;
    self.autorun(function () {
        self.subscribe('Blog',FlowRouter.getParam("_id"));
    });
    self.autorun(function () {
        var blog = getBlog();
        console.log('resetting image to blog');
        activeImage.set(blog.image);
        activePublication.set(blog.public);
    });
});

Template.blogUpdate.helpers({
    isPublic: function () {
        return activePublication.get();
    },
    imageId: function () {
        return activeImage.get();
    },
    blog: function () {
        return getBlog();
    }
});

var imageSelect = function (item) {
    console.log("setting active image", item);
    UltiSite.fileBrowserHideDialog();
    if(item)
        activeImage.set(item._id);
    else
        activeImage.set(undefined);
};

Template.blogUpdate.events({
    'click .btn-edit-image': function (e, t) {
        e.preventDefault();
        var id = $('.blogUpdateForm input.id').val();

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
            edit: undefined
        });
    },
    'submit .blogUpdateForm': function (e) {
        e.preventDefault();
        var content = $('.blogUpdateForm .ulti-editor').val();
        var title = $('.blogUpdateForm input.title').val();
        var id = $('.blogUpdateForm input.id').val();
        var image = activeImage.get();
        var isPublic = activePublication.get();
        var div = document.createElement("div");
        div.innerHTML = content;
        var preview = (div.textContent || div.innerText || "").substr(0, 300);
        if (id)
            UltiSite.Blogs.update({
                _id: id
            }, {
                $set: {
                    title: title,
                    content: content,
                    image: image,
                    preview: preview,
                    public: isPublic
                }
            }, function (err) {
                if (err)
                    console.log(err);
                else {
                    FlowRouter.go('blog', {
                        _id: id,
                        edit: undefined
                    });
                    Meteor.call("storeContentVersion", id, content);
                    Meteor.call('addEvent', {
                        type: 'blog',
                        _id: id,
                        text: 'Artikel bearbeitet'
                    });                    
                }
            });

        else
            UltiSite.Blogs.insert({
                title: title,
                content: content,
                preview: content.substr(0, 300),
                public: isPublic,
                author: Meteor.userId(),
                authorName: Meteor.user().username,
                date: new Date()
            }, function (err, res) {
                if (err)
                    console.log(err);
                else {
                    FlowRouter.go('blog');
                    Meteor.call("storeContentVersion", res, content);
                    Meteor.call('addEvent', {
                        type: 'blog',
                        _id: res,
                        text: 'Artikel angelegt'
                    });                    
                }
            });


    }
});

function getBlog() {
    return UltiSite.Blogs.findOne({
        _id: FlowRouter.getParam('_id')
    }) || {};
}
