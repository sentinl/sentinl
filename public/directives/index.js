/* global angular */

import consoleAction from './consoleAction';
import emailAction from './emailAction';
import emailHtmlAction from './emailHtmlAction';
import newAction from './newAction';
import periodTag from './periodTag';
import reportAction from './reportAction';
import slackAction from './slackAction';
import webhookAction from './webhookAction';

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
