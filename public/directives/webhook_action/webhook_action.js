/*global angular*/
import template from './webhook_action.html';
import help from '../../messages/help';

class WebhookAction {
  constructor($scope, $rootScope) {
    'ngInject';
    this.$scope = $scope;
    this.actionName = this.actionName || this.$scope.actionName;
    this.actionSettings = this.actionSettings || this.$scope.actionSettings;
    this.actionPriorities = this.actionPriorities || this.$scope.actionPriorities;
    this.aceOptions = this.aceOptions || this.$scope.aceOptions;

    this.$rootScope = $rootScope;
    this.help = help;
    this.type = 'webhook';
    this.isOpen = true;
    this.actionSettings.webhook.priority = this.actionSettings.webhook.priority || 'low';
    if (this.actionSettings.webhook.headers) {
      this.actionSettings.webhook._headers = angular.toJson(this.actionSettings.webhook.headers, 'pretty');
    }
  }

  remove() {
    this.$rootScope.$broadcast('action:removeAction', { name: this.actionName });
  }

  changeMethod(method) {
    this.actionSettings.webhook.method = method;
  }
}

function webhookAction() {
  function link() {}

  return {
    restrict: 'E',
    template,
    link,
    controller: WebhookAction,
    controllerAs: 'webhookAction',
    bindToController: true,
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

export default webhookAction;
