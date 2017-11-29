import watcherConsoleAction from './console-action.html';
import help from '../../messages/help';

const consoleAction = function ($rootScope) {
  function actionDirective(scope, element, attrs) {
    scope.help = help;
    scope.action = {
      type: 'console',
      status: {
        isHeaderOpen: false
      }
    };

    scope.removeAction = function () {
      $rootScope.$broadcast('action:removeAction', { name: attrs.name });
    };

  }

  return {
    restrict: 'E',
    template: watcherConsoleAction,
    scope: true,
    link: actionDirective
  };
};

consoleAction.$inject = ['$rootScope'];
export default consoleAction;
