import './images.html';
import './images.less';

Template.imageViewer.onCreated(function () {
    this.imageStatus = new ReactiveVar();
    this.autorun(() => {
        this.subscribe('Files',FlowRouter.getParam("associated")||FlowRouter.getParam("_id"));
    });
    this.autorun(() => {
        var file = UltiSite.Images.findOne(FlowRouter.getParam("_id"));
        if (file)
            UltiSite.getAnyById(file.associated);
        this.imageStatus.set(undefined);
    });
});

Template.imageViewer.events({
    'load img.big-image': function(e, t) {
        t.imageStatus.set('loaded');
    },/*
    'error img.big-image': function(e, t) {
        console.log('image load error:', e);
        t.imageStatus.set('error');
    },*/
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
    imageLoadStatus() {
        if(Template.instance().imageStatus.get() === 'error')
            return {
                icon: 'exclamation-triangle',
                text: 'Bild laden fehlgeschlagen'
            };
        if(Template.instance().imageStatus.get() === 'loaded')
            return undefined;
        return {
            icon: 'spinner fa-spin',
            text: 'Lade Bild'
        };
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
            return UltiSite.getAnyById(file.associated);
        }
    }
});
