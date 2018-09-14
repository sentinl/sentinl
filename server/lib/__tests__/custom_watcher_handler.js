import { isEqual, cloneDeep } from 'lodash';
import Promise from 'bluebird';
import expect from 'expect.js';
import CustomWatcherHandler from '../custom_watcher_handler';
import sinon from 'sinon';

describe('CustomWatcherHandler', function () {
  let customWatcherHandler;
  let doActionsStub;

  const scriptSources = {
    conditionTrue: `({
      search: () => void 0,
      condition: () => true
    })`,
    conditionFalse: `({
      search: () => void 0,
      condition: () => false
    })`,
    testSearchParams: `({
      search: (client, searchParams, params) => client.search && searchParams.index === 'article' && params.param1,
      condition: Boolean
    })`,
    testConditionParams: `({
      search: () => true,
      condition: (searchResponse, searchParams, params) => searchResponse && searchParams.index === 'article' && params.param1
    })`
  };

  const watcherOriginal = {
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
          index: 'article',
          queries: 'search query',
          filters: [],
          time: {
            range: {
              '@timestamp': {}
            },
          }
        }
      }
    }
  };

  beforeEach(function () {
    const server = {
      config: () => ({
        get: () => []
      }),
      log: () => void 0,
      plugins: {
        elasticsearch: {
          getCluster: () => ({
            getClient: () => ({
              index: () => void 0
            })
          })
        },
        saved_objects_api: {
          getServerCredentials: () => ({})
        }
      },
      savedObjectsClientFactory: () => ({
        find: ({ search }) => Promise.resolve({
          saved_objects: [{
            attributes: {
              title: search,
              scriptSource: scriptSources[search]
            }
          }]
        })
      })
    };
    const config = {
      es: {
        watcher_type: 'sentinl-watcher'
      },
      settings: {
        authentication: {}
      }
    };
    const client = {
      search: () => void 0
    };

    customWatcherHandler = new CustomWatcherHandler(server, client, config);

    sinon.stub(customWatcherHandler._client, 'logAlarm', function () {
      return Promise.resolve({
        type: 'sentinl-alarm',
        id: 'SVq_IGYBYC6mQ4XVT2HW',
        version: 1,
        attributes: {}
      });
    });

    doActionsStub = sinon.stub(customWatcherHandler, 'doActions');
  });

  it('executes search and triggers actions', async () => {
    const watcher = cloneDeep(watcherOriginal);
    watcher.custom = {
      type: 'conditionTrue',
      params: { param1: true }
    };
    const resp = await customWatcherHandler.execute(watcher);
    expect(resp.success).to.be(true);
    expect(doActionsStub.called).to.be(true);
  });

  it('executes search, but does not trigger actions', async () => {
    const watcher = cloneDeep(watcherOriginal);
    watcher.custom = {
      type: 'conditionFalse',
      params: { param1: true }
    };
    const resp = await customWatcherHandler.execute(watcher);
    expect(resp.ok).to.be(true);
    expect(resp.warning).to.be(true);
    expect(doActionsStub.called).to.be(false);
  });

  it('executes search function with the correct parameters', async () => {
    const watcher = cloneDeep(watcherOriginal);
    watcher.custom = {
      type: 'testSearchParams',
      params: { param1: true }
    };
    const resp = await customWatcherHandler.execute(watcher);
    expect(resp.success).to.be(true);
    expect(doActionsStub.called).to.be(true);
  });

  it('executes condition function with the correct parameters', async () => {
    const watcher = cloneDeep(watcherOriginal);
    watcher.custom = {
      type: 'testConditionParams',
      params: { param1: true }
    };
    const resp = await customWatcherHandler.execute(watcher);
    expect(resp.success).to.be(true);
    expect(doActionsStub.called).to.be(true);
  });
});
