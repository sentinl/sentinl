import uiModules from 'ui/modules';
import watcherEmailHtmlAction from './emailHtml-action.html';

uiModules
.get('api/sentinl', [])
.directive('emailHtmlAction', function () {
  function actionDirective(scope, element, attrs) {
    scope.action = {
      type: 'email HTML'
    };
  }

  return {
    restrict: 'E',
    template: watcherEmailHtmlAction,
    scope: true,
    link: actionDirective
  };
});
