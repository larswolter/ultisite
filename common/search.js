
// generate search filter
// (term1 in field1 or term1 in field2) and (term2 in field1 or term2 in field2)
function getSearchFilter(term, fields) {
    var search = {
        $and: []
    };
    term.split(" ").forEach(function (t) {
        var termSearch = { $or: [] };
        fields.forEach(function (f) {
            var field = {};
            if (f === 'date' && !Number.isNaN(Number(t))) {
                field[f] = {
                    $gte: moment().year(Number(t)).startOf('year').toDate(),
                    $lte: moment().year(Number(t)).endOf('year').toDate()
                };
            } else {
                field[f] = new RegExp(t.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"), 'i');
            }
            termSearch['$or'].push(field);
        });
        if (termSearch['$or'].length > 0)
            search['$and'].push(termSearch);
    });
    return search;
}

Meteor.startup(function () {


    _.extend(UltiSite, {
        search: function (term, type) {
            if (!this.userId)
                return;

            var res = [];
            if (_.contains(type, "Tournaments")) {
                res = res.concat(UltiSite.Tournaments.find(getSearchFilter(term, ['name', 'address.city', 'date']), {
                    limit: 10,
                    sort: {
                        date: -1
                    }
                }).map(function (elem) {
                    return {
                        name: elem.name + " (" + moment(elem.date).format("YYYY") + ")",
                        additional: elem.address ? elem.address.city : undefined,
                        icon: "fa-trophy",
                        isImage: false,
                        id: elem._id,
                        _id: elem._id,
                        link: FlowRouter.path("tournament", {
                            _id: elem._id
                        })
                    };
                }));
            }

            if (_.contains(type, "Images")) {
                res = res.concat(UltiSite.Images.find(
                    getSearchFilter(term, ["name","tags"])
                    , {
                        limit: 10
                    }).map(function (elem) {
                        return {
                            name: elem.name,
                            icon: "fa-picture-o",
                            isImage:true,
                            id: elem._id,
                            _id: elem._id,
                            link: FlowRouter.path("image", {
                                _id: elem._id
                            })
                        };
                    }));
            }
            if (_.contains(type, "Documents")) {
                res = res.concat(UltiSite.Documents.find(getSearchFilter(term, ["name","tags"]), {
                    limit: 10
                }).map(function (elem) {
                    return {
                        name: elem.name,
                        icon: "fa-file-o",
                        isImage: false,
                        _id: elem._id,
                        id: elem._id,
                        link: elem.url()
                    };
                }));
            }
            if (_.contains(type, "WikiPages")) {
                res = res.concat(UltiSite.WikiPages.find(getSearchFilter(term, ["name"]), {
                    limit: 10
                }).map(function (elem) {
                    return {
                        name: elem.name,
                        icon: "fa-book",
                        isImage: false,
                        id: elem._id,
                        _id: elem._id,
                        link: FlowRouter.path("wikipage", {
                            name: elem._id
                        })
                    };
                }));
            }
            if (_.contains(type, "Blogs")) {

                res = res.concat(UltiSite.Blogs.find(getSearchFilter(term, ["title"]), {
                    limit: 10
                }).map(function (elem) {
                    return {
                        name: elem.title,
                        icon: "fa-newspaper-o",
                        isImage: false,
                        id: elem._id,
                        _id: elem._id,
                        link: FlowRouter.path("blog", {
                            title: elem.title
                        })
                    };
                }));
            }
            if (_.contains(type, "Users")) {
                var search = getSearchFilter(term, ["profile.name", "profile.surname", "emails.address", "username"]);
                var self = this;
                res = res.concat(Meteor.users.find(search, {
                    limit: 10
                }).map(function (elem) {
                    return {
                        name: elem.username + " (" + elem.profile.name + " " + elem.profile.surname + ")",
                        sex: elem.profile.sex,
                        isImage: false,
                        icon: "fa-user",
                        id: elem._id,
                        _id: elem._id,
                        link: FlowRouter.path("user", {
                            _id: elem._id
                        })
                    };
                }));
            }
            return res;
        }
    });
    Meteor.methods({
        search: UltiSite.search
    });
});
