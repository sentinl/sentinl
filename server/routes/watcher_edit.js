import Joi from 'joi';
import Boom from 'boom';
import {pick} from 'lodash';
import getConfiguration from  '../lib/get_configuration';
import getElasticsearchClient from '../lib/get_elasticsearch_client';
import Log from '../lib/log';

export default function watcherEdit(server) {
  const config = getConfiguration(server);
  const client = getElasticsearchClient(server, config);
  const log = new Log(config.app_name, server, 'watcher edit routes');

  server.route({
    path: '/api/sentinl/watcher/editor/count',
    method: 'POST',
    config: {
      validate: {
        payload: {
          es_params: Joi.object({
            index: Joi.array().items(Joi.string().default('*')).default(),
            number: Joi.number().default(config.es.results),
            allowNoIndices: Joi.boolean().default(config.es.allow_no_indices),
            ignoreUnavailable: Joi.boolean().default(config.es.ignore_unavailable),
          }).default(),
          query: Joi.string(),
        },
      },
    },
    handler: async function (req, reply) {
      const esParams = req.payload.es_params;

      try {
        const body = JSON.parse(req.payload.query);
        log.debug('COUNT QUERY BODY:', body);
        log.debug('INDEX:', esParams.index);

        const resp = await client.search({
          index: esParams.index,
          ignoreUnavailable: esParams.ignoreUnavailable,
          allowNoIndices: esParams.allowNoIndices,
          body,
        });

        return reply(resp);
      } catch (err) {
        return reply(Boom.serverUnavailable(err.message));
      }
    }
  });

  server.route({
    path: '/api/sentinl/watcher/editor/average',
    method: 'POST',
    config: {
      validate: {
        payload: {
          es_params: Joi.object({
            index: Joi.array().items(Joi.string().default('*')).default(),
            number: Joi.number().default(config.es.results),
            allowNoIndices: Joi.boolean().default(config.es.allow_no_indices),
            ignoreUnavailable: Joi.boolean().default(config.es.ignore_unavailable),
          }).default(),
          query: Joi.string(),
        },
      },
    },
    handler: async function (req, reply) {
      const esParams = req.payload.es_params;

      try {
        const body = JSON.parse(req.payload.query);
        log.debug('AVERAGE QUERY BODY:', body);
        log.debug('INDEX:', esParams.index);

        const resp = await client.search({
          index: esParams.index,
          ignoreUnavailable: esParams.ignoreUnavailable,
          allowNoIndices: esParams.allowNoIndices,
          body,
        });

        return reply(resp);
      } catch (err) {
        return reply(Boom.serverUnavailable(err.message));
      }
    }
  });

  server.route({
    path: '/api/sentinl/watcher/editor/min',
    method: 'POST',
    config: {
      validate: {
        payload: {
          es_params: Joi.object({
            index: Joi.array().items(Joi.string().default('*')).default(),
            number: Joi.number().default(config.es.results),
            allowNoIndices: Joi.boolean().default(config.es.allow_no_indices),
            ignoreUnavailable: Joi.boolean().default(config.es.ignore_unavailable),
          }).default(),
          query: Joi.string(),
        },
      },
    },
    handler: async function (req, reply) {
      const esParams = req.payload.es_params;

      try {
        const body = JSON.parse(req.payload.query);
        log.debug('MIN QUERY BODY:', body);
        log.debug('INDEX:', esParams.index);

        const resp = await client.search({
          index: esParams.index,
          ignoreUnavailable: esParams.ignoreUnavailable,
          allowNoIndices: esParams.allowNoIndices,
          body,
        });

        return reply(resp);
      } catch (err) {
        return reply(Boom.serverUnavailable(err.message));
      }
    }
  });

  server.route({
    path: '/api/sentinl/watcher/editor/max',
    method: 'POST',
    config: {
      validate: {
        payload: {
          es_params: Joi.object({
            index: Joi.array().items(Joi.string().default('*')).default(),
            number: Joi.number().default(config.es.results),
            allowNoIndices: Joi.boolean().default(config.es.allow_no_indices),
            ignoreUnavailable: Joi.boolean().default(config.es.ignore_unavailable),
          }).default(),
          query: Joi.string(),
        },
      },
    },
    handler: async function (req, reply) {
      const esParams = req.payload.es_params;

      try {
        const body = JSON.parse(req.payload.query);
        log.debug('MAX QUERY BODY:', body);
        log.debug('INDEX:', esParams.index);

        const resp = await client.search({
          index: esParams.index,
          ignoreUnavailable: esParams.ignoreUnavailable,
          allowNoIndices: esParams.allowNoIndices,
          body,
        });

        return reply(resp);
      } catch (err) {
        return reply(Boom.serverUnavailable(err.message));
      }
    }
  });

  server.route({
    path: '/api/sentinl/watcher/editor/sum',
    method: 'POST',
    config: {
      validate: {
        payload: {
          es_params: Joi.object({
            index: Joi.array().items(Joi.string().default('*')).default(),
            number: Joi.number().default(config.es.results),
            allowNoIndices: Joi.boolean().default(config.es.allow_no_indices),
            ignoreUnavailable: Joi.boolean().default(config.es.ignore_unavailable),
          }).default(),
          query: Joi.string(),
        },
      },
    },
    handler: async function (req, reply) {
      const esParams = req.payload.es_params;

      try {
        const body = JSON.parse(req.payload.query);
        log.debug('SUM QUERY BODY:', body);
        log.debug('INDEX:', esParams.index);

        const resp = await client.search({
          index: esParams.index,
          ignoreUnavailable: esParams.ignoreUnavailable,
          allowNoIndices: esParams.allowNoIndices,
          body,
        });

        return reply(resp);
      } catch (err) {
        return reply(Boom.serverUnavailable(err.message));
      }
    }
  });
}
