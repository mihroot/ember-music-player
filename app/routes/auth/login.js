import Ember from 'ember';
import UnauthenticatedRouteMixin from 'ember-simple-auth/mixins/unauthenticated-route-mixin';

export default Ember.Route.extend(UnauthenticatedRouteMixin, {
    // VK: Ember.inject.service('vk'),
    Session: Ember.inject.service('session'),

    actions: {
        vkLogin() {

            this.get('Session').authenticate('authenticator:vkauth');

            // var _Self = this;
            // _Self.get('VK').vkLogin().then(function() {
            //     console.log('vkLogin getCurrentUserData');
            //     _Self.get('VK').getCurrentUserData();
            //     _Self.transitionTo('index');
            // });
        }
    },

    init() {
        console.log('auth.login');
    }
});
