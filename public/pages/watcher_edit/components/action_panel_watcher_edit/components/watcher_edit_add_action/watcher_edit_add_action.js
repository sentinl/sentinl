import template from './watcher_edit_add_action.html';

class Actions {
  static types = ['email'];
  static email() {
    const name = 'An action';
    const settings = {
      throttle_period: '1s',
      email: {
        priority: 'low',
      },
    };
    return {name, settings};
  }
}

class WatcherEditAddAction {
  constructor() {
    this.status = {
      isOpen: false,
    };
  }

  $onInit() {
    this.actions = Actions.types;
  }

  addAction(actionType) {
    const {name, settings} = Actions.email();
    this.onAdd({actionName: name, actionSettings: settings});
  }
}

function watcherEditAddAction() {
  return {
    template,
    restrict: 'E',
    scope: {
      onAdd: '&',
    },
    controller:  WatcherEditAddAction,
    controllerAs: 'watcherEditAddAction',
    bindToController: true,
  };
}

export default watcherEditAddAction;
