import template from './threshold_watcher_edit.html';

class ThresholdWatcherEdit {
  constructor() {}
}

function thresholdWatcherEdit() {
  return {
    template,
    restrict: 'E',
    scope: {
      watcher: '=watcher',
    },
    controller: ThresholdWatcherEdit,
    controllerAs: 'thresholdWatcherEdit',
    bindToController: true,
  };
}

export default thresholdWatcherEdit;
