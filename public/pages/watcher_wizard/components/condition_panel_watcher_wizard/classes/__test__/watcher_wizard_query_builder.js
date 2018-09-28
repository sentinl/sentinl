const WatcherWizardQueryBuilder = require('./watcher_wizard_query_builder');

function prettify(o) {
  return JSON.stringify(o, null, 2);
}

const qb = new WatcherWizardQueryBuilder({});

let query;

query = qb.count({
  field: 'random',
  over: {
    type: 'all docs'
  },
});

query = qb.count({
  over: {
    type: 'top',
    field: 'animal',
    n: 3,
  },
});

query = qb.average({
  field: 'random',
  over: {
    type: 'all docs'
  },
});

query = qb.average({
  field: 'random',
  over: {
    type: 'top',
    field: 'animal',
    n: 3,
  },
});

query = qb.sum({
  field: 'random',
});

query = qb.sum({
  field: 'random',
  over: {
    type: 'top',
    field: 'animal',
    n: 3,
  },
});

query = qb.min({
  field: 'random',
});

query = qb.min({
  field: 'random',
  over: {
    type: 'top',
    field: 'animal',
    n: 3,
  },
});

query = qb.max({
  field: 'random',
});

query = qb.max({
  field: 'random',
  over: {
    type: 'top',
    field: 'animal',
    n: 3,
  },
});

console.log('res:', prettify(query));
