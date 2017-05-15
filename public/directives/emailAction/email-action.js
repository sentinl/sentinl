import uiModules from 'ui/modules';
import watcherEmailAction from './email-action.html';

uiModules
.get('api/sentinl', [])
.directive('emailAction', function () {
  function actionDirective(scope, element, attrs) {
    scope.action = {
      type: 'email'
    };
  }

  return {
    restrict: 'E',
    template: watcherEmailAction,
    scope: true,
    link: actionDirective
  };
});
