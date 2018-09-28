import { stripObjectPropertiesByNameRegex } from '../../lib/sentinl_helper';
import { get, pick, omit } from 'lodash';

const WATCHER_SRC_FIELDS = [
  'actions', 'input', 'condition', 'transform', 'trigger', 'disable', 'report', 'title', 'wizard',
  'save_payload', 'spy', 'impersonate', 'username', 'password', 'dashboard_link', 'custom'
];

class SentinlHelper {
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
}

export default SentinlHelper;
