Meteor.startup(function(){
    AutoForm.setDefaultTemplateForType('afArrayField','ultisite');    
    AutoForm.setDefaultTemplateForType('afObjectField','ultisite');    
});

Template.afObjectField_ultisite.helpers({
    quickFieldsAtts: function () {
        return _.pick(this, 'name', 'id-prefix');
    },
    panelClass: function() {
        return this.panelClass || 'panel-default';
    }
});
