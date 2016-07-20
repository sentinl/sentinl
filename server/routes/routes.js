import _ from 'lodash';
import handleESError from '../lib/handle_es_error';

export default function (server) {

  server.route({
    path: '/api/kaae/example',
    method: 'GET',
    handler(req, reply) {
      reply({ time: (new Date()).toISOString() });
    }
  });

  server.route({
    path: '/api/kaae/alarms',
    method: ['POST','GET'],
    handler(req, reply) {
      reply({ data: server.kaaeStore });
    }
  });

  let call = server.plugins.elasticsearch.callWithRequest;

  server.route({
    path: '/api/kaae/list',
    method: ['POST', 'GET'],
    handler: function (req, reply) {
      const boundCallWithRequest = _.partial(server.plugins.elasticsearch.callWithRequest, req);
      boundCallWithRequest('search', {
	index: 'watcher',
        allowNoIndices: false
      })
      .then(
        function (res) {
          reply(res); 
        },
        function (error) {
          reply(handleESError(error));
        }
      );
    }
  });

  server.route({
    method: 'GET',
    path: '/api/kaae/config',
    handler: require('./config.js')
  });

  server.route({
    method: 'GET',
    path: '/api/kaae/getitems',
    handler: require('./items.js')
  });


};

