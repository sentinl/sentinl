import watcherReportAction from './report-action.html';
import { app } from '../../app.module';
import help from '../../messages/help';

app.directive('reportAction', function ($rootScope) {
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

  }

  return {
    restrict: 'E',
    template: watcherReportAction,
    scope: true,
    link: actionDirective
  };
});
