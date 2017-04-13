import { AutoForm } from './client.js';
import { Template } from 'meteor/templating';
import './calendar.html';
import './calendar.js';
import './forms.html';

Template.registerHelper('afFieldLabelText', (params) => {
  const form = AutoForm.formData();
  if (form)
    return form.schema._schema[params.hash.name].label || params.hash.name;
});
Template.registerHelper('afFieldMessage', (params) => {
  return '-';
});

Template.registerHelper('afFieldIsInvalid', (params) => {
  const form = AutoForm.formData();
  if (!form)
    return false;
  const fieldName = params.hash.name;
  const errors = AutoForm.content.findOne(form.formId).errors;
  if (errors && errors[fieldName])
    return true;
  const content = AutoForm.content.findOne(form.formId).doc;
  return !form.validationContext.validateOne(form.schema.clean(content, { getAutoValues: false }), fieldName);
});


Template.autoForm.onCreated(function () {
  this.data.validationContext = this.data.schema.newContext();
  this.data.formId = this.data.id;
  AutoForm.content.upsert(this.data.formId, {
    doc: this.data.doc || this.data.schema.clean({}),
    initial: this.data.doc || this.data.schema.clean({}),
    _id: this.data.formId
  });
});

Template.autoForm.events({
  'submit form': function (evt, tmpl) {
    evt.preventDefault();
    const form = AutoForm.formData();
    let doc = AutoForm.content.findOne(form.formId).doc;
    let initial = AutoForm.content.findOne(form.formId).initial;
    const callbackHandler = function (err, res) {
      if (err) {
        if (AutoForm._hooks[form.formId] && AutoForm._hooks[form.formId].onError)
          AutoForm._hooks[form.formId].onError(form.type, err, form);
        return;
      }
      if (AutoForm._hooks[form.formId] && AutoForm._hooks[form.formId].onSuccess)
        AutoForm._hooks[form.formId].onSuccess(form.type, res);
    };
    if (AutoForm._hooks[form.formId] && AutoForm._hooks[form.formId].formToDoc)
      doc = AutoForm._hooks[form.formId].formToDoc(doc);
    try {
      form.validationContext.validate(doc);
      if (form.collection && (form.type === 'insert')) {
        if (form.collection.insert)
          form.collection.insert(doc, callbackHandler);
        else {
          let collection = global;
          form.collection.split('.').forEach(p => collection = collection[p]);
          collection.insert(doc, callbackHandler);
        }
      } else if (form.collection && (form.type === 'update')) {
        if (form.collection.insert)
          form.collection.update(doc._id, { $set: _.omit(doc, '_id') }, callbackHandler);
        else {
          let collection = global;
          form.collection.split('.').forEach(p => collection = collection[p]);
          collection.update(doc._id, { $set: _.omit(doc, '_id') }, callbackHandler);
        }
      } else if (form.meteormethod) {
        Meteor.call(form.meteormethod, doc, callbackHandler);
      } else if (AutoForm._hooks[form.formId] && AutoForm._hooks[form.formId].onSubmit) {
        AutoForm._hooks[form.formId].onSubmit(doc, { $set: _.omit(doc, '_id') }, initial, form);
      }
    } catch (err) {
      console.log('Validation Error:', err);
    }
  }
});

Template.afQuickFields.onCreated(function () {
});

Template.afQuickField.onCreated(function () {
  if (Template.currentData() && Template.currentData().template)
    console.log(Template.currentData());
});

Template.afObjectField.helpers({
  fields() {
    if (!this.form)
      return;
    const subFields = this.form.schema._schemaKeys
      .filter(x => x.indexOf(this.name + '.') === 0)
      .map(x => _.extend({ name: x, formId: this.form.formId, form: this.form }, this.form.schema._schema[x]));
    return subFields;
  }
});

const helpers = {
  isArray() {
    if (this.type === Array)
      return true;
    return false;
  },
  isObject() {
    if (this.type === Object)
      return true;
    return false;
  },
  validityText() {
    const form = this.form || AutoForm.formData();
    if (!form)
      return '';
    const errors = AutoForm.content.findOne(form.formId).errors;
    if (errors && errors[Template.instance().data.name])
      return errors[Template.instance().data.name];
    const content = (AutoForm.content.findOne(form.formId) || {}).doc;
    if (!content)
      return '';
    const valid = form.validationContext.validateOne(form.schema.clean(content, { getAutoValues: false }), Template.instance().data.name);
    if (!valid)
      return form.validationContext.keyErrorMessage(Template.instance().data.name);
    return;
  },
  validity() {
    const form = this.form || AutoForm.formData();
    if (!form)
      return '';
    const errors = AutoForm.content.findOne(form.formId).errors;
    if (errors && errors[Template.instance().data.name])
      return 'has-error';
    const content = (AutoForm.content.findOne(form.formId) || {}).doc;
    if (!content)
      return '';
    const valid = form.validationContext.validateOne(form.schema.clean(content, { getAutoValues: false }), Template.instance().data.name);
    if (valid)
      return 'has-success';
    return 'has-error';
  },
  isDate() {
    if (this.type === Date)
      return true;
    return false;
  },
  isChecked(option) {
    const form = this.form || AutoForm.formData();
    if (!form)
      return;
    if (!Template.instance().data.name)
      return console.log('fieldValue without name', Template.instance().data);
    let content = (AutoForm.content.findOne(form.formId) || {}).doc;
    if (content) {
      let value = content;
      Template.instance().data.name.split('.').forEach(x => value = value && value[x]);
      if (option && Array.isArray(value))
        return _.contains(value, option);
      return !!value;
    }
  },
  getFieldValue() {
    const form = this.form || AutoForm.formData();
    if (!form)
      return;
    if (!this.name)
      return console.log('fieldValue without name', this);
    return AutoForm.getFieldValue(this.name, this.form);
  },
  fieldData() {
    const form = Template.currentData().form || AutoForm.formData();
    if (form) {
      const data = _.extend(
        { autoform: {}, formId: form.formId, form, placeholder: '', autocomplete: 'on' },
        form.schema._schema[Template.instance().data.name],
        Template.currentData());
      if (data.options)
        data.autoform.options = data.options;
      if (data.autoform && data.autoform.options === 'allowed')
        data.autoform.options = data.allowedValues || [];
      if (data.autoform && (typeof data.autoform.options === 'function'))
        data.autoform.options = data.autoform.options();
      if (data.autoform.options && !Array.isArray(data.autoform.options))
        data.autoform.options = Object.keys(data.autoform.options).map(key => ({ value: key, label: data.autoform.options[key] }));
      else if (data.autoform.options)
        data.autoform.options = data.autoform.options.map(x => typeof x === 'object' ? x : { value: x, label: x });
      return data;
    }
    return Template.currentData();
  }
};
Template.afQuickField.helpers(helpers);
Template.afFieldInput.helpers(helpers);

Template.afArrayField.onCreated(function () {
  const _id = this.data.formId + '.' + this.data.name;
  AutoForm.content.upsert(_id, { _id, doc: {} });
});

Template.afArrayField.helpers({
  elements() {
    if (!this.form)
      return;
    if (!this.name)
      return console.log('fieldValue without name', this);
    const value = AutoForm.getFieldValue(this.name, this.form);
    if (value && _.isFunction(value.map))
      return value.filter(x => !!x).map((element, idx) => {
        const fieldNames = this.form.schema._schemaKeys.filter(x => x.indexOf(this.name + '.$.') === 0);
        return {
          idx,
          properties: fieldNames.map((x) => {
            return {
              label: _.isFunction(this.form.schema._schema[x].label) ? this.form.schema._schema[x].label() : this.form.schema._schema[x].label,
              value: AutoForm.transformValue(element[AutoForm.arrayCheck(x)], this.form.schema._schema[x]),
              key: AutoForm.arrayCheck(x),
            };
          })
        };
      });
    return [];
  },
  subField() {
    const form = _.clone(this.form);
    form.formId = form.formId + '.' + this.name;
    if (form) {
      return _.extend({ name: this.name + '.$', noLabel: true, formId: form.formId, form }, this.form.schema._schema[this.name + '.$']);
    }
  }
});
Template.afArrayField.events({
  'click .action-remove': function (event, template) {
    event.preventDefault();
    const value = {};
    console.log('removing', template.data.name, this.idx);
    value['doc.' + AutoForm.arrayCheck(template.data.name) + '.' + this.idx] = 1;
    AutoForm.content.update(template.data.formId, { $unset: value });
    const value2 = {};
    value2['doc.' + AutoForm.arrayCheck(template.data.name)] = null;
    AutoForm.content.update(template.data.formId, { $pull: value });
  },
  'click .action-insert': function (event, template) {
    event.preventDefault();
    const element = AutoForm.content.findOne(template.data.formId + '.' + template.data.name).doc;
    const value = {};
    value['doc.' + AutoForm.arrayCheck(template.data.name)] = element;
    AutoForm.content.update(template.data.formId, { $push: value });
    AutoForm.content.update(template.data.formId + '.' + template.data.name, { $set: { doc: {} } });
  }
});

Template.afQuickFields.helpers({
  fields() {
    const form = AutoForm.formData();
    if (!form)
      return;
    const omit = Template.currentData().omitFields ? Template.currentData().omitFields.split(',') : [];
    const pick = Template.currentData().fields && Template.currentData().fields.split(',');
    return form.schema._firstLevelSchemaKeys
      .filter(x => pick ? _.contains(pick, x) : !_.contains(omit, x))
      .map(x => _.extend({ name: x, formId: form.formId }, form.schema._schema[x]));
  }
});

Template.afFieldInput.events({
  'click .autoform-checkbox.multi': function (evt, tmpl) {
    evt.preventDefault();
    const form = AutoForm.formData();
    if (!this.name)
      return;
    if (!form)
      return;
    const value = {};
    value['doc.' + AutoForm.arrayCheck(this.name)] = $(evt.currentTarget).attr('data-value');

    if (!AutoForm.content.findOne(_.extend({ _id: form.formId }, value)))
      return AutoForm.content.update(form.formId, { $addToSet: value });
    else
      return AutoForm.content.update(form.formId, { $pull: value });
  },
  'keyup input, change input, change textarea, change select': _.throttle(function (evt, tmpl) {
    evt.preventDefault();
    if (!this.name)
      return;
    const form = AutoForm.formData();
    if (!form)
      return;
    const fieldDef = form.schema._schema[this.name];
    if (!fieldDef)
      return;
    const value = {};
    if (fieldDef.type === Date)
      value['doc.' + AutoForm.arrayCheck(this.name)] = moment(evt.currentTarget.value, fieldDef.autoform && fieldDef.autoform.format).toDate();
    else {
      value['doc.' + AutoForm.arrayCheck(this.name)] = evt.currentTarget.value;
    }
    console.log('Updating Field:', form.formId, value);
    AutoForm.content.update(form.formId, { $set: value });
  }, 500)
});
