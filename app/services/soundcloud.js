import Ember from 'ember';
import ENV from '../config/environment';

export default Ember.Service.extend({

  _InitPromise: null,

  /**
   * [scInit description]
   * @return {[type]} [description]
   */
  scInit() {
    var _Self = this;

    if (_Self._InitPromise) {
      return _Self._InitPromise;
    }

    var _InitSettings = ENV.Soundcloud;
    if (!_InitSettings || !_InitSettings.client_id) {
      return Ember.RSVP.reject('No settings for init');
    }

    _Self._InitPromise = new Ember.RSVP.Promise(function(resolve) {
      Ember.$.getScript('https://connect.soundcloud.com/sdk/sdk-3.0.0.js', function() {
        // Init
        window.SC.initialize(_InitSettings);
        resolve();
      });
    });

    return _Self._InitPromise;
  },


  /**
   * [resolve description]
   * @param  {[type]} url [description]
   * @return {[type]}     [description]
   */
  resolve(url) {

    var _Self = this;

    return _Self.scInit().then(function() {
      return new Ember.RSVP.Promise(function(resolve, reject) {
        window.SC.get('/resolve?url=' + url).then(function(track) {
          resolve(track);
        }).catch(function(error) {
          reject(error.message);
        });
      });
    });
  },


  /**
   * [getAudioUrlToPlay description]
   * @param  {[type]} soundcloud_url_to_resolve [description]
   * @return {[type]}                           [description]
   */
  getAudioUrlToPlay(TrackObj) {
    return new Ember.RSVP.Promise(function(resolve, reject) {
      window.SC.stream('/tracks/'+TrackObj.id).then(function(player) {
        player.initAudio().then(function() {
          resolve(player.streamInfo);
        });
        // player.initAudio(...).then(...).catch is not a function :(
        // .catch(function(error) {
        //   reject(error.message);
        // });
      }).catch(function(error) {
        reject(error.message);
      });
    });
  }

});
