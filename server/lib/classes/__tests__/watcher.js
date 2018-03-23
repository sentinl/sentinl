import { isEqual, cloneDeep } from 'lodash';
import Promise from 'bluebird';
import expect from 'expect.js';
import Watcher from '../watcher';
import sinon from 'sinon';

describe('Watcher', function () {
  let task;
  let watcher;
  let payload;

  const init = function () {
    const server = {
      log: () => console.log,
      plugins: {}
    };
    const config = {
      es: {
        watcher_type: 'sentinl-watcher',
      },
      settings: {
        authentication: {}
      },
    };
    const client = {};

    watcher = new Watcher(server, client, config);

    watcher.config = config;

    task = {
      _index: 'watcher',
      _type: 'sentinl-watcher',
      _id: 'xqxmhjhxihq-hlqnczowo0o-rgxipimxd',
      _score: 1,
      _source: {
        title: 'CC',
        disable: false,
        report: false,
        trigger: {
          schedule: {
            later: 'every 1 mins'
          }
        },
        input: {
          search: {
            request: {
              index: [
                'credit_card'
              ],
              body: {
                size: 3,
                query: {
                  bool: {
                    must: [
                      {
                        exists: {
                          field: 'Amount'
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        },
        condition: {
          script: {
            script: 'payload.hits.total > 0'
          }
        },
        transform: {
          chain: [
            {
              search: {
                request: {
                  index: [
                    'credit_card'
                  ],
                  body: {
                    size: 3,
                    query: {
                      bool: {
                        must: [
                          {
                            match: {
                              Class: 1
                            }
                          }
                        ]
                      }
                    }
                  }
                }
              }
            },
            {
              script: {
                script: 'payload.double_total = payload.hits.total*2'
              }
            }
          ]
        },
        actions: {
          email_admin: {
            throttle_period: '0h0m1s',
            email: {
              to: 'sergibondarenko@icloud.com',
              from: 'trex@beast-cave',
              subject: 'CC Alarm',
              priority: 'high',
              body: 'Found {{payload.hits.total}} Events'
            }
          }
        }
      }
    };

    payload = {
      took: 7,
      timed_out: false,
      _shards: {
        total: 5,
        successful: 5,
        failed: 0
      },
      hits: {
        total: 285133,
        max_score: 1,
        hits: [
          {
            _index: 'credit_card',
            _type: 'logs',
            _id: 'AV5cXlFRNCPGx4ALQkrp',
            _score: 1,
            _source: {
              Time: 5867,
              Amount: 220.89,
              '@timestamp': '2017-09-07T12:43:58.543Z',
              Class: 0
            }
          },
          {
            _index: 'credit_card',
            _type: 'logs',
            _id: 'AV5cXlFRNCPGx4ALQkrw',
            _score: 1,
            _source: {
              Time: 5883,
              Amount: 14.95,
              '@timestamp': '2017-09-07T12:43:58.543Z',
              Class: 1
            }
          },
          {
            _index: 'credit_card',
            _type: 'logs',
            _id: 'AV5cXlFRNCPGx4ALQkr4',
            _score: 1,
            _source: {
              Time: 5908,
              Amount: 6.45,
              '@timestamp': '2017-09-07T12:43:58.544Z',
              Class: 1
            }
          }
        ]
      }
    };

    sinon.stub(watcher, 'search', function () {
      return Promise.resolve(payload);
    });

    sinon.stub(watcher, 'doActions', function () {
      return Promise.resolve(task._id);
    });

  };

  beforeEach(function () {
    init();
  });

  it('execute with condition script evaluated to false', function (done) {
    const localTask = cloneDeep(task);
    localTask._source.condition.script.script = 'payload.hits.total > 999999';

    watcher.execute(localTask).then(function (response) {
      expect(response.task.id).to.eql(task._id);
      expect(response.message).to.eql(`no data was found that meets the used 'script 'conditions, ${task._id}`);
      done();
    }).catch(done);
  });

  it('execute with no transform', function (done) {
    const localTask = cloneDeep(task);
    delete localTask._source.transform;

    watcher.execute(localTask).then(function (response) {
      expect(response.task.id).to.eql(task._id);
      expect(response.message).to.be(undefined);
      done();
    }).catch(done);
  });

  it('execute transform chain', function (done) {
    watcher.execute(task).then(function (response) {
      expect(response.task.id).to.eql(task._id);
      expect(response.message).to.be(undefined);
      done();
    }).catch(done);
  });
});
