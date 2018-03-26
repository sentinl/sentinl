import template from './action_panel_watcher_edit.html';

class ActionPanelWatcherEdit {
  constructor() {
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
