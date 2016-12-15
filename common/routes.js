
if (Meteor.isClient) {
    FlowRouter.triggers.enter([
        function (param) {
            if ((param.oldRoute && param.oldRoute.name) !== FlowRouter.getRouteName()) {
                $('.page-content').addClass("faded-out");
                Meteor.setTimeout(function(){
                    $('.page-content').removeClass("faded-out");
                },500);
            }
        }
    ]);
}

FlowRouter.route('/', {
    action: function () {
        BlazeLayout.render("baseLayout", {
            content: "start"
        });
    }
});

FlowRouter.route('/login', {
    action: function () {
        $('#loginDialog').modal("show");
    },
    name: "login"
});
FlowRouter.route('/logout', {
    action: function () {
        BlazeLayout.render("baseLayout", {
            content: "logout"
        });
    },
    name: "logout"
});

/*
FlowRouter.route('/froalaImages/:_id', function () {
    // what ever data you want to return
    this.response.setHeader('Content-Type', 'application/json');
    this.response.end(JSON.stringify(UltiSite.Images.find({
        associated: this.params._id
    }).fetch().map(function (elem) {
        return elem.url();
    })));
}, {
    name: 'froalaImages',
    where: 'server'
});
*/

FlowRouter.route('/image/:_id/:associated?', {
    name: "image",
    action: function () {
        BlazeLayout.render("baseLayout", {
            content: "imageViewer"
        });
    }
});


FlowRouter.route('/files/:_id?', {
    name: "files",
    action: function () {
        BlazeLayout.render("baseLayout", {
            content: "fileBrowser"
        });
    }
});

FlowRouter.route('/cfs/files/documents/:_id/:name', {
    triggersEnter: [function (context, redirect) {
        window.location = context.path;
    }]
});

FlowRouter.route('/practices/:edit?', {
    name: "practices",
    action: function () {
        if (FlowRouter.getParam('edit'))
            BlazeLayout.render("baseLayout", {
                content: "practicesEditing"
            });
        else
            BlazeLayout.render("baseLayout", {
                content: "practicesDetailed"
            });
    }
});

FlowRouter.route('/admin', {
    name: "admin",
    action: function () {
        BlazeLayout.render("baseLayout", {
            content: "adminPanel"
        });
    }
});
FlowRouter.route('/tournaments', {
    name: "tournaments",
    action: function () {
        BlazeLayout.render("baseLayout", {
            content: "tournamentList"
        });

    }
});
FlowRouter.route('/tournament/:_id', {
    name: "tournament",
    action: function () {
        BlazeLayout.render("baseLayout", {
            content: "tournament"
        });
    }
});
FlowRouter.route('/blog/:_id?/:edit?', {
    name: "blog",
    action: function () {
        if (FlowRouter.getParam("_id")) {
            if (FlowRouter.getParam("edit"))
                BlazeLayout.render("baseLayout", {
                    content: "blogUpdate"
                });
            else
                BlazeLayout.render("baseLayout", {
                    content: "blog"
                });
        } else
            BlazeLayout.render("baseLayout", {
                content: "blogs"
            });
    }
});

FlowRouter.route('/wikipage/:_id?/:historicId?', {
    name: "wikipage",
    action: function () {
        if (FlowRouter.getParam('_id'))
            BlazeLayout.render("baseLayout", {
                content: "wikipage"
            });
        else
            BlazeLayout.render("baseLayout", {
                content: "wikipageOverview"
            });
    }
});

FlowRouter.route('/passwordReset/:token', {
    name: "passwordReset",
    action: function () {
        BlazeLayout.render("baseLayout", {
            content: "passwordReset",
        });
    }
});

FlowRouter.route('/users', {
    name: "users",
    action: function () {
        BlazeLayout.render("baseLayout", {
            content: "userList"
        });
    }
});

FlowRouter.route('/user/:_id', {
    name: "user",
    action: function () {
        BlazeLayout.render("baseLayout", {
            content: "user"
        });
    }
});

console.log("Routes initialized");
//});