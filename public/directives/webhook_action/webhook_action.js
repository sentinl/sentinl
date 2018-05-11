/*global angular*/
import { has } from 'lodash';
import template from './webhook_action.html';
import help from '../../messages/help';

function webhookAction($rootScope) {
  'ngInject';

  function actionDirective(scope, element, attrs) {
    scope.help = help;
    scope.action = {
      type: 'webhook',
      title: scope.actionName,
      status: {
        isHeaderOpen: false,
      },
      priority: {
        selected: scope.actionSettings.webhook.priority || 'low',
        options: ['low', 'medium', 'high'],
        handleChange: () => {
          scope.actionSettings.webhook.priority = scope.action.priority.selected;
        },
      },
    };

    scope.actionSettings.webhook.priority = scope.actionSettings.webhook.priority || scope.action.priority.selected;

    if (has(scope.watcher._source.actions[scope.actionName].webhook, 'headers')) {
      let headers = scope.watcher._source.actions[scope.actionName].webhook.headers;
      scope.watcher._source.actions[scope.actionName].webhook._headers = angular.toJson(headers, 'pretty');
    }

    scope.changeMethod = function (method) {
      scope.watcher._source.actions[scope.actionName].webhook.method = method;
    };

    scope.removeAction = function () {
      $rootScope.$broadcast('action:removeAction', { name: scope.actionName });
    };
  };

  return {
    restrict: 'E',
    template,
    scope: {
      actionName: '@',
      actionSettings: '=',
    },
    link: actionDirective
  };
};

export default webhookAction;
