/*global angular*/
import newAction from './new_action';
export default angular.module('apps/sentinl.newAction', []).directive(newAction.name, newAction);
