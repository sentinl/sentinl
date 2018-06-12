import template from './action_panel_watcher_edit.html';
import { cloneDeep } from 'lodash';

class ActionPanelWatcherEdit {
  constructor() {
    this.status = {
      closeOthers: true,
    };
  }

  $onInit() {
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
      watcher: '<',
      onAdd: '&',
      onDelete: '&',
    },
    controller:  ActionPanelWatcherEdit,
    controllerAs: 'actionPanelWatcherEdit',
    bindToController: true,
  };
}

export default actionPanelWatcherEdit;
