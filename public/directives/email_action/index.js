/*global angular*/
import emailAction from './email_action';
export default angular.module('apps/sentinl.emailAction', []).directive(emailAction.name, emailAction);
