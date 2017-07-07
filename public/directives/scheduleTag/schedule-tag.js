import scheduleTagTemplate from './schedule-tag.html';
import { app } from '../../app.module';

app.directive('scheduleTag', function () {

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
    template: scheduleTagTemplate,
    scope: {
      timesrc: '='
    },
    link: actionDirective
  };
});
