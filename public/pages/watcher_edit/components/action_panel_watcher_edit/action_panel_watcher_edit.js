import template from './action_panel_watcher_edit.html';

class ActionPanelWatcherEdit {
  constructor() {
    this.status = {
      closeOthers: true,
    };
    this.actions = {
      email: {},
    };
    this.actionsList = Object.keys(this.actions);
  }

  isAction(action, type) {
    return action[type] ? true : false;
  }

  actionDelete({origActionName}) {
    delete this.watcher._source.actions[origActionName];
  }

  actionPersist({origActionName, newActionName, actionSettings}) {
    if (origActionName === newActionName) {
      this.actionPersistSameName({origActionName, actionSettings});
    } else {
      this.watcher._source.actions[newActionName] = actionSettings;
      delete this.watcher._source.actions[origActionName];
    }
  }

  actionPersistSameName({origActionName, actionSettings}) {
    this.watcher._source.actions[origActionName] = actionSettings;
  }
}

function actionPanelWatcherEdit() {
  return {
    template,
    restrict: 'E',
    scope: {
      watcher: '=watcher',
    },
    controller:  ActionPanelWatcherEdit,
    controllerAs: 'actionPanelWatcherEdit',
    bindToController: true,
  };
}

export default actionPanelWatcherEdit;
