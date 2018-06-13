import template from './slack_action.html';
import help from '../../messages/help';

function slackAction($rootScope) {
  'ngInject';

  function actionDirective(scope, element, attrs) {
    scope.help = help;
    scope.action = {
      type: 'slack',
      status: {
        isHeaderOpen: false,
      },
      priority: {
        selected: scope.actionSettings.slack.priority || 'low',
        options: ['low', 'medium', 'high'],
        handleChange: () => {
          scope.actionSettings.slack.priority = scope.action.priority.selected;
        },
      },
    };

    scope.actionSettings.slack.priority = scope.actionSettings.slack.priority || scope.action.priority.selected;

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

export default slackAction;
