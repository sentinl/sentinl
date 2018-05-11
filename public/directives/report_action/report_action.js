import template from './report_action.html';
import help from '../../messages/help';

function reportAction($rootScope) {
  'ngInject';

  function actionDirective(scope, element, attrs) {
    scope.help = help;
    scope.action = {
      type: 'report',
      resolutionPattern: '^\\d{1,4}x\\d{1,4}$',
      status: {
        isHeaderOpen: false,
      },
      priority: {
        selected: scope.actionSettings.report.priority || 'low',
        options: ['low', 'medium', 'high'],
        handleChange: () => {
          scope.actionSettings.report.priority = scope.action.priority.selected;
        },
      },
    };

    scope.actionSettings.report.priority = scope.actionSettings.report.priority || scope.action.priority.selected;

    scope.removeAction = function () {
      $rootScope.$broadcast('action:removeAction', { name: scope.actionName });
    };

    scope.applyReportType = function (name) {
      scope.watcher._source.actions[scope.actionName].report.snapshot.type = name;
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

export default reportAction;
