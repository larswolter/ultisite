import { AutoForm } from 'meteor/ultisite:autoform';

var Uoodles = new Meteor.Collection('UltisiteUoodles');

FlowRouter.route('/uoodle/:_id?', {
    name: "uoodle",
    action: function () {
        UltiSite.baseLayoutData.set( {
            content: "uoodles"
        });
    }
});

Meteor.startup(function () {
    UltiSite.registerStartPageTemplate({
        name: 'Umfragen',
        route: 'uoodle',
        template: 'uoodleStart'
    });
    UltiSite.registerDialogTemplate('uoodleAddDialog');
    UltiSite.Uoodles = Uoodles;
});

Template.uoodleStart.onCreated(function () {
    this.subscribe('uoodleStart');
});
Template.uoodleStart.helpers({
    uoodles: function () {
        return Uoodles.find();
    },
});

Template.uoodles.onCreated(function () {
    this.subscribe('uoodles');
});

Template.uoodles.helpers({
    uoodles: function () {
        return Uoodles.find();
    },
    uoodle: function () {
        var cur = Uoodles.findOne(FlowRouter.getParam('_id'));
        return cur;
    }
});

Template.uoodles.events({
    'click .action-add-uoodle': function (e) {
        e.preventDefault();
        Session.set('uoodleCurrent',undefined);
        UltiSite.showModal('uoodleAddDialog');    
    },
});

Template.uoodleItem.helpers({
    canEdit: function () {
        return UltiSite.isAdmin() || (this.owner === Meteor.userId()); 
    }
});

Template.uoodleItem.events({
    'click .action-open-uoodle': function (e) {
        e.preventDefault();
        FlowRouter.go('uoodle', this);
    },
    'click .action-edit': function (e) {
        e.preventDefault();
        console.log('setting uoodle',this);
        Session.set('uoodleCurrent',this._id);
        UltiSite.showModal('uoodleAddDialog');    
    },
    'click .action-remove': function (e, t) {
        e.preventDefault();
        e.stopPropagation();
        UltiSite.confirmDialog('Umfrage wirklich löschen?', () => {
            Uoodles.remove(this._id);
        });
    }
});

Template.uoodleDetails.onCreated(function() {
    this.userMapping = new ReactiveVar({});
    this.autorun(() => {
        if(FlowRouter.getParam('_id'))
            Meteor.call('uoodleParticipantNames',FlowRouter.getParam('_id') , (err,res) => {
                if(err)
                    console.log(err);
                else
                    this.userMapping.set(res);
            });
    });
});

Template.uoodleDetails.helpers({
    alreadyVoted: function () {
        var uoodle = Uoodles.findOne(FlowRouter.getParam('_id'));
        if(uoodle)
            return _.contains(uoodle.participants, Meteor.userId());
    },
    uoodleUser(id) {
        return Template.instance().userMapping.get()[id];
    },
    isOpen() {
        var uoodle = Uoodles.findOne(FlowRouter.getParam('_id'));
        if(uoodle)
            return moment(uoodle.validUntil).isAfter(moment());
    },
    stats: function () {
        var result = {
            yes: 0,
            maybe: 0,
            no: 0
        };
        var option = this;
        Object.keys(option).forEach(function (key) {
            if (typeof (option[key]) == 'number') {
                if (option[key] === 0)
                    result.maybe++;
                else if (option[key] > 0)
                    result.yes++;
                else if (option[key] < 0)
                    result.no++;
            }
        });
        return result;
    },
    participantOptions: function () {
        var uoodle = Uoodles.findOne(FlowRouter.getParam('_id'));
        var self = this;
        return uoodle.options.map(function (option) {
            var state = option[self];
            if (!isNaN(state))
                _.extend(option, {
                    text: state === 0 ? 'Evtl.' : state < 0 ? 'Nein' : 'Ja',
                    css: state === 0 ? 'bg-warning' : state < 0 ? 'bg-danger' : 'bg-success'
                });
            else
                _.extend(option, {
                    text: '-',
                    css: ''
                });
            return option;
        });
    }
});

Template.uoodleDetails.events({
    'click .action-choose': function (e, t) {
        e.preventDefault();

        Meteor.call('uoodleSetParticipation', FlowRouter.getParam('_id'), this.id,
            Number(t.$(e.currentTarget).attr('data-value')), UltiSite.userFeedbackFunction('Speichern'));
    }
});

Template.uoodleAddDialog.helpers({
    current: function () {
        return Uoodles.findOne(Session.get('uoodleCurrent'));
    },
    autoFormType: function () {
        return Session.get('uoodleCurrent')?'update':'insert';
    },
    uoodleSchema: function () {
        return uoodleSchema;
    },
    uoodleCollection: function () {
        return Uoodles;
    }
});

Template.uoodleAddDialog.events({
    'click button[type="submit"]': function (e,t) {
        e.preventDefault();
        t.$('#uoodleAddForm').submit();
    }
});

Template.uoodleStart.onCreated(function () {
    this.subscribe('uoodles');
});

Template.uoodleStart.helpers({
    uoodles: function () {
        return Uoodles.find();
    }
});
Template.uoodleStart.events({
    'click .action-go': function () {
        FlowRouter.go('/uoodle');
    },
    'click a.list-group-item': function (e) {
        e.preventDefault();
        FlowRouter.go('uoodle', this);
    }
});

AutoForm.hooks({
    uoodleAddForm: {
        formToDoc:function(form) {
            console.log(form);
            return _.extend(form, {
                owner: Meteor.userId(),
                ownerName: Meteor.user().username,
                created: new Date(),
                options: form.options.map((o)=>{
                    return _.extend(o,{id:Random.id()});
                })
            });
        },
        // Called when any submit operation succeeds
        onSuccess: function (formType, result) {
            UltiSite.notify('Umfrage angelegt', "success");
            UltiSite.hideModal();    
            if(formType==='insert')
                Meteor.call('addEvent', {
                    type: 'uoodle',
                    additional:'Umfrage',
                    name: Uoodles.findOne(result).name,
                    _id: result,
                    text: 'Neu angelegt'
                });                                            
        },

        // Called when any submit operation fails
        onError: function (formType, error) {
            UltiSite.notify('Fehler beim Anlegen der Planung:' + error.message, "error");
        }
    }
});