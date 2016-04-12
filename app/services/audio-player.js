import Ember from 'ember';

const REPEAT_MODE = { NO_REPEAT: 0, REPEAT_TRACK: 1 };

export default Ember.Service.extend(Ember.Evented, {

    Playlist:   Ember.inject.service('playlist'),
    CurrentPlaylistItem: null,

    is_paused:  true,
    _Audio: null,

    _repeat_mode: REPEAT_MODE.NO_REPEAT,

    _original_document_title: '',


    /**
     * [init description]
     * @return {[type]} [description]
     */
    init() {
        this.set('_original_document_title', document.title);
    },


    /**
     * [reset description]
     * @return {[type]} [description]
     */
    reset() {

        document.title = this.get('_original_document_title');

        var _Audio = this.get('_Audio');
        if (!_Audio) {
            return false;
        }
        
        //Do we need to remove events listeners?
        _Audio.pause();
        
        //Stop audio downloading
        _Audio.src = '';
        _Audio.load();
        
        this.set('CurrentPlaylistItem', null);
        this.set('_Audio', null);

        this.set('is_paused', true);
    },


    /**
     * [getAudio description]
     * @return {[type]} [description]
     */
    getAudio() {
        return this.get('_Audio');
    },


    /**
     * [setTrack description]
     * @param {[type]} PlaylistItem [description]
     */
    setTrack(PlaylistItem) {
        
        var _Self = this;

        //
        _Self.reset();

        //
        var _Audio = new Audio(PlaylistItem.audio.url);
        
        _Self.set('CurrentPlaylistItem', PlaylistItem);
        _Self.set('_Audio', _Audio);
        _Self.playPause();

        _Audio.addEventListener('abort', function() {
            console.log('Audio: Abort. The user agent stops fetching the media data' +
                            'before it is completely downloaded, but not due to an error.');
        }, false);
        
        _Audio.addEventListener('timeupdate', function() { _Self._onPlayProgress.call(_Self); }, false);
        _Audio.addEventListener('progress', function() { _Self._onLoadProgress.call(_Self); }, false);
        _Audio.addEventListener('ended', function() { _Self._onAudioEnded.call(_Self); }, false);
        
        //Update page title
        // document.title = PlaylistItem.get('full_name');
        document.title = PlaylistItem.artist + ' - ' + PlaylistItem.title;
        
        // if(Player._audioContext) {
            
        //     Player._sourceNode = Player._audioContext.createMediaElementSource(Player._audio);
        //     Player._sourceNode.connect(Player._audioAnalyser);
            
        // }
        
        _Self.trigger('playlistItemSet', PlaylistItem);
    },


    /**
     * [_onAudioEnded description]
     * @return {[type]} [description]
     */
    _onAudioEnded() {
        var _Self = this;

        if (_Self._repeat_mode === REPEAT_MODE.NO_REPEAT) {
            return _Self.playNext();
        }
        else {
            _Self.get('_Audio').play();
        }
        
        return false;
    },


    /**
     * [_onPlayProgress description]
     * @return {[type]} [description]
     */
    _onPlayProgress() {
        var _Audio = this.get('_Audio');

        if(!_Audio) {
            return false;
        }
        
        this.trigger('onPlayProgress', _Audio);
    },


    /**
     * [_onLoadProgress description]
     * @return {[type]} [description]
     */
    _onLoadProgress() {
        
        var _Audio = this.get('_Audio');

        if(!_Audio) {
            return false;
        }

        this.trigger('onLoadProgress', _Audio);
    },


    /**
     * [playPause description]
     * @return {[type]} [description]
     */
    playPause() {
        
        var _Audio = this.get('_Audio');

        if (!_Audio) {
            this.set('is_paused', true);
            return false;
        }
                
        if (!_Audio.paused) {
            _Audio.pause();
            this.set('is_paused', true);
        }
        else {
            _Audio.play();
            this.set('is_paused', false);
        }
        
        return false;
    },


    /**
     * [playPrev description]
     * @return {[type]} [description]
     */
    playPrev() {
        var _Self = this;

        var _PlaylistItem = _Self.get('Playlist').prevItem(_Self.get('CurrentPlaylistItem'));
        if(_PlaylistItem) {
            _Self.setTrack(_PlaylistItem);
        }
        
        return false;
    },


    /**
     * [playNext description]
     * @return {[type]} [description]
     */
    playNext() {
        var _Self = this;

        var _PlaylistItem = _Self.get('Playlist').nextItem(_Self.get('CurrentPlaylistItem'));
        if(_PlaylistItem) {
            _Self.setTrack(_PlaylistItem);
        }
        
        return false;
    }

});
