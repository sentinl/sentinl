import _ from 'lodash';

export default function (kibana) {
  return new kibana.Plugin({
    require: ['kibana', 'elasticsearch'],

    uiExports: {
      spyModes: ['plugins/kaae/button/alarm_button'],
      // chromeNavControls: ['plugins/kaae/button/alarm_button'],
      app: {
        title: 'KaaE',
        description: 'Kibana Alert App for Elasticsearch',
        main: 'plugins/kaae/app',
        icon: 'plugins/kaae/kaae.svg',
	injectVars: function (server, options) {
                               var config = server.config();
                               return {
                                   kbnIndex: config.get('kibana.index'),
                                   esShardTimeout: config.get('elasticsearch.shardTimeout'),
                                   esApiVersion: config.get('elasticsearch.apiVersion')
                               };
        }
      }
    },
    config: function (Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
      }).default();
    },

    init: require('./init.js'),

  });
};
