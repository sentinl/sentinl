import watcherSlackAction from './slack-action.html';
import { app } from '../../app.module';
import help from '../../messages/help';

app.directive('slackAction', function ($rootScope) {
  function actionDirective(scope, element, attrs) {
    scope.help = help;
    scope.action = {
      type: 'slack',
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
    template: watcherSlackAction,
    scope: true,
    link: actionDirective
  };
});
