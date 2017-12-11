/*global angular*/
import emailHtmlAction from './email_html_action';
export default angular.module('apps/sentinl.email_html_action', []).directive(emailHtmlAction.name, emailHtmlAction);
