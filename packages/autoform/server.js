import { SimpleSchema } from 'meteor/aldeed:simple-schema';

console.log('configuring simple schema');

SimpleSchema.extendOptions({
    autoform: Match.Optional(Object),
});
