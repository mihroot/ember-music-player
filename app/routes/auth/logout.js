import Ember from 'ember';

export default Ember.Route.extend({
    vk:             Ember.inject.service(),
    AudioPlayer:    Ember.inject.service('audio-player'),


    /**
     * [beforeModel description]
     * @return {[type]} [description]
     */
    beforeModel() {
        this.get('vk').vkLogout();
        this.replaceWith('index');
    }
});
