import { isObject, stripObjectPropertiesByNameRegex } from '../../lib/sentinl_helper';
import { get, pick, omit } from 'lodash';

const WATCHER_SRC_FIELDS = [
  'actions', 'input', 'condition', 'transform', 'trigger', 'disable', 'report', 'title', 'wizard',
  'save_payload', 'spy', 'impersonate', 'username', 'password', 'dashboard_link'
];

class SentinlHelper {
  constructor() {}

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
      return msg + ': ' + (err.message || get(err, 'data.message') || err.toString());
    }
    return err.message || get(err, 'data.message') || err.toString();
  }
}

export default SentinlHelper;
