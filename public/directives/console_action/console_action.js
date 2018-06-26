import template from './console_action.html';
import help from '../../messages/help';

class ConsoleAction {
  constructor($scope, $rootScope) {
    'ngInject';
    this.$scope = $scope;
    this.actionName = this.actionName || this.$scope.actionName;
    this.actionSettings = this.actionSettings || this.$scope.actionSettings;
    this.actionPriorities = this.actionPriorities || this.$scope.actionPriorities;
    this.aceOptions = this.aceOptions || this.$scope.aceOptions;

    this.$rootScope = $rootScope;
    this.help = help;
    this.type = 'console';
    this.isOpen = true;
    this.actionSettings.console.priority = this.actionSettings.console.priority || 'low';
  }

  remove() {
    this.$rootScope.$broadcast('action:removeAction', { name: this.actionName });
  }
}

function consoleAction() {
  function link() {}

  return {
    restrict: 'E',
    template,
    link,
    controller: ConsoleAction,
    controllerAs: 'consoleAction',
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

export default consoleAction;
