import Ember from 'ember';

export default Ember.Controller.extend({

  VK: Ember.inject.service('vk'),
  Session: Ember.inject.service('session'),

  vk_captcha_modal_shown: false,
  vk_captcha_error: null,
  vk_captcha_code: '',

  actions: {
    /**
     * [logout description]
     * @return {[type]} [description]
     */
    logout() {
        this.get('Session').invalidate();
    },


    /**
     * [vkCaptchaCodeSubmit description]
     * @return {[type]} [description]
     */
    vkCaptchaCodeSubmit() {
      if (!this.get('vk_captcha_code') || !this.get('vk_captcha_error')) {
        return;
      }
      this.set('vk_captcha_modal_shown', false);
      this.get('VK').provideCaptcha(this.get('vk_captcha_error.captcha_sid'), this.get('vk_captcha_code'));
    }

  },


  /**
   * [init description]
   * @return {[type]} [description]
   */
  init() {
    var _Self = this;
    _Self._super(...arguments);
    _Self.get('VK').on('captchaNeeded', function(error) {
      _Self.set('vk_captcha_modal_shown', true);
      _Self.set('vk_captcha_error', error);
      _Self.set('vk_captcha_code', '');
    });
  }
});
