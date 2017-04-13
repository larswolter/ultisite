import { AutoForm } from './client.js';
import { Template } from 'meteor/templating';

Template.autoformCalendar.events({
  'click .next': function (evt) {
    evt.preventDefault();
    evt.stopPropagation();
    let date = moment(AutoForm.getFieldValue(this.name, this.form), this.autoform && this.autoform.format);
    if(!date.isValid())
      date = moment();
    date.add(1, 'month');
    const value = {};
    value['doc.' + AutoForm.arrayCheck(this.name)] = date.toDate();
    AutoForm.content.update(this.formId, { $set: value });
  },
  'click .prev': function (evt) {
    evt.preventDefault();
    evt.stopPropagation();
    let date = moment(AutoForm.getFieldValue(this.name, this.form), this.autoform && this.autoform.format);
    if(!date.isValid())
      date = moment();
    date.subtract(1, 'month');
    const value = {};
    value['doc.' + AutoForm.arrayCheck(this.name)] = date.toDate();
    AutoForm.content.update(this.formId, { $set: value });
  },
  'click .day': function (evt) {
    evt.preventDefault();
    const parent = Template.parentData();
    let date = moment(AutoForm.getFieldValue(parent.name, parent.form), parent.autoform && parent.autoform.format);
    if(!date.isValid())
      date = moment();
    date.date(this.day);
    if (this.month)
      date.month(this.month);
    const value = {};
    value['doc.' + AutoForm.arrayCheck(parent.name)] = date.toDate();
    AutoForm.content.update(parent.formId, { $set: value });
  }
});

Template.autoformCalendar.helpers({
  month() {
    const date = moment(AutoForm.getFieldValue(this.name, this.form), this.autoform && this.autoform.format);
    if(date.isValid())
      return date.format('MMMM YYYY');
    return moment().format('MMMM YYYY');
  },
  days() {
    let selected = moment(AutoForm.getFieldValue(this.name, this.form), this.autoform && this.autoform.format);
    if(!selected.isValid())
      selected = moment();
    const startOfMonth = selected.clone().startOf('month');
    const endOfMonth = selected.clone().endOf('month');
    const before = (startOfMonth.day() !== 1) ? _.range(startOfMonth.clone().startOf('week').date(),
      startOfMonth.clone().startOf('week').date() + startOfMonth.day() - 1).map(day => {
        return { day, active: false, muted: true, month: selected.month() - 1 };
      }) : [];
    const inMonth = _.range(1, selected.clone().endOf('month').date() + 1).map(day => {
      return { day, active: day === selected.date(), muted: false };
    });
    const after = (endOfMonth.day() !== 0) ? _.range(1, 7 - endOfMonth.day() + 1).map(day => {
      return { day, active: false, muted: true, month: selected.month() - 1 };
    }) : [];
    return before.concat(inMonth).concat(after);
  }
});
