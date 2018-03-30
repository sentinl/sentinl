/*global angular*/
import PopOver from './pop_over';
export default angular.module('apps/sentinl.popOver', []).directive('popOver', /* @ngInject */  ($compile) => new PopOver($compile));
