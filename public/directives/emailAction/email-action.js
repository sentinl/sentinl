import watcherEmailAction from './email-action.html';
import { app } from '../../app.module';

app.directive('emailAction', function ($rootScope) {
  function actionDirective(scope, element, attrs) {
    scope.action = {
      type: 'email',
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
    template: watcherEmailAction,
    scope: true,
    link: actionDirective
  };
});
