Template.imageViewer.onCreated(function () {
    var self = this;
    self.autorun(function () {
        self.subscribe('Files',FlowRouter.getParam("associated")||FlowRouter.getParam("_id"));
    });
    self.autorun(function () {
        var file = UltiSite.Images.findOne(FlowRouter.getParam("_id"));
        if (file)
            UltiSite.getAnyById(file.associated);
    });
});

Template.imageViewer.events({
    'click .remove-associated': function (e, t) {
        var userId = t.$(e.currentTarget).attr("data-id");
        console.log();
        var imgId = FlowRouter.getParam("_id");
        UltiSite.Images.update({
            _id: imgId
        }, {
            $pull: {
                associated: userId
            }
        }, {}, function () {
        });
    }
});

Template.imageViewer.helpers({
    nextImage() {
        const assoc = FlowRouter.getParam("associated");
        $('.start-content > img').attr('src','');
        if(assoc) {
            const others = UltiSite.Images.find({associated:assoc},{sort:{created:1}}).map(img=>img._id);
            let idx;
            others.forEach((img,i) => {
                if (FlowRouter.getParam("_id") === img)
                    idx = i;
            });
            if (( idx !== undefined) && (idx < (others.length-1)))
                return FlowRouter.url('image',{_id:others[idx+1],associated:assoc});
        }
        return false;
    },
    prevImage() {
        const assoc = FlowRouter.getParam("associated");
        $('.start-content > img').attr('src','');
        if(assoc) {
            const others = UltiSite.Images.find({associated:assoc},{sort:{created:1}}).map(img=>img._id);
            let idx;
            others.forEach((img,i) => {
                if (FlowRouter.getParam("_id") === img)
                    idx = i;
            });
            if (( idx !== undefined) && (idx > 0))
                return FlowRouter.url('image',{_id:others[idx-1],associated:assoc});
        }
        return false;
    },
    imageFile: function () {
        return UltiSite.Images.findOne(FlowRouter.getParam("_id"));
    },
    associateWithUser: function () {
        var imgId = FlowRouter.getParam("_id");
        return function (elem) {
            UltiSite.Images.update({
                _id: imgId
            }, {
                $addToSet: {
                    associated: elem.id
                }
            }, {}, function () {
                UltiSite.getAnyById([elem.id]);

            });
            //TODO: Add Event
            return true;
        };
    },
    associated: function () {
        var file = UltiSite.Images.findOne(FlowRouter.getParam("_id"));
        if(file) {
            console.log('Looking up associated',file.associated);
            return UltiSite.getAnyById(file.associated);
        }
    }
});
