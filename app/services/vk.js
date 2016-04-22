import Ember from 'ember';
import ENV from '../config/environment';

const ERROR_CODE = { TOO_MANY_REQUESTS: 6, CAPTCHA_NEEDED: 14 };

export default Ember.Service.extend(Ember.Evented, {

  _InitPromise: null,
  _LoginStatusPromise: null,
  _CheckPermissionsPromise: null,

  Session: null,
  User: null,

  is_logged: false,

  _is_captcha_needed: false,
  _captcha_sid: '',
  _captcha_code: '',

  _requests_per_second: 3,
  _last_scheduled_time: 0,
  _requests_scheduled: 0,
  _last_request_time: 0,

  _requests_queue: [],

  /**
   * [vkInit description]
   * @return {[type]} [description]
   */
  vkInit() {
    var _Self = this;

    if (_Self._InitPromise) {
      return _Self._InitPromise;
    }

    if (ENV.VK && ENV.VK.skipInit) {
      _Self._InitPromise = Ember.RSVP.Promise.resolve('skip init');
      return _Self._InitPromise;
    }

    var _InitSettings = ENV.VK;
    if (!_InitSettings || !_InitSettings.apiId) {
      return Ember.RSVP.reject('No settings for init');
    }

    _Self._InitPromise = new Ember.RSVP.Promise(function(resolve) {
      window.vkAsyncInit = function() {
        window.VK.init(_InitSettings);
        resolve();

        Ember.Logger.info('Service VK: inited');
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

    if (_Self._LoginStatusPromise) {
      return _Self._LoginStatusPromise;
    }
    console.log('getLoginStatus');
    _Self._LoginStatusPromise = new Ember.RSVP.Promise(function(resolve, reject) {
      _Self.vkInit().then(function() {
        window.VK.Auth.getLoginStatus(function(getLoginStatus_response) {
          _Self._checkPermissions(getLoginStatus_response).then(function(_checkPermissions_response) {
            if (_checkPermissions_response) {
              resolve();
            } else {
              reject();
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
              resolve(resolve);
            } else {
              reject(reject);
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

    if (_Self._CheckPermissionsPromise) {
      return _Self._CheckPermissionsPromise;
    }

    if (!response.session) {
      _Self._CheckPermissionsPromise = Ember.RSVP.Promise.resolve(false);
      return _Self._CheckPermissionsPromise;
    }

    var _permissions = ENV.VK.permissions || 0;

    _Self._CheckPermissionsPromise = new Ember.RSVP.Promise(function(resolve, reject) {
      _Self.api('account.getAppPermissions', {}).then(function(gapResponse) {
        if (gapResponse.response < _permissions) {
          _Self.vkLogout();
          reject(false);
        }

        //hide loader
        // Scene.hideLoader();

        _Self.set('Session', response.session);
        _Self.set('is_logged', true);

        console.log('_checkPermissions resolve');
        resolve(true);

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

    return _Self.getLoginStatus().then(function() {

      return new Ember.RSVP.Promise(function(resolve, reject) {
        if (!_Self._LoginStatusPromise) {
          reject(false);
        }

        window.VK.Auth.logout(function(response) {
          if (response.session) {
            reject(false);
          }

          _Self.set('Session', null);
          _Self.set('User', null);
          _Self.set('is_logged', false);

          _Self.set('_LoginStatusPromise', null);
          _Self.set('_CheckPermissionsPromise', null);

          resolve(true);
        });
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
    var _Self = this;

    if (!method) {
      return Ember.RSVP.reject('Please, provide a path for your request');
    }

    var _parameters = parameters || {};

    return _Self.vkInit().then(function() {
      return new Ember.RSVP.Promise(function(resolve, reject) {
        window.VK.Api.call(method, _parameters, function(response) {
          if (response.error) {
            reject(response.error);
            return;
          }
          resolve(response);
        });
      });
    });
  },


  /**
   * Safe API call
   * @param  {[type]} method     [description]
   * @param  {[type]} parameters [description]
   * @return {[type]}            [description]
   */
  sapi(method, parameters) {
    var _Self = this;

    if (!method) {
      return Ember.RSVP.reject('Please, provide a path for your request');
    }

    var _parameters = parameters || {};

    return _Self.vkInit().then(function() {
      var _PromiseResolver = function(resolve, reject) {
        _Self._sapiResolver.call(_Self, method, _parameters, resolve, reject);
      };
      return new Ember.RSVP.Promise(_PromiseResolver);
    });
  },


  /**
   * [_sapiResolver description]
   * @param  {[type]} method     [description]
   * @param  {[type]} parameters [description]
   * @param  {[type]} resolve    [description]
   * @param  {[type]} reject     [description]
   * @return {[type]}            [description]
   */
  _sapiResolver(method, parameters, resolve/*, reject*/) {
    var _Self = this;

    var _resolver_args = arguments;
    
    var _second   = 1100;
    var _time_now = Date.now();
    var _timeout  = 0;

    // Requests per second control(here we try to avoid `to many calls per second` error)
    if (_Self._last_scheduled_time + _second < _time_now) {
      _Self._last_scheduled_time = _time_now;
      _Self._requests_scheduled  = 1;
    } else {
      
      _Self._requests_scheduled++;
      
      if (_Self._requests_scheduled > _Self._requests_per_second) {
        _Self._last_scheduled_time = _Self._last_scheduled_time + _second;
        _Self._requests_scheduled = 1;
      }
      
      _timeout = _Self._last_scheduled_time - _time_now;
      if (_timeout < 0) {
        _timeout = 0;
      }
    }

    _Self._last_request_time = _time_now;

    // Delay API call if needed
    (function(time, timeout) {
      setTimeout(function() {

        // no need to do request, while captcha still not entered
        if (_Self.get('_is_captcha_needed')) {
          _Self._handleError.call(_Self, {error_code: ERROR_CODE.CAPTCHA_NEEDED}, _resolver_args);
          return;
        }

        // provide captcha
        if (_Self.get('_captcha_sid') && _Self.get('_captcha_code')) {
          parameters['captcha_sid'] = _Self.get('_captcha_sid');
          parameters['captcha_key'] = _Self.get('_captcha_code');
        }

        window.VK.Api.call(method, parameters, function(response) {
          if (response.error) {
            _Self._handleError.call(_Self, response.error, _resolver_args);
            return;
          }

          _Self.set('_captcha_sid', '');
          _Self.set('_captcha_code', '');

          resolve(response);
        });
      }, timeout);
    })(_time_now, _timeout);
  },


  /**
   * [_handleError description]
   * @param  {[type]} error          [description]
   * @param  {[type]} _resolver_args [description]
   * @return {[type]}                [description]
   */
  _handleError(error, _resolver_args) {
    // var _method     = _resolver_args[0];
    // var _parameters = _resolver_args[1];
    // var _resolve    = _resolver_args[2];
    var _reject     = _resolver_args[3];

    switch(error.error_code) {
      
      case ERROR_CODE.TOO_MANY_REQUESTS:
        //retry
        this._sapiResolver.apply(this, _resolver_args);
      break;
      
      case ERROR_CODE.CAPTCHA_NEEDED:

        // trigger event, so application can show captcha input to user
        if (!this.get('_is_captcha_needed')) {
          this.set('_is_captcha_needed', true);
          this.trigger('captchaNeeded', error);
        }

        // while captcha not provided, request will not be resolved or rejected
        this._requests_queue.push(_resolver_args);
      break;

      default:
        _reject(error);
      break;
    }
  },


  /**
   * [provideCaptcha description]
   * @param  {[type]} captcha_sid  [description]
   * @param  {[type]} captcha_code [description]
   * @return {[type]}              [description]
   */
  provideCaptcha(captcha_sid, captcha_code) {
    var _Self = this;

    _Self.set('_captcha_sid', captcha_sid);
    _Self.set('_captcha_code', captcha_code);

    // remove captcha breakpoint
    _Self.set('_is_captcha_needed', false);
    
    //copy current queue and reset
    var _queue = Ember.$.extend([], _Self._requests_queue);
    _Self._requests_queue = [];
    
    _queue.forEach(function(resolver_args) {
      _Self._sapiResolver.apply(_Self, resolver_args);
    });
  },


  /**
   * [getCurrentUserData description]
   * @return {[type]} [description]
   */
  getCurrentUserData() {
    var _Self = this;
    console.log('getCurrentUserData');
    return _Self.getLoginStatus().then(function() {
      return new Ember.RSVP.Promise(function(resolve, reject) {
        var _call_params = {
          uids: _Self.Session.mid,
          fields: 'uid,first_name,last_name,screen_name,nickname,domain,sex,photo_100,photo_50,email'
        };

        _Self
          .api('users.get', _call_params)
          .then(function(response) {
            if (response.response && response.response[0]) {

              _Self.set('User', response.response[0]);
              resolve(response.response[0]);
              //Trigger event
              // Utils.trigger('Social.onUserDataReceived');
            } else {
              reject(response);
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
          .api('audio.get', {
            owner_id: _Self.Session.mid
            // count: 100
          })
          .then(function(response) {
            if (!response.response) {
              reject(response);
              return;
            }
            var _response = Array.prototype.slice.call(response.response).splice(1, response.response.length);
            resolve(_response);
          });
      });
    });
  }
});