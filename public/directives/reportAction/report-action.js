import uiModules from 'ui/modules';
import watcherReportAction from './report-action.html';


uiModules
.get('api/sentinl', [])
.directive('reportAction', function () {
  function actionDirective(scope, element, attrs) {
    scope.action = {
      type: 'report',
      resolutionPattern: '^\\d{1,4}x\\d{1,4}$'
    };
  }

  return {
    restrict: 'E',
    template: watcherReportAction,
    scope: true,
    link: actionDirective
  };
});
