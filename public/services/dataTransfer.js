import { app } from '../app.module';

app.factory('dataTransfer', [function () {

  let watcher;

  const dataTransfer = {
    getWatcher: function () {
      return watcher;
    },
    setWatcher: function (newWatcher) {
      watcher = newWatcher;
    }
  };

  return dataTransfer;

}]);
