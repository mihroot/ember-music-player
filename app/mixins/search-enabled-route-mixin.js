import Ember from 'ember';

export default Ember.Mixin.create({
  
  Search: Ember.inject.service('search'),
  
  /**
   * [beforeModel description]
   * @return {[type]} [description]
   */
  beforeModel() {
    var _Self = this;
    _Self._super(...arguments);
    _Self.get('Search').on('searchInitiated', function(query) {
      _Self.transitionTo('/similar/to/' + encodeURI(query));
    });
  }
  
});