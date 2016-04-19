import Ember from 'ember';

export default Ember.Component.extend({

  selector: '',

  /**
   * [didInsertElement description]
   * @return {[type]} [description]
   */
  didInsertElement() {
    this.$((this.get('selector') ? this.get('selector') : 'input,textarea,select')).focus();
  }

});
