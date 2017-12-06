/*global angular*/
import slackAction from './slack_action';
export default angular.module('apps/sentinl.slackAction', []).directive(slackAction.name, slackAction);
