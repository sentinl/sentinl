import template from './email_html_action.html';
import help from '../../messages/help';

function emailHtmlAction($rootScope) {
  'ngInject';

  function actionDirective(scope, element, attrs) {
    scope.help = help;
    scope.action = {
      type: 'email HTML',
      status: {
        isHeaderOpen: false,
      },
      priority: {
        selected: scope.actionSettings.email_html.priority || 'low',
        options: ['low', 'medium', 'high'],
        handleChange: () => {
          scope.actionSettings.email_html.priority = scope.action.priority.selected;
        },
      },
    };

    scope.actionSettings.email_html.priority = scope.actionSettings.email_html.priority || scope.action.priority.selected;

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

export default emailHtmlAction;
