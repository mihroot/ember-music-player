import Ember from 'ember';

export default Ember.Service.extend(Ember.Evented, {
  
  /**
   * [searchSimilar description]
   * @param  {[type]} query [description]
   * @return {[type]}       [description]
   */
  searchSimilar(query) {
    this.trigger('searchSimilarToInitiated', query);
  },

  /**
   * [searchTopTracks description]
   * @param  {[type]} query [description]
   * @return {[type]}       [description]
   */
  searchTopTracks(query) {
    this.trigger('searchTopTracksInitiated', query);
  }
  
});
