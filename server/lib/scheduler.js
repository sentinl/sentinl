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
            server.log(['status', 'info', 'KaaE'], 'Executing watch: '+task._id+' Next Round of '+task._id+' at '+later.schedule(interval).next(1) );

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
                          server.log(['status', 'info', 'KaaE'], 'Condition Error for '+task._id+': '+err);
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
        function reporting(task,interval) {
          server.log(['status', 'info', 'KaaE'], 'Executing report: '+task._id+' Next round at '+later.schedule(interval).next(1) );
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
