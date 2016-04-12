import Ember from 'ember';
import BaseAuthenticator from 'ember-simple-auth/authenticators/base';

const {
  RSVP
} = Ember;

export default BaseAuthenticator.extend({

  VK: Ember.inject.service('vk'),

  /**
   * [restore description]
   * @return {[type]} [description]
   */
  restore() {
    var _VK = this.get('VK');
    return _VK.getLoginStatus().then(function() {
      return _VK.getCurrentUserData();
    });
  },


  /**
   * [authenticate description]
   * @return {[type]} [description]
   */
  authenticate() {
    var _VK = this.get('VK');
    return _VK.vkLogin().then(function() {
      return _VK.getCurrentUserData();
    });
  },


  /**
   * [invalidate description]
   * @return {[type]} [description]
   */
  invalidate() {
    var _VK = this.get('VK');
    return _VK.vkLogout().then(function() {
      return RSVP.resolve();
    });
  }
});