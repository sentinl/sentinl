import './condition_panel_watcher_edit.less';
import template from './condition_panel_watcher_edit.html';

class ConditionPanelWatcherEdit {
  constructor() {
    this.condition = {
      type: {
        handleSelect: function (type) {
          console.log(type);
        },
      },
      over: {
        handleSelect: function (field) {
          console.log(field);
        },
      },
      threshold: {
        handleSelect: function (above) {
          console.log(above);
        },
      },
      time: {
        handleSelect: function (time) {
          console.log(time);
        },
      },
    };
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
