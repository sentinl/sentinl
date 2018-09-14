import uuid from 'uuid/v4';
import Joi from 'joi';
import handleESError from '../lib/handle_es_error';
import getConfiguration from  '../lib/get_configuration';
import getElasticsearchClient from '../lib/get_elasticsearch_client';
import { flattenDocsSourceAndType } from '../lib/helpers';
import { get } from 'lodash';
import { isKibi } from '../lib/helpers';

async function listDocs({ client, type, config, size }) {
  const resp = await client.search({
    size: size || config.es.results,
    index: config.es.default_index,
    type: config.es.default_type,
    allowNoIndices: config.es.allow_no_indices,
    body: {
      query: {
        exists: { field: type }
      }
    }
  });

  resp.hits.hits = flattenDocsSourceAndType(resp.hits.hits, type);
  return resp;
}

async function getDoc({ client, type, config, id }) {
  const doc = await client.get({
    index: config.es.default_index,
    type: config.es.default_type,
    id,
  });

  return flattenDocsSourceAndType([doc], type)[0];
}

async function putDoc({ client, type, config, body, id }) {
  function creteSavedObjectsLikeId(id, docType) {
    id = id || uuid();
    if (id.includes(':')) {
      return docType + ':' + id.split(':').slice(-1)[0];
    }
    return docType + ':' + id;
  }

  const req = {
    refresh: true,
    index: config.es.default_index,
    type: config.es.default_type,
    body: {
      type,
      [type]: body,
    },
    id: creteSavedObjectsLikeId(id, type),
  };

  return await client.index(req);
}

export default function watcherRoutes(server) {
  const config = getConfiguration(server);
  const client = getElasticsearchClient({server, config});

  server.route({
    method: ['POST', 'GET'],
    path: '/api/sentinl/list/watchers/{size?}',
    config: {
      validate: {
        params: {
          size: Joi.number(),
        },
      },
    },
    handler: async function (req, reply) {
      try {
        const resp = await listDocs({
          client,
          config,
          type: config.es.watcher_type,
          size: req.params.size
        });
        return reply(resp).code(201);
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
          id: Joi.string(),
        },
      },
    },
    handler: async function (req, reply) {
      try {
        const resp = await getDoc({
          client,
          config,
          type: config.es.watcher_type,
          id: req.params.id
        });
        return reply(resp).code(201);
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
          body: Joi.object(),
        },
      },
    },
    handler: async function (req, reply) {
      try {
        const resp = await putDoc({
          client,
          config,
          type: config.es.watcher_type,
          body: req.payload.body,
          id: req.params.id
        });
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
          id: Joi.string(),
        },
      },
    },
    handler: async function (req, reply) {
      try {
        const resp = await client.delete({
          refresh: true,
          index: config.es.default_index,
          type: config.es.default_type,
          id: req.params.id
        });

        return reply(resp).code(201);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });

  server.route({
    method: ['POST', 'GET'],
    path: '/api/sentinl/list/users/{size?}',
    config: {
      validate: {
        params: {
          size: Joi.number(),
        },
      },
    },
    handler: async function (req, reply) {
      try {
        const resp = await listDocs({
          client,
          config,
          type: config.es.user_type,
          size: req.params.size
        });
        return reply(resp).code(201);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });

  server.route({
    method: ['POST', 'GET'],
    path: '/api/sentinl/user/{id}',
    config: {
      validate: {
        params: {
          id: Joi.string(),
        },
      },
    },
    handler: async function (req, reply) {
      try {
        const resp = await getDoc({
          client,
          config,
          type: config.es.user_type,
          id: req.params.id
        });
        return reply(resp).code(201);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });

  server.route({
    method: ['PUT'],
    path: '/api/sentinl/user/{id?}',
    config: {
      validate: {
        params: {
          id: Joi.string(),
        },
        payload: {
          body: Joi.object(),
        },
      },
    },
    handler: async function (req, reply) {
      try {
        const resp = await putDoc({
          client,
          config,
          type: config.es.user_type,
          body: req.payload.body,
          id: req.params.id
        });
        return reply(resp).code(201);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });

  server.route({
    method: 'DELETE',
    path: '/api/sentinl/user/{id}',
    config: {
      validate: {
        params: {
          id: Joi.string(),
        },
      },
    },
    handler: async function (req, reply) {
      try {
        const resp = await client.delete({
          refresh: true,
          index: config.es.default_index,
          type: config.es.default_type,
          id: req.params.id
        });

        return reply(resp).code(201);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });

  server.route({
    method: ['POST', 'GET'],
    path: '/api/sentinl/list/scripts/{size?}',
    config: {
      validate: {
        params: {
          size: Joi.number(),
        },
      },
    },
    handler: async function (req, reply) {
      try {
        const resp = await listDocs({
          client,
          config,
          type: config.es.script_type,
          size: req.params.size
        });
        return reply(resp).code(201);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });

  server.route({
    method: ['POST', 'GET'],
    path: '/api/sentinl/script/{id}',
    config: {
      validate: {
        params: {
          id: Joi.string(),
        },
      },
    },
    handler: async function (req, reply) {
      try {
        const resp = await getDoc({
          client,
          config,
          type: config.es.script_type,
          id: req.params.id
        });
        return reply(resp).code(201);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });

  server.route({
    method: ['PUT'],
    path: '/api/sentinl/script/{id?}',
    config: {
      validate: {
        params: {
          id: Joi.string(),
        },
        payload: {
          body: Joi.object(),
        },
      },
    },
    handler: async function (req, reply) {
      try {
        const resp = await putDoc({
          client,
          config,
          type: config.es.script_type,
          body: req.payload.body,
          id: req.params.id
        });
        return reply(resp).code(201);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });

  server.route({
    method: 'DELETE',
    path: '/api/sentinl/script/{id}',
    config: {
      validate: {
        params: {
          id: Joi.string(),
        },
      },
    },
    handler: async function (req, reply) {
      try {
        const resp = await client.delete({
          refresh: true,
          index: config.es.default_index,
          type: config.es.default_type,
          id: req.params.id
        });

        return reply(resp).code(201);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });
}
