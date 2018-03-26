import template from './condition_panel_watcher_edit.html';

class ConditionPanelWatcherEdit {
  constructor() {
  }
}

function conditionPanelWatcherEdit() {
  return {
    template,
    restrict: 'E',
    scope: {
      watcher: '=watcher',
    },
    controller:  ConditionPanelWatcherEdit,
    controllerAs: 'conditionPanelWatcherEdit',
    bindToController: true,
  };
}

export default conditionPanelWatcherEdit;
