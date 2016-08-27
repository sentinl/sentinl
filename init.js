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
      server.log(['status', 'info', 'KaaE'], `KaaE Initializing`);
      server.kaaeStore = [];
      masterRoute(server);


      /* START INDICES HELPERS - TODO: MOVE TO DEDICATED PROCESSOR */

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
            server.log(['status', 'debug', 'KaaE'], `Core Index creation...`);
	    if (!server.plugins.elasticsearch) {
	      server.log(['warning', 'error', 'KaaE'], `Elasticsearch client not available, retrying in 5s`);
	      tryCreate();
	      return;
	    }

            var client = server.plugins.elasticsearch.client;
	    client.indices.exists({
        	index: config.es.default_index
    	    }, function (error, exists) {
		 if (exists === true) { 
		        server.log(['status', 'debug', 'KaaE'], `Core Index exists!`);
			return;
		 }

	    	client.indices.create({
	    	  index: config.es.default_index,
	    	  body: {
	    	    settings: {
	    	      number_of_shards: 1,
	    	      number_of_replicas: 1
	    	    }
	    	  }
	    	})
	    	.then(function (resp) {
	           server.log(['status', 'info', 'KaaE'], 'Core Index response', resp);
            }, function (err) {
                console.trace(err.message);
            });
	    });
	  }

	  var tryCount = 0;
	  function tryCreate() {
	    if (tryCount > 5) {
	        server.log(['error', 'warning', 'KaaE'], `Failed creating Indices mapping!`);
		return;
	    }
	    setTimeout(createKaaeIndex, 5000);
	    tryCount++;
	  }


	  function createKaaeAlarmIndex() {
            server.log(['status', 'info', 'KaaE'], `Alarm Index creation...`);
	    if (!server.plugins.elasticsearch) {
	      server.log(['warning', 'error', 'KaaE'], `Elasticsearch client not available, retrying in 5s`);
	      tryAlarmCreate();
	      return;
	    }

            var client = server.plugins.elasticsearch.client;
	    client.indices.exists({
        	index: config.es.alarm_index
    	    }, function (error, exists) {
		 if (exists === true) { 
		        server.log(['status', 'debug', 'KaaE'], `Alarms Index exists!`);
			return;
		 }

	    	client.indices.create({
	    	  index: config.es.alarm_index,
	    	  body: {
	    	    settings: {
	    	      number_of_shards: 1,
	    	      number_of_replicas: 1
	    	    }
	    	  }
	    	})
	    	.then(function (resp) {
	           server.log(['status', 'info', 'KaaE'], 'Alarm Index response', resp);
            }, function (err) {
                console.trace(err.message);
            });
	    });

	  }

	  var tryAlarmCount = 0;
	  function tryAlarmCreate() {
	    if (tryCount > 5) { 
	        server.log(['error', 'warning', 'KaaE'], `Failed creating Alarm Indices mapping!`);
		return;
	    }
	    setTimeout(createKaaeAlarmIndex, 5000);
	    tryAlarmCount++;
	  }

      /* END INDICES HELPERS */


      // Create KaaE Indices, if required
      createKaaeIndex();
      createKaaeAlarmIndex();


      /* Bird Watching and Duck Hunting */

      // TODO: Multi-Watcher scheduler w/ reloading!

      var client = server.plugins.elasticsearch.client;
      var sched = later.parse.text('every 10 minute');
      var t = later.setInterval(doalert, sched);
      var Schedule = [];
      function doalert() {
        server.log(['status', 'info', 'KaaE'], `Reloading Watchers...`);
        getCount().then(function(resp){
          getWatcher(resp.count).then(function(resp){
          _.each(resp.hits.hits, function(hit){

            server.log(['status', 'info', 'KaaE'], `Reloading Each Watcher...`);
	    if(hit._source.trigger.schedule.interval % 1 === 0){
		// max 60 seconds!
	        var interval = later.parse.recur().every(hit._source.trigger.schedule.interval).second();
	    }

	    if(hit._source.trigger.schedule.later){
		// https://bunkat.github.io/later/parsers.html#text
      	        var interval = later.parse.text(hit._source.trigger.schedule.later);
	    }

            Schedule[hit._id] = later.setInterval(function(){ watching(hit,interval) }, interval);
                server.log(['status', 'debug', 'KaaE'], 'Scheduler: '+hit._id+' every '+hit._source.trigger.schedule.interval);

            function watching(task,interval) {
              server.log(['status', 'info', 'KaaE'], 'Executing watch: '+task._id);
              server.log(['status', 'info', 'KaaE'], 'Next Round of '+task._id+' at '+later.schedule(interval).next(2) );

	      var watch = task._source;
              var request = watch.input.search.request;
              var condition = watch.condition.script.script;
              var transform = watch.transform.search ? watch.transform.search.request : {};
              var actions = watch.actions;

              client.search(request).then(function(payload){
		if (!payload) return;
		if (!condition) return;

		/* Validate Condition */

		try { var ret = eval(condition); } catch (err) { 
	                server.log(['status', 'info', 'KaaE'], `Condition Error:`,err);
		}
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

