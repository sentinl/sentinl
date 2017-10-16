import watcherEmailHtmlAction from './emailHtml-action.html';
import { app } from '../../app.module';
import help from '../../messages/help';

app.directive('emailHtmlAction', function ($rootScope) {
  function actionDirective(scope, element, attrs) {
    scope.help = help;
    scope.action = {
      type: 'email HTML',
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
    template: watcherEmailHtmlAction,
    scope: true,
    link: actionDirective
  };
});
