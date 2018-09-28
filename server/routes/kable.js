import uuid from 'uuid/v4';
import Joi from 'joi';
import handleESError from '../lib/handle_es_error';
import getConfiguration from  '../lib/get_configuration';
import getElasticsearchClient from '../lib/get_elasticsearch_client';

export default function kableRoutes(server) {
  const config = getConfiguration(server);
  const client = getElasticsearchClient({server, config});

  server.route({
    path: '/api/sentinl/kable/run',
    method: 'POST',
    config: {
      validate: {
        payload: {
          expression: Joi.string().default('.index(_all)'),
          time: Joi.object(), // {"from":"now-15m","mode":"quick","timezone":"Europe/Berlin","to":"now"}}
        },
      },
    },
    handler: async function (req, reply) {
      const { expression, time } = req.payload;

      try {
        const resp = await server.inject({
          method: 'POST',
          url: '/api/kable/run',
          headers: {
            'kbn-xsrf': 'anything',
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*',
          },
          payload: {
            time,
            expression,
          },
        });

        return reply(resp.result);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });

  server.route({
    path: '/api/sentinl/from/kable/index',
    method: 'POST',
    config: {
      validate: {
        payload: {
          expression: Joi.string(),
          sentinl_expression: Joi.string(),
        },
      },
    },
    handler: async function (req, reply) {
      try {
        const kableExpression = req.payload.expression;
        const sentinlExpression = req.payload.sentinl_expression;

        let title;
        let trigger;
        let actions;
        let condition;

        try {
          title = /(title='(.+)')/.exec(sentinlExpression)[2];
        } catch (err) {
          throw new Error('fail to parse title: ' + err.toString());
        }

        try {
          trigger = JSON.parse('{' + /trigger='{([^{}]*)/.exec(sentinlExpression)[1] + '}');
        } catch (err) {
          throw new Error('fail to parse trigger: ' + err.toString());
        }

        try {
          condition = JSON.parse('{' + /condition='{([^{}]*)/.exec(sentinlExpression)[1] + '}');
        } catch (err) {
          throw new Error('fail to parse condition: ' + err.toString());
        }

        try {
          actions = JSON.parse('{' + /actions='{([^{}]*)/.exec(sentinlExpression)[1] + '}');
        } catch (err) {
          throw new Error('fail to parse actions: ' + err.toString());
        }

        const resp = await client.index({
          index: config.es.default_index,
          type: config.es.default_type,
          id: config.es.watcher_type + ':' + uuid(),
          body: {
            type: config.es.watcher_type,
            [config.es.watcher_type]: {
              title,
              input: {
                search: {
                  kable: kableExpression,
                },
              },
              condition,
              actions,
              trigger,
            }
          },
        });

        return reply(resp);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });
}
