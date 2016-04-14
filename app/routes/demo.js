import Ember from 'ember';
import SearchEnabledRouteMixin from '../mixins/search-enabled-route-mixin';

export default Ember.Route.extend( SearchEnabledRouteMixin, {

  Soundcloud: Ember.inject.service('soundcloud'),
  Playlist: Ember.inject.service('playlist'),


  /**
   * [model description]
   * @return {[type]} [description]
   */
  model() {
    var _Self = this;

    _Self._super(...arguments);

    var _Playlist = _Self.get('Playlist');
    var _Soundcloud = _Self.get('Soundcloud');

    var _soundcloud_urls_to_play = [
      'https://soundcloud.com/hotel-on-mars/sentinel',
      'https://soundcloud.com/machetehacks/wake-up-machete-cut',
      'https://soundcloud.com/jerryfolkmusic/oh-wonder-lose-it-jerry-folk-remix',
      'https://soundcloud.com/hiitssarahcl2/roy-kim-spring-spring-spring',
      'https://soundcloud.com/joytechi_music/ed-sheeran-take-me-to-church-hozier-cover',
      'https://soundcloud.com/recordrecords/of-monsters-and-men-little-2',
      'https://soundcloud.com/gnash/firstday',
      'https://soundcloud.com/mutual-benefit/lost-dreamers',
      'https://soundcloud.com/andiyoungmusic/star',
      'https://soundcloud.com/wayne-todd-strong/itll-be-ok',
      'https://soundcloud.com/megadrivemusic/memory-dealer',
      // 'https://soundcloud.com/megadrivemusic/acid-spit',
      'https://soundcloud.com/nightcore-3/my-demons',
      'https://soundcloud.com/benreaves/coldplay-clocks'
    ];

    _soundcloud_urls_to_play.forEach(function(url) {
      _Soundcloud.resolve(url).then(function(Track) {
        _Soundcloud.getAudioUrlToPlay(Track).then(function(data) {
          _Playlist.addPlaylistItems({
                                        artist: Track.user.username,
                                        title: Track.title,
                                        audio:{url: data.url, duration: Math.floor(data.duration / 100)},
                                        album: {image: Track.artwork_url.replace('-large', '-t500x500')}
                                    });
        });
      });
    });

    // TODO:
    return[];
  }
});
