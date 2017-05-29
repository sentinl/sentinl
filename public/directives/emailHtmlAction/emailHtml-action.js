import watcherEmailHtmlAction from './emailHtml-action.html';
import { app } from '../../app.module';

app.directive('emailHtmlAction', function () {
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
