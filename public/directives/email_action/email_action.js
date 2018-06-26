import template from './email_action.html';
import help from '../../messages/help';

class EmailAction {
  constructor($scope, $rootScope) {
    'ngInject';
    this.$scope = $scope;
    this.actionName = this.actionName || this.$scope.actionName;
    this.actionSettings = this.actionSettings || this.$scope.actionSettings;
    this.actionPriorities = this.actionPriorities || this.$scope.actionPriorities;
    this.aceOptions = this.aceOptions || this.$scope.aceOptions;

    this.$rootScope = $rootScope;
    this.help = help;
    this.type = 'email';
    this.isOpen = true;
    this.actionSettings.email.priority = this.actionSettings.email.priority || 'low';
  }

  remove() {
    this.$rootScope.$broadcast('action:removeAction', { name: this.actionName });
  }
}

function emailAction() {
  function link() {}

  return {
    restrict: 'E',
    template,
    link,
    controller: EmailAction,
    controllerAs: 'emailAction',
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

export default emailAction;
