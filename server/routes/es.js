import Joi from 'joi';
import Boom from 'boom';
import getConfiguration from  '../lib/get_configuration';
import getElasticsearchClient from '../lib/get_elasticsearch_client';
import Log from '../lib/log';

export default function es(server) {
  const config = getConfiguration(server);
  const client = getElasticsearchClient(server, config);
  const log = new Log(config.app_name, server, 'ES system routes');

  server.route({
    path: '/api/sentinl/es/indexes',
    method: 'GET',
    handler: async function (req, reply) {
      try {
        const resp = await client.cat.indices({
          format: 'json',
        });

        return reply(resp);
      } catch (err) {
        return reply(Boom.serverUnavailable(err.message));
      }
    }
  });
}
