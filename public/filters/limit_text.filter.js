/* global angular */
import moment from 'moment';

class LimitText {
  static factory(text, limit) {
    if (text && !!text.length) {
      text = text.toString();
      return text.length > limit ? text.substring(0, limit - 1) + '...' : text;
    }
    return text;
  }
}

LimitText.factory.$inject = ['text', 'limit'];
export default angular.module('limitText', []).filter('limitText', () => LimitText.factory);
