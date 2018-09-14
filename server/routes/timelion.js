import Joi from 'joi';
import handleESError from '../lib/handle_es_error';

export default function timelionRoutes(server) {
  server.route({
    path: '/api/sentinl/timelion/run',
    method: 'POST',
    config: {
      validate: {
        payload: {
          sheet: Joi.array().default(['.es(*).label(all)']),
          time: Joi.object(), // {"from":"now-15m","interval":"auto","mode":"quick","timezone":"Europe/Berlin","to":"now"}}
        },
      },
    },
    handler: async function (req, reply) {
      const { sheet, time } = req.payload;

      try {
        const resp = await server.inject({
          method: 'POST',
          url: '/api/timelion/run',
          headers: {
            'kbn-xsrf': 'anything',
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*',
          },
          payload: {
            time,
            sheet,
          },
        });

        return reply(resp.result);
      } catch (err) {
        return reply(handleESError(err));
      }
    }
  });
}
