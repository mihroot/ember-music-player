import Ember from 'ember';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import SearchEnabledRouteMixin from '../mixins/search-enabled-route-mixin';


export default Ember.Route.extend(AuthenticatedRouteMixin, SearchEnabledRouteMixin, {

  VK: Ember.inject.service('vk'),
  Playlist: Ember.inject.service('playlist'),


  /**
   * [model description]
   * @return {[type]} [description]
   */
  model() {
    var _Self = this;

    var _Playlist = _Self.get('Playlist');
        _Playlist.reset();

    _Self.get('VK').getCurrentUserAudio().then(function(tracks) {
      var _playlist_items = _Playlist.processTracksFromVK(tracks);
      Ember.Logger.info('VK->getCurrentUserAudio: ' + _playlist_items.length + ' tracks added to playlist');
      return _playlist_items;
    });

    // TODO:
    return[];
  }
});