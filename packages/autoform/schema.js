console.log('Setting up simple schema');

export class SimpleSchema {
  constructor(def) {
    this._schema = def;
    this._schemaKeys = [];
    Object.keys(this._schema).forEach((key) => {
      this._schemaKeys.push(`${key}`);
      if (this._schema[key].type && this._schema[key].type._schemaKeys) {
        this._schema[key].type._schemaKeys.forEach((sk) => {
          this._schemaKeys.push(`${key}.${sk}`);
          this._schema[`${key}.${sk}`] = this._schema[key].type._schema[sk];
        });
        this._schema[key].type = Object;
      }
    });
  }
  static RegEx() {
    return {
      Domain: /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z](?:[a-z-]*[a-z])?$/,
      Email: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
      Url: /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i,
      ZipCode: /^\d{5}(?:[-\s]\d{4})?$/,
    };
  }
  static setDefaultMessages() {

  }

  clean(doc, options) {
    return _.pick(doc, this._schemaKeys);
  }
  validate(doc, options) {
    let valid = true;
    const invalidKeys = {};
    this._schemaKeys.forEach((key) => {
      if (!this._schema[key]) {
        valid = false;
      }
    });

    return {
      isValid() {
        return valid;
      },
      keyIsInvalid(name) {
        return !!invalidKeys[name];
      },
      keyErrorMessage(name) {
        return invalidKeys[name] && invalidKeys[name].message;
      },
    };
  }
  extend(schema) {
    Object.assign(this._schema, schema._schema);
    this._schemaKeys = _.uniq(schema._schemaKeys.concat(this._schemaKeys));
  }
}
