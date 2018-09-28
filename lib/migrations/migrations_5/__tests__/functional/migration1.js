import expect from 'expect.js';
import sinon from 'sinon';
import requirefrom from 'requirefrom';
import Migration from '../../migration_1';
import Scenario1 from './scenarios/migration_1/scenario1';
import Scenario2 from './scenarios/migration_1/scenario2';
import url from 'url';

const serverConfig = requirefrom('test')('server_config');
const indexSnapshot = requirefrom('src/test_utils')('index_snapshot');
const ScenarioManager = requirefrom('src/test_utils')('scenario_manager');
const { Cluster } = requirefrom('src/core_plugins/elasticsearch/lib')('cluster');

describe('investigate_core/migrations/functional', function () {

  const clusterUrl =  url.format(serverConfig.servers.elasticsearch);
  const timeout = 60000;
  this.timeout(timeout);

  const fakeConfig = {
    get: sinon.stub()
  };
  fakeConfig.get.withArgs('kibana.index').returns('.siren');

  const scenarioManager = new ScenarioManager(clusterUrl, timeout);
  const cluster = new Cluster({
    url: clusterUrl,
    ssl: { verificationMode: 'none' },
    requestTimeout: timeout
  });
  const configuration = {
    config: fakeConfig,
    client: cluster.getClient(),
    logger: {
      warning: (message) => ''
    }
  };

  async function snapshot() {
    return indexSnapshot(cluster, '.siren');
  }

  describe('Siren Sentinl - Migration 1 - Functional test', function () {

    describe('there are no objects to delete', function () {

      beforeEach(async () => {
        await scenarioManager.reload(Scenario1);
      });

      it('should count objects and get 0', async () => {
        const migration = new Migration(configuration);
        const result = await migration.count();
        expect(result).to.be(0);
      });

      it('should NOT upgrade any objects', async () => {
        const migration = new Migration(configuration);
        const result = await migration.upgrade();
        expect(result).to.be(0);
      });

      afterEach(async () => {
        await scenarioManager.unload(Scenario1);
      });

    });

    describe('there are some objects to remove', function () {

      beforeEach(async () => {
        await scenarioManager.reload(Scenario2);
      });

      it('should count', async () => {
        const migration = new Migration(configuration);
        const result = await migration.count();
        expect(result).to.be(1);
      });

      it('should remove', async () => {
        const before = await snapshot();
        const migration = new Migration(configuration);

        const result = await migration.upgrade();
        expect(result).to.be(1);

        const after = await snapshot();

        expect(after.size).to.be(0);
      });

      afterEach(async () => {
        await scenarioManager.unload(Scenario2);
      });

    });
  });

});
