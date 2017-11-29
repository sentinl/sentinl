import periodTagTemplate from './period-tag.html';

const periodTag = function () {

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
};

periodTag.$inject = [];
export default periodTag;
