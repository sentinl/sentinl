import template from './watcher_wizard_email_html_action.html';
import priorities from '../../action_priorities';
import {capitalize} from 'lodash';

class WatcherWizardEmailHtmlAction {
  constructor($scope, $sce, wizardHelper) {
    this.$scope = $scope;
    this.wizardHelper = wizardHelper;
    this.actionId = this.actionId || this.$scope.actionId;
    this.watcher = this.watcher || this.$scope.watcher;
    this.actionSettings = this.actionSettings || this.$scope.actionSettings;
    this.actionPropertyNormalization = this.actionPropertyNormalization || this.$scope.actionPropertyNormalization;
    this.actionDelete = this.actionDelete || this.$scope.actionDelete;
    this.aceOptions = this.aceOptions || this.$scope.aceOptions;

    this.type = 'email_html';
    this.status = {
      isOpen: false,
    };
    this.priority = {
      selected: this.actionSettings.email_html.priority,
      options: priorities,
      handleChange: () => {
        this.actionSettings.email_html.priority = this.priority.selected;
      },
    };
  }

  getTagId(name = 'action') {
    name = name === 'action' ? 'watcherWizardEmailHtmlAction' : ('watcherWizardEmailHtmlAction' + capitalize(name));
    return this.wizardHelper.getUniqueTagId(name, this.actionId);
  }

  deleteAction() {
    this.actionDelete({actionId: this.actionId});
  }
}

function watcherWizardEmailHtmlAction() {
  return {
    template,
    restrict: 'E',
    scope: {
      actionId: '@',
      watcher: '=',
      actionSettings: '=',
      actionPropertyNormalization: '&',
      actionDelete: '&',
      aceOptions: '&',
    },
    controller: WatcherWizardEmailHtmlAction,
    controllerAs: 'watcherWizardEmailHtmlAction',
    bindToController: {
      actionId: '@',
      watcher: '=',
      actionSettings: '=',
      actionPropertyNormalization: '&',
      actionDelete: '&',
      aceOptions: '&',
    },
  };
}

export default watcherWizardEmailHtmlAction;
