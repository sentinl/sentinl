import template from './watcher_edit_add_index.html';

class WatcherEditAddIndex {
  constructor(esService, createNotifier, sentinlLog) {
    this.locationName = 'WatcherEditAddIndex';
    this.notify = createNotifier({
      location: this.locationName,
    });
    this.log = sentinlLog;
    this.log.initLocation(this.locationName);
    this.esService = esService;
  }

  $onInit() {
    this.selected = this._getIndex();
  }

  _getIndex() {
    if (Array.isArray(this.watcher._source.input.search.request.index)) {
      return this.watcher._source.input.search.request.index.join(',');
    }
    return this.watcher._source.input.search.request.index;
  }

  _setIndex(index) {
    index = !index ? [] : index.split(',');
    this.watcher._source.input.search.request.index = index;
  }

  async getIndexNames(name) {
    try {
      let indexes = await this.esService.getAllIndexes();
      return this._filterIndexesByNamePrefix(indexes, this.selected);
    } catch (err) {
      this.notify(err.message);
      this.log.error(err.message);
    }
  }

  _filterIndexesByNamePrefix(indexes, namePrefix) {
    const re = new RegExp(namePrefix + '.*', 'gi');
    return indexes.filter((i) => i.index.match(re));
  }

  handleChange() {
    this._setIndex(this.selected);
  }
}

function watcherEditAddIndex() {
  return {
    template,
    restrict: 'E',
    scope: {
      watcher: '<',
    },
    controller:  WatcherEditAddIndex,
    controllerAs: 'watcherEditAddIndex',
    bindToController: true,
  };
}

export default watcherEditAddIndex;
