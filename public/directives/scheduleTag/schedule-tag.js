import uiModules from 'ui/modules';
import scheduleTagTemplate from './schedule-tag.html';

uiModules
.get('api/sentinl', [])
.directive('scheduleTag', function () {

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
