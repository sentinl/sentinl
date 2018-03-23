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
      title: attrs.name,
      status: {
        isHeaderOpen: false
      }
    };

    if (has(scope.watcher._source.actions[attrs.name].webhook, 'headers')) {
      let headers = scope.watcher._source.actions[attrs.name].webhook.headers;
      scope.watcher._source.actions[attrs.name].webhook._headers = angular.toJson(headers, 'pretty');
    }

    scope.changeMethod = function (method) {
      scope.watcher._source.actions[attrs.name].webhook.method = method;
    };

    scope.removeAction = function () {
      $rootScope.$broadcast('action:removeAction', { name: attrs.name });
    };

  };

  return {
    restrict: 'E',
    template,
    scope: true,
    link: actionDirective
  };
};

export default webhookAction;
