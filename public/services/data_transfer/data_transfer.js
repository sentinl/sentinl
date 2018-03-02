/*global angular*/

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

}

export default DataTransfer;
