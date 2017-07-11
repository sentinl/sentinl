import watcherSlackAction from './slack-action.html';
import { app } from '../../app.module';

app.directive('slackAction', function () {
  function actionDirective(scope, element, attrs) {
    scope.action = {
      type: 'slack',
      status: {
        isHeaderOpen: false
      }
    };
  }

  return {
    restrict: 'E',
    template: watcherSlackAction,
    scope: true,
    link: actionDirective
  };
});
