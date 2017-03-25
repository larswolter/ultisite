import './forms.js';

import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const AutoForm = {
  content: new Meteor.Collection(null),
  _hooks: {},
  hooks(hook) {
      _.extend(this._hooks, hook);
  },
  setDefaultTemplateForType(){

  },
  getFieldValue(fieldName) {
    let current = this.content.findOne().doc;
    fieldName.split('.').forEach(x => current = current && current[x]);
    return current;
  }
};

console.log('configuring simple schema');

SimpleSchema.extendOptions({
  autoform: Match.Optional(Object),
});


