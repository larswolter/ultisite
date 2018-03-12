import { ReactiveVar } from 'meteor/reactive-var';

UltiSite.State = {
  values: {},
  setDefault(key, value) {
    if (!this.values[key]) {
      this.values[key] = new ReactiveVar();
    }
    this.values[key].set(value);
  },
  set(key, value) {
    if (!this.values[key]) {
      this.values[key] = new ReactiveVar();
    }
    this.values[key].set(value);
  },
  get(key) {
    if (!this.values[key]) {
      this.values[key] = new ReactiveVar();
    }
    return this.values[key].get();
  },
};
