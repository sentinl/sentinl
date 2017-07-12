import periodTagTemplate from './period-tag.html';
import { app } from '../../app.module';

app.directive('periodTag', function () {

  function actionDirective(scope, element, attrs) {
    scope.action = {
      time: {
        max: 999,
        min: 0
      }
    };
  };

  return {
    restrict: 'E',
    template: periodTagTemplate,
    scope: {
      timesrc: '='
    },
    link: actionDirective
  };
});
