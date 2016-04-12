import Ember from 'ember';
import SearchEnabledRouteMixinMixin from 'ember-music-player/mixins/search-enabled-route-mixin';
import { module, test } from 'qunit';

module('Unit | Mixin | search enabled route mixin');

// Replace this with your real tests.
test('it works', function(assert) {
  let SearchEnabledRouteMixinObject = Ember.Object.extend(SearchEnabledRouteMixinMixin);
  let subject = SearchEnabledRouteMixinObject.create();
  assert.ok(subject);
});
