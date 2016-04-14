import Ember from 'ember';

//Track info prototype
const PlaylistItem = {
  artist: '',
  title: '',
  // full_name: Ember.computed('artist', 'title', function() {
  //                                 return `${this.get('artist')} - ${this.get('title')}`;
  //                             }),
  listeners: 0,
  album: {
    artist: '',
    title: '',
    image: '/img/misc/no_photo.gif'
  },
  audio: {
    url: '',
    duration: 0
  },
};

export default Ember.Service.extend(Ember.Evented, {

  items: Ember.A(),
  items_count: 0,

  _reset_time: Date.now(),

  /**
   * [addPlaylistItems description]
   * @param {[type]} items [description]
   */
  addPlaylistItems(items) {

    var _Self = this;

    if (!items) {
      return [];
    }

    if (!Ember.isArray(items)) {
      items = [items];
    }

    var _items = _Self.get('items');
    var _added_items = [];
    items.forEach(function(item) {
      if (typeof(item) !== 'object') {
        return;
      }
      // init _playlist_item object
      var _playlist_item = Ember.$.extend(true, {}, PlaylistItem, item);
      _playlist_item.p_offset = _Self.items_count++; //Playlist offset, get current value and increment, so ID starts from 0.
      // push
      _items.pushObject(_playlist_item);
      _added_items.push(_playlist_item);
    });

    _Self.trigger('playlistItemsAdded', _added_items);
    return _added_items;
  },


  /**
   * [processTracksFromVK description]
   * @param  {[type]} tracks [description]
   * @return {[type]}        [description]
   */
  processTracksFromVK(tracks) {

    var _Self = this;

    if (!tracks) {
      return [];
    }

    if (!Ember.isArray(tracks)) {
      tracks = [tracks];
    }

    var _items_to_add = [];
    tracks.forEach(function(track) {
      _items_to_add.push({
        artist: track.artist,
        title: track.title,
        audio: {
          url: _Self._prepareVKAudioUrl(track.url),
          duration: track.duration
        }
      });
    });

    return _Self.addPlaylistItems(_items_to_add);
  },


  /**
   * [_prepareVKAudioUrl description]
   * @param  {[type]} audio_url [description]
   * @return {[type]}           [description]
   */
  _prepareVKAudioUrl(audio_url) {
    return '/proxy?p=' + audio_url.replace(/\?.*/, '');
  },


  /**
   * [getItems description]
   * @param  {[type]} offset [description]
   * @param  {[type]} limit  [description]
   * @return {[type]}        [description]
   */
  getItems(offset, limit) {
    var _length = this.length();
    if (!_length || offset === undefined || limit === undefined) {
      return false;
    }

    var _result_range = Ember.A();
    while (limit-- && offset < _length) {
      _result_range.pushObject(this.items[offset]);
      offset++;
    }

    return _result_range;
  },


  /**
   * [prevItem description]
   * @param  {[type]} AnchorItem [description]
   * @return {[type]}            [description]
   */
  prevItem: function(AnchorItem) {
    if (!this.length() || !AnchorItem) {
      return false;
    }

    var _p_offset = AnchorItem.p_offset;

    if (_p_offset && this.items[_p_offset - 1] !== undefined) {
      return this.items[_p_offset - 1];
    }

    return false;
  },


  /**
   * [nextItem description]
   * @param  {[type]} AnchorItem [description]
   * @return {[type]}            [description]
   */
  nextItem: function(AnchorItem) {
    if (!this.length() || !AnchorItem) {
      return false;
    }

    var _p_offset = AnchorItem.p_offset;

    if (this.items[_p_offset + 1] !== undefined) {
      return this.items[_p_offset + 1];
    }

    return false;
  },


  /**
   * [length description]
   * @return {[type]} [description]
   */
  length() {
    return this.get('items_count');
  },


  /**
   * [reset description]
   * @return {[type]} [description]
   */
  reset() {
    this.set('items', Ember.A());
    this.set('items_count', 0);

    this.set('_reset_time', Date.now());
  },


  /**
   * [getResetTime description]
   * @return {[type]} [description]
   */
  getResetTime() {
    return this.get('_reset_time');
  }
});