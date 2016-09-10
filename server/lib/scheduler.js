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

          if ( Schedule[hit._id]) {
            if (_.isEqual(Schedule[hit._id].hit, hit)) { return; }
            // if (Schedule[hit._id].interval == hit._source.trigger.schedule.later || Schedule[hit._id].interval == hit._source.trigger.schedule.interval) { return; }
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

          Schedule[hit._id].later = later.setInterval(function(){ watching(hit,interval) }, interval);
          server.log(['status', 'info', 'KaaE'], 'Scheduled: '+hit._id+' every '+Schedule[hit._id].interval );

          function watching(task,interval) {
            server.log(['status', 'info', 'KaaE'], 'Executing watch: '+task._id);
            server.log(['status', 'info', 'KaaE'], 'Next Round of '+task._id+' at '+later.schedule(interval).next(1) );

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
                          server.log(['status', 'info', 'KaaE'], 'Condition Error for '+rask._id+': '+err);
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
  });
}

module.exports = {
  doalert: doalert,
  getCount: getCount,
  getWatcher: getWatcher
};
