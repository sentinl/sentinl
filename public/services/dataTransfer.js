import { app } from '../app.module';

class DataTransfer {

  constructor() {
    this.watcher;
    this.templates;
  }

  getWatcher() {
    return this.watcher;
  }

  setWatcher(watcher) {
    this.watcher = watcher;
  }

  setTemplates(templates) {
    this.templates = templates;
  }

  getTemplates() {
    return this.templates;
  }

};

app.factory('dataTransfer', () => new DataTransfer());
