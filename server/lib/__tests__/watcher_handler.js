import { isEqual, cloneDeep } from 'lodash';
import Promise from 'bluebird';
import expect from 'expect.js';
import WatcherHandler from '../watcher_handler';
import sinon from 'sinon';

describe('WatcherHandler', function () {
  let watcher;
  let watcherHandler;
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

    watcherHandler = new WatcherHandler(server, client, config);

    watcher = {
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

    sinon.stub(watcherHandler, 'search', function () {
      return Promise.resolve(payload);
    });

    sinon.stub(watcherHandler, 'doActions', function () {
      return Promise.resolve(watcher._id);
    });
  };

  beforeEach(function () {
    init();
  });

  it('transform chain', function (done) {
    watcherHandler.execute(watcher).then(function (resp) {
      expect(resp.ok).to.be(true);
      expect(resp.success).to.be(true);
      expect(resp.warning).to.be(undefined);
      done();
    }).catch(done);
  });

  it('transform "script", JavaScript error', function (done) {
    watcher._source.transform.chain[1].script.script = 'testerrorhere++';
    watcherHandler.execute(watcher).catch(function (err) {
      expect(err.message).to.eql('fail to execute watcher: fail to apply transform "chain": ' +
        'fail to apply transform "script": testerrorhere is not defined');
      done();
    });
  });

  it('no transform', function (done) {
    delete watcher._source.transform;
    watcherHandler.execute(watcher).then(function (resp) {
      expect(resp.ok).to.be(true);
      expect(resp.success).to.be(true);
      expect(resp.warning).to.be(undefined);
      done();
    }).catch(done);
  });

  it('condition "script", no data to match the condition', function (done) {
    watcher._source.condition.script.script = 'payload.hits.total > 999999';
    watcherHandler.execute(watcher).then(function (resp) {
      expect(resp.ok).to.be(true);
      expect(resp.warning).to.be(true);
      expect(resp.message).to.eql('no data was found that match the used "script" conditions');
      done();
    }).catch(done);
  });

  it('condition "script", JavaScript error', function (done) {
    watcher._source.condition.script.script = 'testerrorhere++';
    watcherHandler.execute(watcher).catch(function (err) {
      expect(err.message).to.eql('fail to execute watcher: fail to apply condition "script": testerrorhere is not defined');
      done();
    });
  });
});
