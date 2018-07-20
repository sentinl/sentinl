import template from './impersonation_panel_watcher_wizard.html';
import { cloneDeep } from 'lodash';

class ImpersonationPanelWatcherWizard {
  constructor($scope) {
    this.$scope = $scope;
    this.userName = this.userName || this.$scope.userName;
    this.passWord = this.passWord || this.$scope.passWord;
  }
}

function impersonationPanelWatcherWizard() {
  return {
    template,
    restrict: 'E',
    scope: {
      userName: '=',
      passWord: '=',
    },
    controller:  ImpersonationPanelWatcherWizard,
    controllerAs: 'impersonationPanelWatcherWizard',
    bindToController: {
      userName: '=',
      passWord: '=',
    },
  };
}

export default impersonationPanelWatcherWizard;
