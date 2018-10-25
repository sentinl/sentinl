import { cloneDeep } from 'lodash';
import SentinlApi from '../sentinl_api';
import { SentinlError } from '../';

class WatcherService extends SentinlApi {
  constructor($http, $injector, Promise) {
    super('watcher', $http, $injector);
    this.docType = 'watcher';
    this.Promise = Promise;
    this.REPORTWATCHER = $injector.get('REPORTWATCHER');
    this.EMAILWATCHERADVANCED = $injector.get('EMAILWATCHERADVANCED');
    this.EMAILWATCHERWIZARD = $injector.get('EMAILWATCHERWIZARD');
  }

  new(type) {
    try {
      let defaults;
      switch (type) {
        case 'report':
          defaults = cloneDeep(this.REPORTWATCHER);
          break;
        case 'advanced':
          defaults = cloneDeep(this.EMAILWATCHERADVANCED);
          break;
        default:
          defaults = cloneDeep(this.EMAILWATCHERWIZARD);
      }
      return this.Promise.resolve(defaults);
    } catch (err) {
      throw new SentinlError('create watcher', err);
    }
  }
}

export default WatcherService;
