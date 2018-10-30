import Joi from 'joi';
import handleESError from '../lib/handle_es_error';
import getConfiguration from  '../lib/get_configuration';
import { flatAttributes } from '../lib/helpers';
import apiClient from '../lib/api_client';
import WatcherHandler from '../lib/watcher_handler';
import WatcherWizardHandler from '../lib/watcher_wizard_handler';
import Log from '../lib/log';

export default function watcherRoutes(server) {
  const config = getConfiguration(server);
  const log = new Log(config.app_name, server, 'watcher routes');

  server.route({
    method: ['POST', 'GET'],
    path: '/api/sentinl/list/watchers/{size?}',
    config: {
      validate: {
        params: {
          size: Joi.number().default(config.es.results),
        },
      },
    },
    handler: async function (req, reply) {
      try {
        const client = apiClient(server, config.api.type, req);

        const resp = await client.find({
          index: config.es.default_index,
          type: config.es.watcher_type,
          perPage: req.params.size,
        });

        resp.saved_objects = resp.saved_objects.map(flatAttributes);

        return reply(resp).code(200);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });

  server.route({
    method: ['POST', 'GET'],
    path: '/api/sentinl/watcher/{id}',
    config: {
      validate: {
        params: {
          id: Joi.string().required(),
        },
      },
    },
    handler: async function (req, reply) {
      try {
        const client = apiClient(server, config.api.type, req);
        let resp = await client.get(config.es.watcher_type, req.params.id, config.es.default_index);
        resp = flatAttributes(resp);

        return reply(resp).code(200);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });

  server.route({
    method: ['PUT'],
    path: '/api/sentinl/watcher/{id?}',
    config: {
      validate: {
        params: {
          id: Joi.string(),
        },
        payload: {
          attributes: Joi.object().required(),
        },
      },
    },
    handler: async function (req, reply) {
      try {
        const client = apiClient(server, config.api.type, req);
        const resp = await client.create(config.es.watcher_type, req.payload.attributes,
          { id: req.params.id, overwrite: true }, config.es.default_index);

        return reply(resp).code(201);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });

  server.route({
    method: 'DELETE',
    path: '/api/sentinl/watcher/{id}',
    config: {
      validate: {
        params: {
          id: Joi.string().required(),
        },
      },
    },
    handler: async function (req, reply) {
      try {
        const client = apiClient(server, config.api.type, req);
        const resp = await client.delete(config.es.watcher_type, req.params.id, config.es.default_index);

        return reply(resp).code(200);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });

  server.route({
    method: 'POST',
    path: '/api/sentinl/watcher/search',
    config: {
      validate: {
        payload: {
          request: Joi.object().required(),
          method: Joi.string().default('search')
        },
      },
    },
    handler: async function (req, reply) {
      try {
        // Use Elasticsearch API because Kibana savedObjectsClient
        // can't search in a specific index and doesn't allow custom query body
        const client = apiClient(server, 'elasticsearchAPI');
        const { method, request } = req.payload;

        const resp = await client.search(request);
        return reply(resp).code(200);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });

  server.route({
    method: 'POST',
    path: '/api/sentinl/watcher/_execute',
    config: {
      validate: {
        payload: {
          attributes: Joi.object().required(),
        },
      },
    },
    handler: async function (req, reply) {
      const attributes = req.payload.attributes;

      let watcherHandler;
      if (attributes.wizard) {
        watcherHandler = new WatcherWizardHandler(server);
      } else {
        watcherHandler = new WatcherHandler(server);
      }

      try {
        const resp = await watcherHandler.execute(req.payload.attributes);
        return reply(resp);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });

  server.route({
    path: '/api/sentinl/watcher/wizard/count',
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
        log.debug('COUNT QUERY BODY:', JSON.stringify(body, null, 2));
        log.debug('INDEX:', esParams.index);
        // Use Elasticsearch API because Kibana savedObjectsClient
        // can't search in a specific index and doesn't allow custom query body
        const client = apiClient(server, 'elasticsearchAPI');

        const resp = await client.search({
          index: esParams.index,
          ignoreUnavailable: esParams.ignoreUnavailable,
          allowNoIndices: esParams.allowNoIndices,
          body,
        });

        return reply(resp);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });

  server.route({
    path: '/api/sentinl/watcher/wizard/average',
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
        log.debug('AVERAGE QUERY BODY:', JSON.stringify(body, null, 2));
        log.debug('INDEX:', esParams.index);
        // Use Elasticsearch API because Kibana savedObjectsClient
        // can't search in a specific index and doesn't allow custom query body
        const client = apiClient(server, 'elasticsearchAPI');

        const resp = await client.search({
          index: esParams.index,
          ignoreUnavailable: esParams.ignoreUnavailable,
          allowNoIndices: esParams.allowNoIndices,
          body,
        });

        return reply(resp);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });

  server.route({
    path: '/api/sentinl/watcher/wizard/min',
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
        log.debug('MIN QUERY BODY:', JSON.stringify(body, null, 2));
        log.debug('INDEX:', esParams.index);
        // Use Elasticsearch API because Kibana savedObjectsClient
        // can't search in a specific index and doesn't allow custom query body
        const client = apiClient(server, 'elasticsearchAPI');

        const resp = await client.search({
          index: esParams.index,
          ignoreUnavailable: esParams.ignoreUnavailable,
          allowNoIndices: esParams.allowNoIndices,
          body,
        });

        return reply(resp);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });

  server.route({
    path: '/api/sentinl/watcher/wizard/max',
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
        log.debug('MAX QUERY BODY:', JSON.stringify(body, null, 2));
        log.debug('INDEX:', esParams.index);
        // Use Elasticsearch API because Kibana savedObjectsClient
        // can't search in a specific index and doesn't allow custom query body
        const client = apiClient(server, 'elasticsearchAPI');

        const resp = await client.search({
          index: esParams.index,
          ignoreUnavailable: esParams.ignoreUnavailable,
          allowNoIndices: esParams.allowNoIndices,
          body,
        });

        return reply(resp);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });

  server.route({
    path: '/api/sentinl/watcher/wizard/sum',
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
        log.debug('SUM QUERY BODY:', JSON.stringify(body, null, 2));
        log.debug('INDEX:', esParams.index);
        // Use Elasticsearch API because Kibana savedObjectsClient
        // can't search in a specific index and doesn't allow custom query body
        const client = apiClient(server, 'elasticsearchAPI');

        const resp = await client.search({
          index: esParams.index,
          ignoreUnavailable: esParams.ignoreUnavailable,
          allowNoIndices: esParams.allowNoIndices,
          body,
        });

        return reply(resp);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });

  server.route({
    method: 'POST',
    path: '/api/sentinl/watcher/wizard/getmapping',
    config: {
      validate: {
        payload: {
          index: Joi.array().required(),
        },
      },
    },
    handler: async function (request, reply) {
      const {index} = request.payload;
      try {
        // Use Elasticsearch API because Kibana savedObjectsClient
        // can't search in a specific index and doesn't allow custom query body
        const client = apiClient(server, 'elasticsearchAPI');

        const resp = await client.getMapping(index);
        return reply(resp).code(201);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });

  server.route({
    path: '/api/sentinl/watcher/wizard/indexes',
    method: 'GET',
    handler: async function (req, reply) {
      try {
        // Use Elasticsearch API because Kibana savedObjectsClient
        // can't search in a specific index and doesn't allow custom query body
        const client = apiClient(server, 'elasticsearchAPI');

        const resp = await client.getIndices();
        return reply(resp);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });
}
