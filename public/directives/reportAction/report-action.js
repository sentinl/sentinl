import watcherReportAction from './report-action.html';
import { app } from '../../app.module';

app.directive('reportAction', function () {
  function actionDirective(scope, element, attrs) {
    scope.action = {
      type: 'report',
      resolutionPattern: '^\\d{1,4}x\\d{1,4}$',
      status: {
        isHeaderOpen: false
      }
    };
  }

  return {
    restrict: 'E',
    template: watcherReportAction,
    scope: true,
    link: actionDirective
  };
});
