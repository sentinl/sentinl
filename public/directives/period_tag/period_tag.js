import template from './period_tag.html';

function periodTag() {
  'ngInject';

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
    template,
    scope: {
      timesrc: '='
    },
    link: actionDirective
  };
};

export default periodTag;
