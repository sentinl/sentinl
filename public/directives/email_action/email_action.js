import template from './email_action.html';
import help from '../../messages/help';

function emailAction($rootScope) {
  'ngInject';

  function actionDirective(scope, element, attrs) {
    scope.help = help;
    scope.action = {
      type: 'email',
      status: {
        isHeaderOpen: false,
      },
      priority: {
        selected: scope.actionSettings.email.priority || 'low',
        options: ['low', 'medium', 'high'],
        handleChange: () => {
          scope.actionSettings.email.priority = scope.action.priority.selected;
        },
      },
    };

    scope.actionSettings.email.priority = scope.actionSettings.email.priority || scope.action.priority.selected;

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

export default emailAction;
