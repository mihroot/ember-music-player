import Ember from 'ember';
import ENV from '../config/environment';

export default Ember.Service.extend({

    _InitPromise: null,
    _LoginStatusPromise: null,
    _CheckPermissionsPromise: null,

    Session: null,
    User: null,

    is_logged: false,

    /**
     * [vkInit description]
     * @return {[type]} [description]
     */
    vkInit() {

        var _Self = this;

        if (_Self._InitPromise) { return _Self._InitPromise; }

        if (ENV.VK && ENV.VK.skipInit) {
            _Self._InitPromise = Ember.RSVP.Promise.resolve('skip init');
            return _Self._InitPromise;
        }

        var _InitSettings = ENV.VK;
        if (!_InitSettings || !_InitSettings.apiId) {
            return Ember.RSVP.reject('No settings for init');
        }

        _Self._InitPromise = new Ember.RSVP.Promise(function(resolve){
            window.vkAsyncInit = function() {
                window.VK.init(_InitSettings);
                Ember.run(null, resolve);
            };
            Ember.$.getScript('//vk.com/js/api/openapi.js', function() {
                // Do nothing here, wait for window.vkAsyncInit to be called.
            });
        }).then(function() {
            //_Self.getLoginStatus();
        });

        return _Self._InitPromise;
    },


    /**
     * [vkLogin description]
     * @return {[type]} [description]
     */
    getLoginStatus() {
        var _Self = this;

        if (_Self._LoginStatusPromise) { return _Self._LoginStatusPromise; }
console.log('getLoginStatus');
        _Self._LoginStatusPromise = new Ember.RSVP.Promise(function(resolve, reject) {
            _Self.vkInit().then(function() {
                window.VK.Auth.getLoginStatus(function(getLoginStatus_response) {
                    _Self._checkPermissions(getLoginStatus_response).then(function(_checkPermissions_response) {
                        if (_checkPermissions_response) {
                            Ember.run(null, resolve);
                        } else {
                            Ember.run(null, reject);
                        }
                    });
                });
            });
        });

        return _Self._LoginStatusPromise;
    },


    /**
     * [vkLogin description]
     * @return {[type]} [description]
     */
    vkLogin() {

        var _Self = this;

        _Self.set('_LoginStatusPromise', null);
        _Self.set('_CheckPermissionsPromise', null);

        _Self._LoginStatusPromise = new Ember.RSVP.Promise(function(resolve, reject) {
            _Self.vkInit().then(function() {
                window.VK.Auth.login(function(login_response) {
                    _Self._checkPermissions(login_response).then(function(_checkPermissions_response) {
                        if (_checkPermissions_response) {
                            console.log('vkLogin');
                            Ember.run(null, resolve);
                        } else {
                            Ember.run(null, reject);
                        }
                    });
                }, ENV.VK.permissions);
            });
        });

        return _Self._LoginStatusPromise;
    },


    /**
     * [_checkPermissions description]
     * @param  {[type]} response [description]
     * @return {[type]}          [description]
     */
    _checkPermissions(response) {

        var _Self = this;

        if (_Self._CheckPermissionsPromise) { return _Self._CheckPermissionsPromise; }

        if (!response.session) {
            _Self._CheckPermissionsPromise = Ember.RSVP.Promise.resolve(false);
            return _Self._CheckPermissionsPromise;
        }

        var _permissions = ENV.VK.permissions || 0;
        
        _Self._CheckPermissionsPromise = new Ember.RSVP.Promise(function(resolve, reject) {
            _Self.api('account.getAppPermissions', {}).then(function(gapResponse) {
                if(gapResponse.response < _permissions) {
                    _Self.vkLogout();
                    Ember.run(null, reject, false);
                }

                //hide loader
                // Scene.hideLoader();
                
                _Self.set('Session', response.session);
                _Self.set('is_logged', true);

                //Trigger event
                // Utils.trigger('Social.onLogin');
                // 
                console.log('_checkPermissions');
                Ember.run(null, resolve, true);
                
            });
        });

        return _Self._CheckPermissionsPromise;
        
    },


    /**
     * [vkLogout description]
     * @return {[type]} [description]
     */
    vkLogout() {

        var _Self = this;

        _Self.getLoginStatus().then(function() {

            if (!_Self._LoginStatusPromise) { return false; }

            window.VK.Auth.logout( function(response) {
                if(!response.session) {
                    _Self.set('Session', null);
                    _Self.set('User', null);
                    _Self.set('is_logged', false);

                    _Self.set('_LoginStatusPromise', null);
                    _Self.set('_CheckPermissionsPromise', null);
                }
            });
        });
    },


    /**
     * [api description]
     * @param  {[type]} method     [description]
     * @param  {[type]} parameters [description]
     * @return {[type]}            [description]
     */
    api(method, parameters) {

        if (!method) { return Ember.RSVP.reject('Please, provide a path for your request'); }

        var _parameters = parameters || {};

        return this.vkInit().then(function() {
          return new Ember.RSVP.Promise(function(resolve, reject) {
            window.VK.Api.call(method, _parameters, function(response) {
              if (response.error) {
                Ember.run(null, reject, response.error);
                return;
              }

              Ember.run(null, resolve, response);
            });
          });
        });
    },


    /**
     * [getCurrentUserData description]
     * @return {[type]} [description]
     */
    getCurrentUserData() {

        var _Self = this;

        return _Self.getLoginStatus().then(function() {
            return new Ember.RSVP.Promise(function(resolve, reject) {  
                var _call_params = {
                                uids: _Self.Session.mid,
                                fields:'uid,first_name,last_name,screen_name,nickname,domain,sex,photo_100,photo_50,email'
                        };

                _Self
                    .api('users.get', _call_params)
                    .then(function(response) {
                        if (response.response && response.response[0]) {
                            
                            _Self.set('User', response.response[0]);
                            Ember.run(null, resolve, response.response[0]);
                            //Trigger event
                            // Utils.trigger('Social.onUserDataReceived');
                        } else {
                            Ember.run(null, reject, response);
                            return;
                        }
                    });
            });
        });
    },


    /**
     * [getCurrentUserAudio description]
     * @return {[type]} [description]
     */
    getCurrentUserAudio() {

        var _Self = this;
        
        return _Self.getLoginStatus().then(function() {
            return new Ember.RSVP.Promise(function(resolve, reject) {
                _Self
                    .api('audio.get', { owner_id: _Self.Session.mid, count: 100})
                    .then(function(response) {
                        if (!response.response) {
                          Ember.run(null, reject, response);
                          return;
                        }

                        Ember.run(null, resolve, response.response);
                    });
            });
        });
    },
});
