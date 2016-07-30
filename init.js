import later from 'later';
import _ from 'lodash';
import mustache from 'mustache';
import masterRoute from './server/routes/routes';
import doActions from './server/lib/actions';
import $window from 'jquery';

module.exports = function (server, options) {

      var $ = require('jquery');
      var debug = $window.kaaedebug;
      console.log('KAAE Initializing...');
      server.kaaeStore = [];
      masterRoute(server);

      /* Index Management */

      /*
	var dynamicTemplates = [ {
	  string_fields : {
	    mapping : {
	      type : 'string',
	      index : 'not_analyzed',
	      type : 'string',
	      doc_values: true,
	      fields : {
	        search : {
	          index : 'analyzed',
	          omit_norms : true,
	          type : 'string',
	        }
	      }
	    },
	    match_mapping_type : 'string',
	    match : '*'
	  }
	}];

	module.exports = function (server) {
	  // Routes and basically anything the server does at start
	
	  function createKaaeIndex() {
	    console.log('Trying to create Kaae index');
	    if (!server.plugins.elasticsearch) {
	      console.log('Elasticsearch client not available, retrying in 5s');
	      tryCreate();
	      return;
	    }

	    client.indices.putTemplate({
	      name: config.index,
	      body: {
	        template: config.index + '*',
	        settings: {
	          number_of_shards: 2,
	          number_of_replicas: 0
	        },
	        mappings: {
	          _default_: {
	            dynamic_templates : dynamicTemplates,
	            properties: {
	              '@timestamp': { type: 'date', doc_values: true },
	              'alarm_trigger': { type: 'string', doc_values: true, index: 'not_analyzed' },
	              'alarm_msg': { type: 'string', doc_values: true, index: 'not_analyzed' },
	              'alarm_score': { type: 'double' }
	            }
	          }
	        }
	      }
	    })
	    .catch(e => {
	      console.log('Error storing template', e);
	    })
	    .then((err, resp) => {
	      console.log('Kaae Template created!');
	    });
	  }
	
	  function tryCreate() {
	    setTimeout(createKaaeIndex, 5000);
	  }
	  createKaaeIndex();

      */

      /* Bird Watching and Duck Hunting */

      var client = server.plugins.elasticsearch.client;
      var sched = later.parse.text('every 10 minute');
      var t = later.setInterval(doalert, sched);
      function doalert() {
        if (debug) console.log('KAAE Alert Check...');
        getCount().then(function(resp){
          getWatcher(resp.count).then(function(resp){
          _.each(resp.hits.hits, function(hit){
	    if (debug) console.log('KAAE Processing',hit);
            var watch = hit._source;
            var every = watch.trigger.schedule.interval;
            var watchSched = later.parse.recur().every(every).second();
            var wt = later.setInterval(watching, watchSched);
            function watching() {
              var request = watch.input.search.request;
              var condition = watch.condition.script.script;
              var transform = watch.transform.search.request;
              var actions = watch.actions;
	      if (debug) console.log('KAAE Watching:',request,condition,actions);

              client.search(request).then(function(payload){
		if (!payload) return;
		if (debug) console.log('KAAE Payload:',payload);
		if (!condition) return;
		if (debug) console.log('KAAE Condition:',condition);

		/* Validate Condition */

		try { var ret = eval(condition); } catch (err) { console.log(err) }
                if (ret) {

		      /* Process Actions */
			doActions(server,actions,payload);

		      /* Transform Query (disabled) */
			// client.search(transform).then(function(payload) {
			//     console.log('Transaction resp:',payload);
			// });
                }
              });

            }
          });
          });

	  t.clear(); // testing single pass
          // t = later.setInterval(doalert, sched);

        });
      }
      /* run NOW, plus later */ 
      doalert();

      function getCount() {
        return client.count({
          index:'watcher',
          type:"watch"
        });
      }
      function getWatcher(count) {
        return client.search({
          index:'watcher',
          type:"watch",
          size:count
        });
      }

};

