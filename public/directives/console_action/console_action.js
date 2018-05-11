import template from './console_action.html';
import help from '../../messages/help';

function consoleAction($rootScope) {
  'ngInject';

  function actionDirective(scope, element, attrs) {
    scope.help = help;
    scope.action = {
      type: 'console',
      status: {
        isHeaderOpen: false,
      },
      priority: {
        selected: scope.actionSettings.console.priority || 'low',
        options: ['low', 'medium', 'high'],
        handleChange: () => {
          scope.actionSettings.console.priority = scope.action.priority.selected;
        },
      },
    };

    scope.actionSettings.console.priority = scope.actionSettings.console.priority || scope.action.priority.selected;

    scope.removeAction = function () {
      $rootScope.$broadcast('action:removeAction', { name: scope.actionName });
    };
  }

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

export default consoleAction;
