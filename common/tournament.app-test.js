/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import { resetDatabase } from 'meteor/xolvio:cleaner';
import assert from 'assert';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { DDP } from 'meteor/ddp-client';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Promise } from 'meteor/promise';
import denodeify from 'denodeify';

console.log('running test file');
// Utility -- returns a promise which resolves when all subscriptions are done
const waitForSubscriptions = () => new Promise((resolve) => {
  const poll = Meteor.setInterval(() => {
    if (DDP._allSubscriptionsReady()) {
      Meteor.clearInterval(poll);
      resolve();
    }
  }, 200);
});
// Tracker.afterFlush runs code when all consequent of a tracker based change
//   (such as a route change) have occured. This makes it a promise.
const afterFlushPromise = denodeify(Tracker.afterFlush);
describe('Tournaments', function () {
  if (Meteor.isServer) {
    before(function () {
      resetDatabase();
    });
  }
  it('list tournaments', function() {
    assert.equal(UltiSite.Tournaments.find().count(), 0);
  });
  if (Meteor.isClient) {
    describe('show tournaments', function() {
      FlowRouter.go('tournaments');

      it('render the correct header in the navigation', function() {
        assert.equal($('.navbar-nav > li.active > a').html(), 'Turniere');
        return afterFlushPromise()
//            .then(waitForSubscriptions)
            .then(() => {
              assert.equal($('.navbar-nav > li.active > a').html(), 'Turniere');
            });
      });
    });
  }
});
