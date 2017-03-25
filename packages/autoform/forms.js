import {AutoForm} from './client.js';
import {Template} from 'meteor/templating';
import './forms.html';

Template.registerHelper('afFieldLabelText',(params)=>{
    const form = formData();
    if(form)
        return form.schema._schema[params.hash.name].label;
});
Template.registerHelper('afFieldMessage',(params)=>{
    return '';
});

Template.registerHelper('afFieldIsInvalid',(params)=>{
    const form = formData();
    if(!form)
        return false;
    const fieldName = params.hash.name;
    const content = AutoForm.content.findOne(form.formId).doc;
    let current = content;
    fieldName.split('.').forEach(x => current = current && current[x]);
    if(!current)
        return false;
    return !form.validationContext.validateOne(content,fieldName);
});

Template.autoForm.onCreated(function(){
    this.data.validationContext = this.data.schema.newContext();
    this.data.formId = this.data.id;
    AutoForm.content.upsert(this.data.formId, {doc: this.data.schema.clean({}),_id:this.data.formId});
});

Template.autoForm.events({
    'submit form': function(evt, tmpl) {
        evt.preventDefault();
        const form = formData();
        let doc = AutoForm.content.findOne(form.formId).doc;
        const callbackHandler = function(err, res) {
            if(err) {
                console.log('Error submitting form:', err);
                if(AutoForm._hooks[form.formId] && AutoForm._hooks[form.formId].onError)
                    AutoForm._hooks[form.formId].onError(form.type,err);
                return;
            }
            console.log('Submitting form successfull');
            if(AutoForm._hooks[form.formId] && AutoForm._hooks[form.formId].onSuccess)
                AutoForm._hooks[form.formId].onSuccess(form.type,res);
        };
        if(AutoForm._hooks[form.formId] && AutoForm._hooks[form.formId].formToDoc)
            doc = AutoForm._hooks[form.formId].formToDoc(doc);
        try {
            form.validationContext.validate(doc);
            if(form.collection && (form.type === 'insert')) {
                let collection = global;
                form.collection.split('.').forEach(p=>collection = collection[p]);
                collection.insert(doc, callbackHandler);
            } else if(form.collection && (form.type === 'update')) {
                let collection = global;
                form.collection.split('.').forEach(p=>collection = collection[p]);
                collection.update(doc._id,{$set:doc},callbackHandler);
            } else if(form.method) {
                Meteor.call(form.method, doc, callbackHandler);
            } else if(AutoForm._hooks[form.formId] && AutoForm._hooks[form.formId].onSubmit) {
                AutoForm._hooks[form.formId].onSubmit(doc);
            }
        } catch(err) {
            console.log('Validation Error:', err);
        }
    }
});

Template.afQuickFields.onCreated(function(){
});

Template.afQuickField.onCreated(function(){
    if(Template.currentData() && Template.currentData().template)
        console.log(Template.currentData());
});

function formData() {
    if(Template.parentData() && Template.parentData().schema)
        return Template.parentData();
    if(Template.parentData(0) && Template.parentData(0).schema)
        return Template.parentData(0);
    if(Template.parentData(2) && Template.parentData(2).schema)
        return Template.parentData(2);
    if(Template.parentData(3) && Template.parentData(3).schema)
        return Template.parentData(3);
    if(Template.parentData(4) && Template.parentData(4).schema)
        return Template.parentData(4);
    if(Template.parentData(5) && Template.parentData(5).schema)
        return Template.parentData(5);
    if(Template.parentData(6) && Template.parentData(6).schema)
        return Template.parentData(6);
}
Template.afObjectField.helpers({
    fields() {
        const form = formData();
        if(!form)
            return;
        return form.schema._schemaKeys
            .filter(x => x.indexOf(this.name)===0)
            .map(x => _.extend({name:x,formId:form.formId},form.schema._schema[x]));
    }
});

const helpers = {
    isArray() {
        if(this.type === Array)
            return true;
        return false;
    },
    isObject() {
        if(this.type === Object)
            return true;
        return false;
    },
    validity() {
        const form = formData();
        if(!form)
            return '';

        const content = AutoForm.content.findOne(form.formId).doc;
        if(!content)
            return '';
        if(content[Template.currentData().name] === undefined)
            return '';
        return form.validationContext.validateOne(content,Template.currentData().name)?'has-success':'has-error';
    },
    getFieldValue() {
        const form = formData();
        if(!form)
            return;
        if(!Template.currentData().name)
            return console.log('fieldValue without name', this);
        let content = AutoForm.content.findOne(form.formId).doc;
        if(content) {
            if(AutoForm._hooks[form.formId] && AutoForm._hooks[form.formId].docToForm) {
                content = AutoForm._hooks[form.formId].docToForm(content);
            }
            let value = content;
            Template.currentData().name.split('.').forEach(x=>value=value[x]);
            const fieldDef = form.schema._schema[Template.currentData().name];
            if(fieldDef.type === Date) {
                return moment(value).format(fieldDef.autoform && fieldDef.autoform.format);
            }
            return value;
        }
    },
    fieldData() {
        const form = formData();
        if(form)
            return _.extend({formId: form.formId,placeholder:'',autocomplete:'on'}, form.schema._schema[Template.currentData().name],Template.currentData());
        return Template.currentData();
    }
};
Template.afQuickField.helpers(helpers);
Template.afFieldInput.helpers(helpers);

Template.afArrayField.helpers({
    subType() {
        const form = formData();
        if(form) {
            console.log(this.name, form.schema._schema[this.name+'.$'].type);
            return form.schema._schema[this.name+'.$'].type;
        }
    }
});
Template.afQuickFields.helpers({
    fields() {
        const form = formData();
        if(!form)
            return;
        const omit = Template.currentData().omitFields?Template.currentData().omitFields.split(','):[];
        const pick = Template.currentData().fields && Template.currentData().fields.split(',');
        return form.schema._firstLevelSchemaKeys
            .filter(x => pick?_.contains(pick,x) : !_.contains(omit,x))
            .map(x => _.extend({name:x,formId:form.formId},form.schema._schema[x]));
    }
});

Template.afQuickField.events({
    'change input, change textarea, change select': function(evt, tmpl) {
        evt.preventDefault();
        const form = formData();
        if(!form)
            return;
        const fieldDef = form.schema._schema[Template.currentData().name];
        const value = {};
        if(fieldDef.type === Date)
            value['doc.'+tmpl.data.name] = moment(evt.currentTarget.value, fieldDef.autoform && fieldDef.autoform.format).toDate();
        else
            value['doc.'+tmpl.data.name] = evt.currentTarget.value;
        AutoForm.content.update(form.formId,{$set:value});
    }
});
