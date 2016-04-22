import Ember from 'ember';
import randomInt from '../utils/random-int';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import SearchEnabledRouteMixin from '../mixins/search-enabled-route-mixin';

export default Ember.Route.extend(AuthenticatedRouteMixin, SearchEnabledRouteMixin, {

  VK:       Ember.inject.service('vk'),
  LastFM:   Ember.inject.service('lastfm'),
  Playlist: Ember.inject.service('playlist'),


  /**
   * [model description]
   * @param  {[type]} params [description]
   * @return {[type]}        [description]
   */
  model(params) {
    var _Self = this;

    console.log('TopOf.js ' + params.query);
    var _artist_name = params.query;

    var _Playlist = _Self.get('Playlist');
        _Playlist.reset();

    // Get artist top tracks
    _Self.get('LastFM').artistGetTopTracks(_artist_name, 20).then(function(data) {
      
      Ember.Logger.info('searchTop: ' + data.length + ' tracks found');
      
      data.forEach(function(track) {
        var _query = {
          q: track.artist.name + ' ' + track.name,
          performer_only: 0,
          count: 1,
          sort: 2 // 2 — popularity, 1 — duration, 0 - add date
        };

        _Self.get('VK').sapi('audio.search', _query).then(function(response) {
            //-1, VK return total audio files in first row
            var _items_found = (response.response.length - 1);
            if (_items_found) {
              //Calc random audio index
              var _i = randomInt(1, _items_found);
              _Playlist.processTracksFromVK(response.response[_i]);
            }
        });
      });

      return true;
    }, function(){});
    
    // TODO:
    return [];
  }

});