
if (Meteor.isClient) {
    Meteor.startup(()=>{
        Meteor.defer(()=>{
            Blaze.renderWithData(Template.baseLayout,{}, window.document.getElementsByTagName('body')[0]);
        });
    });

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
        UltiSite.baseLayoutData.set({
            content: "start"
        });
    }
});

FlowRouter.route('/logout', {
    action: function () {
        UltiSite.baseLayoutData.set( {
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
        UltiSite.baseLayoutData.set( {
            content: "imageViewer"
        });
    }
});


FlowRouter.route('/files/:_id?', {
    name: "files",
    action: function () {
        UltiSite.baseLayoutData.set( {
            content: "fileBrowser"
        });
    }
});

FlowRouter.route('/practices/:edit?', {
    name: "practices",
    action: function () {
        if (FlowRouter.getParam('edit'))
            UltiSite.baseLayoutData.set( {
                content: "practicesEditing"
            });
        else
            UltiSite.baseLayoutData.set( {
                content: "practicesDetailed"
            });
    }
});

FlowRouter.route('/admin', {
    name: "admin",
    action: function () {
        UltiSite.baseLayoutData.set( {
            content: "adminPanel"
        });
    }
});

FlowRouter.route('/tournaments', {
    name: "tournaments",
    action: function () {
        UltiSite.baseLayoutData.set( {
            content: "tournamentList"
        });

    }
});
FlowRouter.route('/tournament/:_id', {
    name: "tournament",
    action: function () {
        UltiSite.baseLayoutData.set( {
            content: "tournament"
        });
    }
});
FlowRouter.route('/blog/:_id?/:edit?', {
    name: "blog",
    action: function () {
        if (FlowRouter.getParam("_id")) {
            if (FlowRouter.getParam("edit"))
                UltiSite.baseLayoutData.set( {
                    content: "blogUpdate"
                });
            else
                UltiSite.baseLayoutData.set( {
                    content: "blog"
                });
        } else
            UltiSite.baseLayoutData.set( {
                content: "blogs"
            });
    }
});

FlowRouter.route('/wikipage/:_id?/:historicId?', {
    name: "wikipage",
    action: function () {
        if (FlowRouter.getParam('_id'))
            UltiSite.baseLayoutData.set( {
                content: "wikipage"
            });
        else
            UltiSite.baseLayoutData.set( {
                content: "wikipageOverview"
            });
    }
});

FlowRouter.route('/help', {
    name: "help",
    action: function () {
        UltiSite.baseLayoutData.set( {
            content: "help"
        });
    }
});

FlowRouter.route('/passwordReset/:token', {
    name: "passwordReset",
    action: function () {
        UltiSite.baseLayoutData.set( {
            content: "passwordReset",
        });
    }
});

FlowRouter.route('/users', {
    name: "users",
    action: function () {
        UltiSite.baseLayoutData.set( {
            content: "userList"
        });
    }
});

FlowRouter.route('/user/:_id', {
    name: "user",
    action: function () {
        UltiSite.baseLayoutData.set( {
            content: "user"
        });
    }
});

console.log("Routes initialized");
//});