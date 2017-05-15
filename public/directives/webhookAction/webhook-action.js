import _ from 'lodash';
import uiModules from 'ui/modules';
import watcherWebhookAction from './webhook-action.html';

uiModules
.get('api/sentinl', [])
.directive('webhookAction', function () {

  function actionDirective(scope, element, attrs) {

    scope.action = {
      type: 'webhook',
      title: attrs.name
    };

    if (_.has(scope.watcher._source.actions[attrs.name].webhook, 'headers')) {
      scope.watcher._source.actions[attrs.name].webhook._proxy = true;
      let headers = scope.watcher._source.actions[attrs.name].webhook.headers;
      scope.watcher._source.actions[attrs.name].webhook._headers = JSON.stringify(headers, null, 2);
    }

    scope.changeMethod = function (method) {
      scope.watcher._source.actions[attrs.name].webhook.method = method;
    };

    scope.enableExtraFields = function () {
      if (scope.watcher._source.actions[attrs.name].webhook._proxy) {
        scope.watcher._source.actions[attrs.name].webhook.headers = {};
        scope.watcher._source.actions[attrs.name].webhook._headers = '';
      } else {
        delete scope.watcher._source.actions[attrs.name].webhook.headers;
        delete scope.watcher._source.actions[attrs.name].webhook._headers;
      }
    };

  };

  return {
    restrict: 'E',
    template: watcherWebhookAction,
    scope: true,
    link: actionDirective
  };
});
