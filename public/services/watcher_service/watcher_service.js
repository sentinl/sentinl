import { cloneDeep } from 'lodash';
import SentinlApi from '../sentinl_api';

class WatcherService extends SentinlApi {
  constructor($http, $injector, Promise) {
    super('watcher', $http, $injector);
    this.docType = 'watcher';
    this.Promise = Promise;
    this.helper = $injector.get('sentinlHelper');
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
      throw new Error(this.helper.apiErrMsg(err, `${this.docType} new`));
    }
  }
}

export default WatcherService;
