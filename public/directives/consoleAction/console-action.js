import watcherConsoleAction from './console-action.html';
import { app } from '../../app.module';

app.directive('consoleAction', function () {
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
