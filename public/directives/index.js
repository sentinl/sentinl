/* global angular */

import consoleAction from './console_action';
import emailAction from './email_action';
import emailHtmlAction from './email_html_action';
import newAction from './new_action';
import periodTag from './period_tag';
import reportAction from './report_action';
import slackAction from './slack_action';
import webhookAction from './webhook_action';

export default angular.module('apps/sentinl.directives', [
  consoleAction.name,
  emailAction.name,
  emailHtmlAction.name,
  newAction.name,
  periodTag.name,
  reportAction.name,
  slackAction.name,
  webhookAction.name
]);
