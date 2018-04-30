import template from './watcher_edit_add_action.html';

class Actions {
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
    this.actions = this.addActionList;
  }

  addAction(actionType) {
    if (actionType === 'email') {
      const {name, settings} = Actions.email();
      this.persistAction(name, settings);
    }
  }

  persistAction(origActionName, actionSettings) {
    this.addActionPersist({origActionName, actionSettings});
  }
}

function watcherEditAddAction() {
  return {
    template,
    restrict: 'E',
    scope: {
      addActionList: '<',
      addActionPersist: '&',
    },
    controller:  WatcherEditAddAction,
    controllerAs: 'watcherEditAddAction',
    bindToController: true,
  };
}

export default watcherEditAddAction;
