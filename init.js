import later from 'later';
import _ from 'lodash';
import mustache from 'mustache';
import masterRoute from './server/routes/routes';
import doActions from './server/lib/actions';
import $window from 'jquery';

module.exports = function (server, options) {

      var debug = false;
      var config = require('./kaae.json');

      var $ = require('jquery');
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

	  function createKaaeIndex() {
	    console.log('Trying to create Kaae index');
	    if (!server.plugins.elasticsearch) {
	      console.log('Elasticsearch client not available, retrying in 5s');
	      tryCreate();
	      return;
	    }

	    client.indices.putTemplate({
	      name: config.es.default_index,
	      body: {
	        settings: {
	          number_of_shards: 2,
	          number_of_replicas: 0
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

	  function createKaaeAlarmsIndex() {
	    console.log('Trying to create Kaae Alarms index');
	    if (!server.plugins.elasticsearch) {
	      console.log('Elasticsearch client not available, retrying in 5s');
	      tryCreate();
	      return;
	    }

	    client.indices.putTemplate({
	      name: config.es.alarm_index,
	      body: {
	        template: config.es.alarm_index + '*',
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
	    setTimeout(createKaaeAlarmIndex, 5000);
	  }

	  // Create Indices
	  createKaaeIndex();
	  createKaaeAlarmIndex();

      */

      /* Bird Watching and Duck Hunting */

      // TODO: Multi-Watcher scheduler w/ reloading!

      var client = server.plugins.elasticsearch.client;
      var sched = later.parse.text('every 10 minute');
      var t = later.setInterval(doalert, sched);
      var allSched = [];
      function doalert() {
        console.log('KAAE Reloading Watchers...');
        getCount().then(function(resp){
          getWatcher(resp.count).then(function(resp){
          _.each(resp.hits.hits, function(hit){
	    if (debug) console.log('KAAE Processing',hit);
            var watch = hit._source;
            var everySec = watch.trigger.schedule.interval;
            var watchSched = later.parse.recur().every(everySec).second();
            // var wt = later.setInterval(watching, watchSched);
            allSched[hit._id] = later.setInterval(watching, watchSched);
	    if (debug) console.log('KAAE Scheduler:',hit._id, everySec);
            function watching() {
              var request = watch.input.search.request;
              var condition = watch.condition.script.script;
              var transform = watch.transform.search ? watch.transform.search.request : {};
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

