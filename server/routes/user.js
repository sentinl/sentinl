import Joi from 'joi';
import handleESError from '../lib/handle_es_error';
import getConfiguration from  '../lib/get_configuration';
import { flatAttributes } from '../lib/helpers';
import apiClient from '../lib/api_client';
import Crypto from '../lib/crypto';

export default function userRoutes(server) {
  const config = getConfiguration(server);

  server.route({
    method: ['POST', 'GET'],
    path: '/api/sentinl/list/users/{size?}',
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
          type: config.es.user_type,
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
    path: '/api/sentinl/user/{id}',
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
        let resp = await client.get(config.es.user_type, req.params.id, config.es.default_index);
        resp = flatAttributes(resp);

        return reply(resp).code(200);
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
          attributes: Joi.object().required(),
        },
      },
    },
    handler: async function (req, reply) {
      try {
        const { attributes } = req.payload;

        const crypto = new Crypto(config.settings.authentication.encryption);
        attributes.sha = crypto.encrypt(attributes.password);
        delete attributes.password;

        const client = apiClient(server, config.api.type, req);
        const resp = await client.addUser(req.params.id, attributes);

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
          id: Joi.string().required(),
        },
      },
    },
    handler: async function (req, reply) {
      try {
        const client = apiClient(server, config.api.type, req);
        const resp = await client.delete(config.es.user_type, req.params.id, config.es.default_index);

        return reply(resp).code(200);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });
}
