/* KAAE Watch Scheduler */

import _ from 'lodash';
import later from 'later';
import doActions from './actions';

var Schedule = [];

function getCount(client) {
  return client.count({
    index:'watcher',
    type:"watch"
  });
}

function getWatcher(count,client) {
  return client.search({
    index:'watcher',
    type:"watch",
    size:count
  });
}

function doalert(server,client) {
  server.log(['status', 'debug', 'KaaE'], 'Reloading Watchers...');
  getCount(client).then(function(resp){
    getWatcher(resp.count,client).then(function(resp){
      /* Orphanizer */
        var orphans = _.difference(_.each(Object.keys( Schedule )), _.map(resp.hits.hits, '_id')  );
        _.each(orphans, function(orphan){
                server.log(['status', 'info', 'KaaE'],'Deleting orphan watcher: '+orphan);
                Schedule[orphan].later.clear();
                delete Schedule[orphan];
        });
        
      /* Scheduler */
      _.each(resp.hits.hits, function(hit){

        if (Schedule[hit._id]) {
          if (_.isEqual(Schedule[hit._id].hit, hit)) { return; }
          else { server.log(['status', 'info', 'KaaE'],'Clearing watcher: '+hit._id); Schedule[hit._id].later.clear(); }
        }

          Schedule[hit._id] = {};
          Schedule[hit._id].hit = hit;

          if(hit._source.trigger.schedule.later){
            // https://bunkat.github.io/later/parsers.html#text
            var interval = later.parse.text(hit._source.trigger.schedule.later);
            Schedule[hit._id].interval = hit._source.trigger.schedule.later;
          }
          else if(hit._source.trigger.schedule.interval % 1 === 0){
            // max 60 seconds!
            var interval = later.parse.recur().every(hit._source.trigger.schedule.interval).second();
            Schedule[hit._id].interval = hit._source.trigger.schedule.interval;
          }

          if (hit._source.report) {
            /* Report */
            Schedule[hit._id].later = later.setInterval(function(){ reporting(hit,interval) }, interval);
            server.log(['status', 'info', 'KaaE'], 'Scheduled Report: '+hit._id+' every '+Schedule[hit._id].interval );
          } else {
            /* Watcher */
            Schedule[hit._id].later = later.setInterval(function(){ watching(hit,interval) }, interval);
            server.log(['status', 'info', 'KaaE'], 'Scheduled Watch: '+hit._id+' every '+Schedule[hit._id].interval );
          }


          function watching(task,interval) {
            server.log(['status', 'info', 'KaaE'], 'Executing watch: '+task._id+' Next Round at '+later.schedule(interval).next(2).split(',')[1] );

	    server.log(['status', 'debug', 'KaaE', 'WATCHER DEBUG'], task);

            var watch = task._source;
            var request = watch.input.search.request;
            var condition = watch.condition.script.script;
            var transform = watch.transform ? watch.transform : {};
            var actions = watch.actions;

            client.search(request).then(function(payload){
              if (!payload || !condition || !actions) {
		    server.log(['status', 'debug', 'KaaE', 'WATCHER TASK'], 'Watcher Malformed or Missing Key Parameters!');
		    return;
	      }

	      server.log(['status', 'debug', 'KaaE', 'PAYLOAD DEBUG'], payload);

              /* Validate Condition */
              try { var ret = eval(condition); } catch (err) {
                          server.log(['status', 'info', 'KaaE'], 'Condition Error for '+task._id+': '+err);
              }
              if (ret) {
                  if (transform.script) {
                      try { eval(transform.script.script); } catch (err) {
                          server.log(['status', 'info', 'KaaE'], 'Transform Script Error for '+task._id+': '+err);
                      }
                      doActions(server,actions,payload);
                  } else if (transform.search) {
                      client.search(transform.search.request).then(function(payload) {
                          if (!payload) return;
                          doActions(server,actions,payload);
                      });
                  } else {
                      doActions(server,actions,payload);
                  }
              }
            });
        }
        function reporting(task,interval) {
          server.log(['status', 'info', 'KaaE'], 'Executing report: '+task._id+' Next round at '+later.schedule(interval).next(2).split(',')[1] );
          var actions = task._source.actions;
          var payload = { "_id": task._id };
          if (!actions) { server.log(['status', 'info', 'KaaE'], 'Condition Error for '+task._id); return; }
          doActions(server,actions,payload);
        }  
      });
    });
  });
}

module.exports = {
  doalert: doalert,
  getCount: getCount,
  getWatcher: getWatcher
};
