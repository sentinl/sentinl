import template from './watcher_wizard_report_action.html';

import {cloneDeep} from 'lodash';

class WatcherWizardReportAction {
  constructor($scope) {
    this.$scope = $scope;
    this.actionName = this.actionName || this.$scope.actionName;
    this.actionSettings = this.actionSettings || this.$scope.actionSettings;
    this.actionDelete = this.actionDelete || this.$scope.actionDelete;
    this.aceOptions = this.aceOptions || this.$scope.aceOptions;

    this.type = 'report';
    this.status = {
      isOpen: false,
    };
    this.actionSettings.name = this.actionName;
    this.priority = {
      selected: this.actionSettings.report.priority || 'low',
      options: ['low', 'medium', 'high'],
      handleChange: () => {
        this.actionSettings.report.priority = this.priority.selected;
      },
    };
    this.resolutionPattern = '^\\d{1,4}x\\d{1,4}$';
    this.authModes = ['basic', 'customselector', 'xpack', 'searchguard'];
  }

  deleteAction() {
    this.actionDelete({origActionName: this.actionName});
  }
}

function watcherWizardReportAction() {
  return {
    template,
    restrict: 'E',
    scope: {
      actionName: '@',
      actionSettings: '=',
      actionDelete: '&',
      aceOptions: '&',
    },
    controller:  WatcherWizardReportAction,
    controllerAs: 'watcherWizardReportAction',
    bindToController: {
      actionName: '@',
      actionSettings: '=',
      actionDelete: '&',
      aceOptions: '&',
    },
  };
}

export default watcherWizardReportAction;
