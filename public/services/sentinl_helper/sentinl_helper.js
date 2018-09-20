import { isObject, stripObjectPropertiesByNameRegex } from '../../lib/sentinl_helper';
import { get, pick, omit, cloneDeep } from 'lodash';

const WATCHER_SRC_FIELDS = [
  'actions', 'input', 'condition', 'transform', 'trigger', 'disable', 'report', 'title', 'wizard',
  'save_payload', 'spy', 'impersonate', 'username', 'password', 'dashboard_link', 'custom'
];

class SentinlHelper {
  constructor($injector) {
    this.EMAILWATCHERADVANCED = $injector.get('EMAILWATCHERADVANCED');
    this.EMAILWATCHERWIZARD = $injector.get('EMAILWATCHERWIZARD');
    this.REPORTWATCHER = $injector.get('REPORTWATCHER');
  }

  stripObjectPropertiesByNameRegex(obj, nameRegexp) {
    stripObjectPropertiesByNameRegex(obj, nameRegexp);
  }

  pickWatcherSource(watcher, fields = WATCHER_SRC_FIELDS) {
    return pick(watcher, fields);
  }

  omitWatcherSource(watcher, fields = WATCHER_SRC_FIELDS) {
    return omit(watcher, fields);
  }

  apiErrMsg(err, msg) {
    if (msg) {
      return msg + ': ' + (err.message || get(err, 'data.message') || get(err, 'data.error') || err.toString());
    }
    return err.message || get(err, 'data.message') || err.toString();
  }

  firstLetterToUpperCase(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /*
  * Create user id
  * Separate watcher object type name from its id
  * There is only one user per watcher
  */
  createUserId(watcherId, userType) {
    if (watcherId.includes(':')) {
      return watcherId.split(':').slice(-1)[0];
    }
    return watcherId;
  }

  getWatcherDefaults(type) {
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
    return defaults;
  }
}

export default SentinlHelper;
