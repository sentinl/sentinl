import template from './action_panel_watcher_edit.html';
import { cloneDeep } from 'lodash';

class ActionPanelWatcherEdit {
  constructor($scope) {
    this.$scope = $scope;
    this.watcher = this.watcher || this.$scope.watcher;
    this.onAdd = this.onAdd || this.$scope.onAdd;
    this.onDelete = this.onDelete || this.$scope.onDelete;

    this.status = {
      closeOthers: true,
    };
  }

  isAction(action, type) {
    return action[type] ? true : false;
  }
}

function actionPanelWatcherEdit() {
  return {
    template,
    restrict: 'E',
    scope: {
      watcher: '=',
      onAdd: '&',
      onDelete: '&',
    },
    controller:  ActionPanelWatcherEdit,
    controllerAs: 'actionPanelWatcherEdit',
    bindToController: {
      watcher: '=',
      onAdd: '&',
      onDelete: '&',
    },
  };
}

export default actionPanelWatcherEdit;
