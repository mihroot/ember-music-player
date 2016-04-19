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

    //var params = this.paramsFor(this.routeName);
    console.log('Similar.js ' + params.query);
    var _artist_name = params.query;

    var _Playlist = _Self.get('Playlist');

    _Playlist.reset();
    _Self.get('LastFM').artistGetSimilar(_artist_name, 20).then(function(data) {

      Ember.Logger.info('searchSimilar: ' + data.length + ' artists found');

      data.forEach(function(artist) {

        var _query = {
          q: artist.name,
          performer_only: 1,
          count: 30,
          sort: 2 // 2 — popularity, 1 — duration, 0 - add date
        };

        _Self.get('VK').sapi('audio.search', _query).then(function(response) {

          //-1, VK return total audio files in first row
          var _items_found = (response.response.length - 1);
          // console.log('VKSearchAudio: ' + artist.name + ' - ' + _items_found + ' items found ');
          if (_items_found) {
            //Calc random audio index
            var _i = randomInt(1, _items_found);
            _Playlist.processTracksFromVK(response.response[_i]);
            // _Self.addPlaylistItemsToScene(_playlist_items);

            // if (!_Self.get('AudioPlayer.CurrentPlaylistItem')) {
            //     _Self.get('AudioPlayer').setTrack(_playlist_items[0]);
            // }
          }

        }, function(error) {
          console.log(error);
        });
      });

      return _Self.get('Playlist.items');
    }, function() {});

    // TODO:
    return [];
  }

});