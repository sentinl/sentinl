import {get} from 'lodash';

class WizardHelper {
  constructor() {}

  isScheduleModeEvery(scheduleString) {
    return !!scheduleString.match(/every\s(\d+)\s(seconds|minutes|hours|days|months|years)/);
  }

  isSpyWatcher(watcher) {
    return get(watcher, '_source.spy') || watcher.spy;
  }

  isWizardWatcher(watcher) {
    return get(watcher, '_source.wizard.chart_query_params');
  }
}

export default WizardHelper;
