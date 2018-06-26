import template from './email_html_action.html';
import help from '../../messages/help';

class EmailHtmlAction {
  constructor($scope, $rootScope) {
    'ngInject';
    this.$scope = $scope;
    this.actionName = this.actionName || this.$scope.actionName;
    this.actionSettings = this.actionSettings || this.$scope.actionSettings;
    this.actionPriorities = this.actionPriorities || this.$scope.actionPriorities;
    this.aceOptions = this.aceOptions || this.$scope.aceOptions;

    this.$rootScope = $rootScope;
    this.help = help;
    this.type = 'email HTML';
    this.isOpen = true;
    this.actionSettings.email_html.priority = this.actionSettings.email_html.priority || 'low';
  }

  remove() {
    this.$rootScope.$broadcast('action:removeAction', { name: this.actionName });
  }
}

function emailHtmlAction() {
  function link() {}

  return {
    restrict: 'E',
    template,
    link,
    controller: EmailHtmlAction,
    controllerAs: 'emailHtmlAction',
    bindToController: {
      actionName: '@',
      actionSettings: '=',
      actionPriorities: '=',
      aceOptions: '&',
    },
    scope: {
      actionName: '@',
      actionSettings: '=',
      actionPriorities: '=',
      aceOptions: '&',
    },
  };
};

export default emailHtmlAction;
