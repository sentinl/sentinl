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
        isHeaderOpen: false
      }
    };

    scope.removeAction = function () {
      $rootScope.$broadcast('action:removeAction', { name: attrs.name });
    };

    scope.applyReportType = function (name) {
      scope.watcher._source.actions[attrs.name].report.snapshot.type = name;
    };

  }

  return {
    restrict: 'E',
    template,
    scope: true,
    link: actionDirective
  };
};

export default reportAction;
