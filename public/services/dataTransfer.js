import { app } from '../app.module';

class DataTransfer {

  constructor() {
    this.watcher;
    this.templates;
  }

  getWatcher() {
    return this.watcher;
  }

  setWatcher(_watcher_) {
    this.watcher = _watcher_;
  }

  setTemplates(_templates_) {
    this.templates = _templates_;
  }

  getTemplates() {
    return this.templates;
  }

};

app.factory('dataTransfer', () => new DataTransfer());
