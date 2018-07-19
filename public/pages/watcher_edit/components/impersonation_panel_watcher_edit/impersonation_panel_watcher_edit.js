import template from './impersonation_panel_watcher_edit.html';
import { cloneDeep } from 'lodash';

class ImpersonationPanelWatcherEdit {
  constructor($scope) {
    this.$scope = $scope;
    this.userName = this.userName || this.$scope.userName;
    this.passWord = this.passWord || this.$scope.passWord;
  }
}

function impersonationPanelWatcherEdit() {
  return {
    template,
    restrict: 'E',
    scope: {
      userName: '=',
      passWord: '=',
    },
    controller:  ImpersonationPanelWatcherEdit,
    controllerAs: 'impersonationPanelWatcherEdit',
    bindToController: {
      userName: '=',
      passWord: '=',
    },
  };
}

export default impersonationPanelWatcherEdit;
