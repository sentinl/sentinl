import { isEqual, cloneDeep } from 'lodash';
import Promise from 'bluebird';
import expect from 'expect.js';
import WatcherHandler from '../watcher_handler';
import sinon from 'sinon';

const watcher = {
  _index: 'watcher',
  id: 'xqxmhjhxihq-hlqnczowo0o-rgxipimxd',
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
};

const payload = {
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

describe('WatcherHandler', function () {
  let watcherHandler;

  const init = function () {
    const config = {
      es: {
        watcher_type: 'sentinl-watcher',
      },
      settings: {
        authentication: {}
      },
    };
    const server = {
      log: () => console.log,
      plugins: {
        elasticsearch: {
          getCluster: () => ({
            getClient: () => ({
              index: () => void 0
            })
          })
        },
      },
      config: () => ({
        get: property => property === 'sentinl' ? config : []
      }),
    };
    const client = {};

    watcherHandler = new WatcherHandler(server);

    sinon.stub(watcherHandler._client, 'search', function () {
      return Promise.resolve(payload);
    });

    sinon.stub(watcherHandler._client, 'logAlarm', function () {
      return Promise.resolve({
        type: 'sentinl-alarm',
        id: 'SVq_IGYBYC6mQ4XVT2HW',
        version: 1,
        attributes: {}
      });
    });

    sinon.stub(watcherHandler, 'doActions', function () {
      return Promise.resolve(watcher._id);
    });
  };

  beforeEach(function () {
    init();
  });

  it('transform chain', function (done) {
    const _watcher = cloneDeep(watcher);
    watcherHandler.execute(_watcher).then(function (resp) {
      expect(resp.ok).to.be(true);
      expect(resp.success).to.be(true);
      expect(resp.warning).to.be(undefined);
      done();
    }).catch(done);
  });

  it('transform "script", JavaScript error', function (done) {
    const _watcher = cloneDeep(watcher);
    _watcher.transform.chain[1].script.script = 'testerrorhere++';
    watcherHandler.execute(_watcher).catch(function (err) {
      expect(err.message.includes('testerrorhere is not defined')).to.be(true);
      done();
    });
  });

  it('no transform', function (done) {
    const _watcher = cloneDeep(watcher);
    delete _watcher.transform;
    watcherHandler.execute(_watcher).then(function (resp) {
      expect(resp.ok).to.be(true);
      expect(resp.success).to.be(true);
      expect(resp.warning).to.be(undefined);
      done();
    }).catch(done);
  });

  it('condition "script", no data to match the condition', function (done) {
    const _watcher = cloneDeep(watcher);
    _watcher.condition.script.script = 'payload.hits.total > 999999';
    watcherHandler.execute(_watcher).then(function (resp) {
      expect(resp.ok).to.be(true);
      expect(resp.warning).to.be(true);
      expect(resp.message.includes('no data satisfy "script" condition')).to.be(true);
      done();
    }).catch(done);
  });

  it('condition "script", JavaScript error', function (done) {
    const _watcher = cloneDeep(watcher);
    _watcher.condition.script.script = 'testerrorhere++';
    watcherHandler.execute(_watcher).catch(function (err) {
      expect(err.message.includes('testerrorhere is not defined')).to.be(true);
      done();
    });
  });
});
