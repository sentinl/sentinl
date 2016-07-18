import later from 'later';
import _ from 'lodash';
import mustache from 'mustache';
import masterRoute from './server/routes/routes';
import $window from 'jquery';

module.exports = function (server, options) {

      $window.keea = false; 
      var debug = $window.keea;
      console.log('KAAE Initializing...');

      masterRoute(server);

      var client = server.plugins.elasticsearch.client;
      var sched = later.parse.text('every 5 minute');
      later.setInterval(doalert, sched);
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
		try { var ret = eval(condition); } catch (err) { console.log(err) }
                if (ret) {
                 // client.search(transform).then(function(payload) {
                    _.each(_.values(actions), function(action){
                      if(_.has(action, 'email')) {
                        var subject = mustache.render(action.email.subject, {"payload":payload});
                        var body = mustache.render(action.email.body, {"payload":payload});
                        console.log('KAAE Alert: ',subject, body);
                      }
                    });
                 // });
                }
              });
            }
          });
          });
        });
      }
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

