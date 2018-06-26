import template from './report_action.html';
import help from '../../messages/help';

class ReportAction {
  constructor($scope, $rootScope) {
    'ngInject';
    this.$scope = $scope;
    this.actionName = this.actionName || this.$scope.actionName;
    this.actionSettings = this.actionSettings || this.$scope.actionSettings;
    this.actionPriorities = this.actionPriorities || this.$scope.actionPriorities;
    this.aceOptions = this.aceOptions || this.$scope.aceOptions;

    this.$rootScope = $rootScope;
    this.help = help;
    this.type = 'report';
    this.isOpen = true;
    this.isTypeOpen = false;
    this.resolutionPattern = '^\\d{1,4}x\\d{1,4}$';
    this.actionSettings.report.priority = this.actionSettings.report.priority || 'low';
  }

  remove() {
    this.$rootScope.$broadcast('action:removeAction', { name: this.actionName });
  }

  applyReportType(name) {
    this.actionSettings.report.snapshot.type = name;
  }
}

function reportAction() {
  function link() {}

  return {
    restrict: 'E',
    template,
    link,
    controller: ReportAction,
    controllerAs: 'reportAction',
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

export default reportAction;
