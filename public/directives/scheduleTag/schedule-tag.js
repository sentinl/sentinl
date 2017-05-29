import scheduleTagTemplate from './schedule-tag.html';
import { app } from '../../app.module';

app.directive('scheduleTag', function () {

  function actionDirective(scope, element, attrs) {
    scope.action = {
      pattern: {
        hours: '^[01]?\\d|2[0-3]$',
        minsAndSecs: '^[0-5]?\\d$'
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
