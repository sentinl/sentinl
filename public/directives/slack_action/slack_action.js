import template from './slack_action.html';
import help from '../../messages/help';

class SlackAction {
  constructor($scope, $rootScope) {
    'ngInject';
    this.$scope = $scope;
    this.actionName = this.actionName || this.$scope.actionName;
    this.actionSettings = this.actionSettings || this.$scope.actionSettings;
    this.actionPriorities = this.actionPriorities || this.$scope.actionPriorities;
    this.aceOptions = this.aceOptions || this.$scope.aceOptions;

    this.$rootScope = $rootScope;
    this.help = help;
    this.type = 'slack';
    this.isOpen = true;
    this.actionSettings.slack.priority = this.actionSettings.slack.priority || 'low';
  }

  remove() {
    this.$rootScope.$broadcast('action:removeAction', { name: this.actionName });
  }
}

function slackAction() {
  function link() {}

  return {
    restrict: 'E',
    template,
    link,
    controller: SlackAction,
    controllerAs: 'slackAction',
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

export default slackAction;
