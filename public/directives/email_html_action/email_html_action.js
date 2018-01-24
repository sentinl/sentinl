import template from './email_html_action.html';
import help from '../../messages/help';

function emailHtmlAction($rootScope) {
  'ngInject';

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
    template,
    scope: true,
    link: actionDirective
  };
};

export default emailHtmlAction;
