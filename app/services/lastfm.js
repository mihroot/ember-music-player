import Ember from 'ember';
import ENV from '../config/environment';

export default Ember.Service.extend({

    LastFM: null,

    /**
     * [init description]
     * @return {[type]} [description]
     */
    init() {

        this._super(...arguments);

        /* Create a cache object */
        var _Cache = new window.LastFMCache();
        
        /* Create a LastFM object */
        this.LastFM = new window.LastFM({
          apiKey    : ENV.LastFM.apiKey,
          apiSecret : ENV.LastFM.apiSecret,
          cache     : _Cache
        });
        
        Ember.Logger.info('Service LastFM: inited');
    },


    /**
     * [trackGetInfo description]
     * @param  {[type]} artist [description]
     * @param  {[type]} track  [description]
     * @return {[type]}        [description]
     */
    trackGetInfo: function(artist, track) {

      var _Self = this;

      return new Ember.RSVP.Promise(function(resolve, reject) {
        _Self.get('LastFM').track.getInfo({
                                              artist: artist,
                                              track: track
                                          }, {
                                            success(data) {
                                              Ember.run(null, resolve, data.track);
                                            },
                                            error(code, message) {
                                              Ember.run(null, reject, message);
                                            }
                                          });
        });
    },


    /**
     * [artistGetSimilar description]
     * @param  {[type]} artist_name [description]
     * @param  {[type]} limit       [description]
     * @return {[type]}             [description]
     */
    artistGetSimilar: function(artist_name, limit) {

      var _Self = this;

      return new Ember.RSVP.Promise(function(resolve, reject) {
        _Self.get('LastFM').artist.getSimilar({
                                              artist: artist_name,
                                              autocorrect: 1,
                                              limit: limit
                                          }, {
                                            success(data) {
                                              var _artistis = [];
                                              if(data.similarartists && data.similarartists.artist && Ember.isArray(data.similarartists.artist)) {
                                                _artistis = data.similarartists.artist;
                                              }

                                              Ember.run(null, resolve, _artistis);
                                            },
                                            error(code, message) {
                                              //6 - "The artist you supplied could not be found"
                                              if(code === 6) {
                                                Ember.run(null, resolve, []);
                                              } else {
                                                Ember.run(null, reject, message);
                                              }
                                            }
                                          });
        });
    },


    /**
     * [artistGetTopTracks description]
     * @param  {[type]} artist_name [description]
     * @param  {[type]} limit       [description]
     * @return {[type]}             [description]
     */
    artistGetTopTracks: function(artist_name, limit) {

      var _Self = this;

      return new Ember.RSVP.Promise(function(resolve, reject) {
        _Self.get('LastFM').artist.getTopTracks({
                                              artist: artist_name,
                                              autocorrect: 1,
                                              limit: limit
                                          }, {
                                            success(data) {
                                              var _tracks = [];
                                              if(data.toptracks && data.toptracks.track && Ember.isArray(data.toptracks.track)) {
                                                _tracks = data.toptracks.track;
                                              }

                                              Ember.run(null, resolve, _tracks);
                                            },
                                            error(code, message) {
                                              //6 - "The artist you supplied could not be found"
                                              if(code === 6) {
                                                Ember.run(null, resolve, []);
                                              } else {
                                                Ember.run(null, reject, message);
                                              }
                                            }
                                          });
        });
    }
});
