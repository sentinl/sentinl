export default function (server) {

  server.route({
    path: '/api/kaae/example',
    method: 'GET',
    handler(req, reply) {
      reply({ time: (new Date()).toISOString() });
    }
  });

};
