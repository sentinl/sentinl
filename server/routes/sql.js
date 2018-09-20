import uuid from 'uuid/v4';
import Joi from 'joi';
import handleESError from '../lib/handle_es_error';
import getConfiguration from  '../lib/get_configuration';
import apiClient from '../lib/api_client';
import { convert as convertSQLtoDSL } from 'elasql';

export default function sqlRoutes(server) {
  const config = getConfiguration(server);

  server.route({
    path: '/api/sentinl/sql/translate',
    method: 'POST',
    config: {
      validate: {
        payload: {
          sql_query: Joi.string(),
        },
      },
    },
    handler: async function (req, reply) {
      try {
        return reply({
          dsl_query: convertSQLtoDSL(req.payload.sql_query), // DSL query
        });
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });

  server.route({
    path: '/api/sentinl/sql/execute/{index}',
    method: 'POST',
    config: {
      validate: {
        params: {
          index: Joi.string(),
        },
        payload: {
          sql_query: Joi.string(),
        },
      },
    },
    handler: async function (req, reply) {
      const sqlQuery = req.payload.sql_query;
      const index = req.params.index;

      try {
        const apiSqlTranslate = await server.inject({
          method: 'POST',
          url: '/api/sentinl/sql/translate',
          headers: {
            'kbn-xsrf': 'reporting',
          },
          payload: {
            sql_query: sqlQuery,
          },
        });

        const body = apiSqlTranslate.result.dsl_query;
        body.size = config.es.results;

        // Use Elasticsearch API because Kibana savedObjectsClient
        // can't search in a specific index and doesn't allow custom query body
        const client = apiClient(server, 'elasticsearchAPI');
        const resp = await client.search({
          index,
          body,
          type: config.es.default_type,
        });
        return reply(resp);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });
}
