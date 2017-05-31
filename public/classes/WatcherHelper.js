import _ from 'lodash';

class WatcherHelper {

  // count number of actions of a certain type
  numOfActionTypes(watcher, type) {
    return _.filter(watcher._source.actions, (a) => a[type]).length;
  }

}

export { WatcherHelper as default };
