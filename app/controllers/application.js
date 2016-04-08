import Ember from 'ember';

export default Ember.Controller.extend({
    vk: Ember.inject.service(),
    actions: {
        vkLogin() {
            var _Self = this;
            this.get('vk').vkLogin().then(function() {
                console.log('vkLogin getCurrentUserData');
                _Self.get('vk').getCurrentUserData();
            });
        }
    },


    /**
     * [init description]
     * @return {[type]} [description]
     */
    init() {
        var _Self = this;
        _Self.get('vk').getCurrentUserData();
    }
});
