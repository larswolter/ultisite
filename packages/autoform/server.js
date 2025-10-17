/*
import { SimpleSchema } from './schema.js';

export { SimpleSchema };
*/
import SimpleSchema from 'simpl-schema';

export { SimpleSchema };

console.log('configuring simple schema');

SimpleSchema.RegEx = {
  Email: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  ZipCode: /^\d{5}(?:[-\s]\d{4})?$/,
}

SimpleSchema.extendOptions(['autoform']);

