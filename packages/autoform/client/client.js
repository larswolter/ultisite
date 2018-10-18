import './forms.js';
import './forms.scss';
import SimpleSchema from 'simpl-schema';

console.log('configuring simple schema');

SimpleSchema.extendOptions({
  autoform: Match.Optional(Object),
});

const AutoForm = {
  content: new Meteor.Collection(null),
  _hooks: {},
  hooks(hook) {
    _.extend(this._hooks, hook);
  },
  setDefaultTemplateForType() {

  },
  formData(local) {
    if (local && local.form && local.form.schema) { return local.form; }
    if (local && local.schema) { return local; }
    for (let i = 0; i < 6; i++) {
      try {
        if (Template.parentData(i) && Template.parentData(i).form && Template.parentData(i).form.schema) { return Template.parentData(i).form; }
        if (Template.parentData(i) && Template.parentData(i).schema) { return Template.parentData(i); }
      } catch (err) { }
    }
  },
  arrayCheck(fieldName) {
    const pos = fieldName.indexOf('$.');
    if (pos >= 0) {
      return fieldName.substr(pos + 2);
    }
    return fieldName;
  },
  transformValue(value, fieldName, form) {
    if (value === undefined) { return ''; }
    const fieldDef = form.schema.mergedSchema()[fieldName];
    if (form.schema.getQuickTypeForKey(fieldName) === 'date') {
      const mom = moment(value);
      if (mom.isValid()) {
        return mom.format(fieldDef.autoform && fieldDef.autoform.format);
      }
      return '';
    }
    if (fieldDef.type === Boolean) {
      return value ? 'Ja' : 'Nein';
    }
    return value;
  },
  getFieldValueNonReactive(fieldName, form) {
    return Tracker.autorun(() => {
      return this.getFieldValue(fieldName, form);
    });
  },
  getFieldValue(fieldName, form) {
    if (!fieldName) { return; }
    form = AutoForm.formData(form);
    const content = (AutoForm.content.findOne(form && form.formId) || {}).doc;
    if (content) {
      let value = content;
      this.arrayCheck(fieldName).split('.').forEach((x) => { value = value && value[x]; });
      if (form) {
        return this.transformValue(value, fieldName, form);
      }
      return value;
    }
  },
  addStickyValidationError(formId, fieldName, message) {
    const value = {};
    value['errors.' + fieldName] = message;
    AutoForm.content.update(formId, { $set: value });
  },
  removeStickyValidationError(formId, fieldName) {
    const value = {};
    value['errors.' + fieldName] = 1;
    AutoForm.content.update(formId, { $unset: value });
  },
  resetForm(formId) {
    const doc = this.content.findOne(formId);
    AutoForm.content.update(formId, { $set: { errors: {}, doc: doc.initial } });
  },
};

console.log('configuring simple schema');
export { AutoForm, SimpleSchema };
