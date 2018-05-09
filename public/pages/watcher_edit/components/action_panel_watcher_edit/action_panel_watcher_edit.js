import template from './action_panel_watcher_edit.html';
import { cloneDeep } from 'lodash';

class ActionPanelWatcherEdit {
  constructor() {
    this.status = {
      closeOthers: true,
    };
    this.actions = {
      email: {},
    };
    this.action = {
      trigger: {
        save: () => {},
      }
    };
    this.actionsList = Object.keys(this.actions);
  }

  $onInit() {
    this._watcher = cloneDeep(this.watcher);
    this.onTrigger.save = () => {
      this.action.trigger.save();
    };
  }

  isAction(action, type) {
    return action[type] ? true : false;
  }

  actionDelete({origActionName}) {
    delete this._watcher._source.actions[origActionName];
    this.onChange({actions: this._watcher._source.actions});
  }

  actionPersist({origActionName, newActionName, actionSettings}) {
    if (origActionName === newActionName) {
      this.actionPersistSameName({origActionName, actionSettings});
    } else {
      this._watcher._source.actions[newActionName] = actionSettings;
      delete this._watcher._source.actions[origActionName];
    }
    this.onChange({actions: this._watcher._source.actions});
  }

  actionPersistSameName({origActionName, actionSettings}) {
    this._watcher._source.actions[origActionName] = actionSettings;
  }
}

function actionPanelWatcherEdit() {
  return {
    template,
    restrict: 'E',
    scope: {
      watcher: '<',
      onChange: '&',
      onTrigger: '=',
    },
    controller:  ActionPanelWatcherEdit,
    controllerAs: 'actionPanelWatcherEdit',
    bindToController: true,
  };
}

export default actionPanelWatcherEdit;
