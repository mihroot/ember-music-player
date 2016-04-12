import Ember from 'ember';

export default Ember.Service.extend(Ember.Evented, {
  
  /**
   * [search description]
   * @param  {[type]} query [description]
   * @return {[type]}       [description]
   */
  search(query) {
    this.trigger('searchInitiated', query);
  }
  
});
