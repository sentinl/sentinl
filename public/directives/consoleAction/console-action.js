import uiModules from 'ui/modules';
import watcherConsoleAction from './console-action.html';

uiModules
.get('api/sentinl', [])
.directive('consoleAction', function () {
  function actionDirective(scope, element, attrs) {
    scope.action = {
      type: 'console'
    };
  }

  return {
    restrict: 'E',
    template: watcherConsoleAction,
    scope: true,
    link: actionDirective
  };
});
