/*global angular*/
import PopOver from './pop_over';
angular.module('apps/sentinl.popOver', []).directive('popOver', /* @ngInject */  ($compile) => new PopOver($compile));
