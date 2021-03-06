import Ember from 'ember';
import formatTime from '../utils/format-time';

const SEARCH_TYPE = {SIMILAR: 'similar', TOP_TRACKS: 'top_tracks'};

export default Ember.Component.extend({

  AudioPlayer: Ember.inject.service('audio-player'),
  Search: Ember.inject.service('search'),

  is_showing_search_modal: false,
  search_type: '',
  search_query_string: '',

  searchSimilar: Ember.computed('search_type', function() {
                                    return this.get('search_type') === SEARCH_TYPE.SIMILAR;
                                }),
  searchTopOf: Ember.computed('search_type', function() {
                                    return this.get('search_type') === SEARCH_TYPE.TOP_TRACKS;
                                }),

  actions: {
    playPrev() {
      return this.get('AudioPlayer').playPrev();
    },
    playNext() {
      return this.get('AudioPlayer').playNext();
    },
    playPause() {
      return this.get('AudioPlayer').playPause();
    },
    toggleSearchModal() {
      this.toggleProperty('is_showing_search_modal');
    },
    search() {
      var _query = this.get('search_query_string') ?
        this.get('search_query_string') :
        (
          this.get('AudioPlayer.CurrentPlaylistItem') ?
          this.get('AudioPlayer.CurrentPlaylistItem').artist :
          ''
        );

      this.set('is_showing_search_modal', false);

      if (!_query) {
        return;
      }

      var _search_type = this.get('search_type');

      switch (_search_type) {
        case SEARCH_TYPE.SIMILAR:
          this.get('Search').searchSimilar(_query);
          break;
        case SEARCH_TYPE.TOP_TRACKS:
          this.get('Search').searchTopTracks(_query);
          break; 
      }

      this.set('search_type', '');
      this.set('search_query_string', '');
    }
  },


  /**
   * [didInsertElement description]
   * @return {[type]} [description]
   */
  didInsertElement() {
    var _Self = this;
    _Self._super(...arguments);

    console.log('Player-audio-controls didInsertElement');
    
    _Self.set('_original_document_title', document.title);


    // Subscribe to AudioPlayer events
    _Self.get('AudioPlayer').on('onPlayProgress', _Self, '_onPlayProgress');
    _Self.get('AudioPlayer').on('onLoadProgress', _Self, '_onLoadProgress');
    _Self.get('AudioPlayer').on('playlistItemSet', _Self, '_resetBars');


    //Event listeners
    _Self.$(document).bind('keyup.player_audio_controls', function(event) {

      //No need to process keyup if user types something in SearchBox, etc.
      if (event.target !== document.body) {
        return false;
      }

      if (event.which === 39) {
        _Self.get('AudioPlayer').playNext();
      } else if (event.which === 37) {
        _Self.get('AudioPlayer').playPrev();
      } else if (event.which === 32) { //spacebar
        _Self.get('AudioPlayer').playPause();
      } else if (event.which === 70) { //f
        _Self.set('search_type', SEARCH_TYPE.SIMILAR);
        _Self.set('is_showing_search_modal', true);
      } else if(event.which === 84) { //t
        _Self.set('search_type', SEARCH_TYPE.TOP_TRACKS);
        _Self.set('is_showing_search_modal', true);
      }
      return false;
    });
    _Self.$(window).bind('resize.player_audio_controls', function() {
      return _Self._centerControls.apply(_Self, arguments);
    });
    _Self.$('#c-p-select').bind('click.player_audio_controls', function() {
      return _Self._onProgressSelect.apply(_Self, arguments);
    });

    _Self._centerControls();
  },


  /**
   * [willDestroyElement description]
   * @return {[type]} [description]
   */
  willDestroyElement() {
    // Unubscribe from AudioPlayer events
    this.get('AudioPlayer').off('onPlayProgress', this, '_onPlayProgress');
    this.get('AudioPlayer').off('onLoadProgress', this, '_onLoadProgress');
    this.get('AudioPlayer').off('playlistItemSet', this, '_resetBars');

    this.$(document).unbind('.player_audio_controls');
    this.$(window).unbind('.player_audio_controls');
    this.$('#c-p-select').unbind('.player_audio_controls');
  },


  /**
   * [_centerControls description]
   * @return {[type]} [description]
   */
  _centerControls() {
    var $_Items = this.$('.center-absolute');
    $_Items.each(function() {
      let $_e = Ember.$(this);
      $_e.css('left', ((window.innerWidth - $_e.width()) / 2));
    });
  },


  /**
   * [_onPlayProgress description]
   * @param  {[type]} Audio [description]
   * @return {[type]}       [description]
   */
  _onPlayProgress(Audio) {
    var _current_time = Math.floor(Audio.currentTime * 1000) / 1000;
    var _total_time = Math.floor(Audio.duration * 1000) / 1000;

    var _per = (_current_time / _total_time * 100);
    _per = Math.min(100, Math.max(0, _per));

    this.$('#c-p-played').css('width', _per + '%');
    this.$('#c-p-t-left').html('-' + formatTime(Math.round(_total_time - _current_time)));
  },


  /**
   * [_onLoadProgress description]
   * @param  {[type]} Audio [description]
   * @return {[type]}       [description]
   */
  _onLoadProgress(Audio) {
    var _total_time = Math.floor(Audio.duration * 1000) / 1000;
    var _buffered_time;
    try {
      _buffered_time = (Math.floor(Audio.buffered.end(0) * 1000) / 1000) || 0;
    } catch (e) {}


    if (_total_time && Math.abs(_total_time - _buffered_time) < 0.1) {
      _buffered_time = _total_time;
    }

    var _per = Math.ceil(_buffered_time / _total_time * 100);
    _per = Math.min(100, Math.max(0, _per));

    this.$('#c-p-loaded').css('width', _per + '%');
  },


  /**
   * [_onProgressSelect description]
   * @param  {[type]} event [description]
   * @return {[type]}       [description]
   */
  _onProgressSelect(event) {
    var _Audio = this.get('AudioPlayer').getAudio();

    if (!_Audio) {
      return false;
    }

    var $_SelectArea = this.$('#c-p-select');
    var _Rect = $_SelectArea.get(0).getBoundingClientRect();

    var _per = Math.ceil((event.pageX - _Rect.left) / $_SelectArea.outerWidth() * 100);
    _per = Math.min(100, Math.max(0, _per));

    var _duration = _Audio.duration;
    if (isNaN(_duration)) {
      return false;
    }

    var _total_time = Math.floor(_duration * 1000) / 1000;
    _Audio.currentTime = _per * _total_time / 100;
  },


  /**
   * [_resetBars description]
   * @return {[type]} [description]
   */
  _resetBars() {
    this.$('#c-p-played').css('width', '0%');
    this.$('#c-p-t-left').html('');
    this.$('#c-p-loaded').css('width', '0%');
  }
});