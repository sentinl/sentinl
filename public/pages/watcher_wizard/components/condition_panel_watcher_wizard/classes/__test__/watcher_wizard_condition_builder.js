const WatcherWizardConditionBuilder = require('../watcher_wizard_condition_builder');

function prettify(o) {
  return JSON.stringify(o, null, 2);
}

const cb = new WatcherWizardConditionBuilder({});

let con;

con = cb.count({
  over: {
    type: 'all docs',
  },
  threshold: {
    n: 0,
    direction: 'above',
  },
});

con = cb.count({
  over: {
    type: 'top',
  },
  threshold: {
    n: 0,
    direction: 'above',
  },
});

con = cb.average({
  over: {
    type: 'all docs',
  },
  threshold: {
    n: 0,
    direction: 'above',
  },
});

con = cb.average({
  over: {
    type: 'top',
  },
  threshold: {
    n: 0,
    direction: 'above',
  },
});

console.log('res:', prettify(con));
