import template from './watcher_wizard_report_action.html';
import priorities from '../../action_priorities';
import {capitalize} from 'lodash';

class WatcherWizardReportAction {
  constructor($scope, wizardHelper) {
    this.$scope = $scope;
    this.wizardHelper = wizardHelper;
    this.actionId = this.actionId || this.$scope.actionId;
    this.actionSettings = this.actionSettings || this.$scope.actionSettings;
    this.actionDelete = this.actionDelete || this.$scope.actionDelete;
    this.aceOptions = this.aceOptions || this.$scope.aceOptions;

    this.type = 'report';
    this.status = {
      isOpen: false,
    };
    this.priority = {
      selected: this.actionSettings.report.priority || 'low',
      options: priorities,
      handleChange: () => {
        this.actionSettings.report.priority = this.priority.selected;
      },
    };
    this.resolutionPattern = '^\\d{1,4}x\\d{1,4}$';
    this.authModes = ['basic', 'customselector', 'xpack', 'searchguard'];
  }

  getTagId(name = 'action') {
    name = name === 'action' ? 'watcherWizardReportAction' : ('watcherWizardReportAction' + capitalize(name));
    return this.wizardHelper.getUniqueTagId(name, this.actionId);
  }

  deleteAction() {
    this.actionDelete({actionId: this.actionId});
  }
}

function watcherWizardReportAction() {
  return {
    template,
    restrict: 'E',
    scope: {
      actionId: '@',
      actionSettings: '=',
      actionDelete: '&',
      aceOptions: '&',
    },
    controller:  WatcherWizardReportAction,
    controllerAs: 'watcherWizardReportAction',
    bindToController: {
      actionId: '@',
      actionSettings: '=',
      actionDelete: '&',
      aceOptions: '&',
    },
  };
}

export default watcherWizardReportAction;
