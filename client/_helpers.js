
Template.registerHelper("pathFor", function (params, params2, params3) {
    //console.log("pathFor:", params, params2, params3);
    if (params.hash)
        return FlowRouter.path(params.hash.route, params.hash);
    else if (typeof (params) === "string")
        return FlowRouter.path(params, (params2 || {}).hash);
    else
        console.log("pathFor Error:", params);
});
Template.registerHelper("subsReady", function (type) {
    var sub = UltiSite[type + "Ready"].get();
    console.log("checkin sub:", sub);
    return sub;
});
Template.registerHelper("meteorStatus", function () {
    return Meteor.status();
});

Template.registerHelper("screenSizeMobile", function () {

    return UltiSite.screenSize.get() < 768;
});

Template.registerHelper("settings", function () {
    return UltiSite.settings();
});
Template.registerHelper("dayOfDate", function (date) {
    return moment(date).format("DD");
});
Template.registerHelper("monthOfDate", function (date) {
    return moment(date).format("MM");
});
Template.registerHelper("yearOfDate", function (date) {
    return moment(date).format("YY");
});
Template.registerHelper("timeOfDate", function (date) {
    return moment(date).format("HH:mm");
});
Template.registerHelper("formatDate", function (date) {
    return date && moment(date).isValid() && moment(date).format("DD.MM.YYYY");
});
Template.registerHelper("formatDateInput", function (date) {
    return date && moment(date).isValid() && moment(date).format("YYYY-MM-DD");
});
Template.registerHelper("formatTime", function (date) {
    return date && moment(date).isValid() && moment(date).format("HH:mm");
});
Template.registerHelper("formatDateTime", function (date) {
    return date && moment(date).format("DD.MM.YYYY HH:mm");
});
Template.registerHelper("formatDateRelative", function (date) {
    return date && moment(date).isValid() && moment(date).fromNow();
});
Template.registerHelper("imageLookup", function (id) {
    return UltiSite.Images.findOne(id);
});
Template.registerHelper("imageUrl", function (id, size) {
    return '/_image?imageId=' + id + ((size === undefined) || (typeof size === 'object') ? '' : '&size=' + size);
});
Template.registerHelper("getPageSearch", function (id) {
    if (!Meteor.userId())
        return false;

    var name = FlowRouter.getRouteName();
    switch (name) {
        case "tournaments":
            return "Tournaments";
        case "users":
            return "Users";
        case "files":
            return "Images,Documents";
        case "blogs":
            return "Blogs";
    }
});
Template.registerHelper("joinNice", function (array) {
    if (!array)
        return '';
    if (array.length === 1)
        return array[0];
    let text = ' und ' + _.clone(array).pop();
    return array.join(', ') + text;
});
Template.registerHelper("routeName", function () {
    return FlowRouter.getRouteName();
});
Template.registerHelper("sitePageHeader", function () {
    var name = FlowRouter.getRouteName();
    switch (name) {
        case "tournaments": return { name: "Turniere", link: "/" };
        case "practices": return { name: "Trainingszeiten", link: "/" };
        case "admin": return { name: "Administrierung", link: "/" };
        case "blog": return { name: "Artikel", link: "/" };
        case "tweets": return { name: "Blabla", link: "/" };
        case "wikipage":
            var wiki = UltiSite.WikiPages.findOne({
                $or: [
                    { _id: FlowRouter.getParam('_id') },
                    { name: FlowRouter.getParam('_id') }]
            });
            if (wiki)
                return { name: wiki.name, link: '/' };
            return { name: "Wikiseiten", link: "/" };
        case "user":
            var user = Meteor.users.findOne(FlowRouter.getParam('_id'));
            if (user)
                return { name: user.username, back: "Mitglieder", link: "/users" };
            return { name: "Mitglieder", link: "/" };
        case "tournament":
            var tournament = UltiSite.getTournament(FlowRouter.getParam('_id'));
            if (tournament)
                return { name: tournament.name, back: "Turniere", link: "/tournaments" };
            return { name: "Turnier", back: "Turniere", link: "/tournaments" };
        case undefined:
            return { name: UltiSite.settings().teamname };
        default:
            return { back: UltiSite.settings().teamname, link: '/' };
    }
});

Template.registerHelper("colorState", function (state) {
    if (state === 100)
        return "success";
    else if (state >= 50)
        return "warning";
    else if (state >= 10)
        return "default";
    else
        return "muted";
});

Template.registerHelper("isAdmin", function () {
    return UltiSite.isAdmin();
});

Template.registerHelper("formatFileSize", function (size) {
    if (size > 1024 * 1024 * 1024 * 1024)
        return (size / (1024 * 1024 * 1024 * 1024)).toFixed(2) + "T";
    else if (size > 1024 * 1024 * 1024)
        return (size / (1024 * 1024 * 1024)).toFixed(2) + "G";
    else if (size > 1024 * 1024)
        return (size / (1024 * 1024)).toFixed(2) + "M";
    else if (size > 1024)
        return (size / (1024)).toFixed(2) + "K";
    else
        return (size) + "";
});


Template.registerHelper("equals", function (a, b) {
    return a == b;
});
Template.registerHelper("or", function (a, b) {
    return a || b;
});
Template.registerHelper("and", function (a, b) {
    return a && b;
});
Template.registerHelper("gte", function (a, b) {
    return a >= b;
});
Template.registerHelper("not", function (a) {
    return !a;
});

Template.registerHelper("getAlias", function (aliase) {
    return UltiSite.getAlias(aliase);
});

Template.Loading.events({
    'click .action-reconnect': function (e) {
        e.preventDefault();
        Meteor.reconnect();
    }
});

Template.popoverIcon.onRendered(function () {
    this.$('[data-toggle="tooltip"]').tooltip();
});
