/*
import { SimpleSchema } from './schema.js';

export { SimpleSchema };
*/
import SimpleSchema from 'simpl-schema';

export { SimpleSchema };

console.log('configuring simple schema');

SimpleSchema.extendOptions({
  autoform: Match.Optional(Object),
});

