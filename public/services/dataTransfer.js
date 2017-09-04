import { app } from '../app.module';

app.factory('dataTransfer', [function () {

  let watcher;
  let templates;

  const dataTransfer = {
    getWatcher: function () {
      return watcher;
    },
    setWatcher: function (_watcher_) {
      watcher = _watcher_;
    },
    setTemplates: function (_templates_) {
      templates = _templates_;
    },
    getTemplates: function () {
      return templates;
    }
  };

  return dataTransfer;

}]);
