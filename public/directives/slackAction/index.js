/*global angular*/
import slackAction from './slack-action';
export default angular.module('apps/sentinl.slackAction', []).directive('slackAction', slackAction);
