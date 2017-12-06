/*global angular*/
import webhookAction from './webhook_action';
export default angular.module('apps/sentinl.webhookAction', []).directive(webhookAction.name, webhookAction);
