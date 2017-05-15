import uiModules from 'ui/modules';
import watcherSlackAction from './slack-action.html';

uiModules
.get('api/sentinl', [])
.directive('slackAction', function () {
  function actionDirective(scope, element, attrs) {
    scope.action = {
      type: 'slack'
    };
  }

  return {
    restrict: 'E',
    template: watcherSlackAction,
    scope: true,
    link: actionDirective
  };
});
