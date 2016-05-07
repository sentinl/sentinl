import later from 'later';
import _ from 'lodash';
import mustache from 'mustache';

export default function (kibana) {
  return new kibana.Plugin({
    require: ['elasticsearch'],

    uiExports: {
      app: {
        title: 'Kaae',
        description: 'Kibana Alert App for Elasticsearch',
        main: 'plugins/kaae/app'
      }
    },

    init(server, options) {

      var client = server.plugins.elasticsearch.client;
      var sched = later.parse.text('every 10 minute');
      later.setInterval(doalert, sched);
      function doalert() {
        getCount().then(function(resp){
          getWatcher(resp.count).then(function(resp){
          _.each(resp.hits.hits, function(hit){
            var watch = hit._source;
            var every = watch.trigger.schedule.interval;
            var watchSched = later.parse.recur().every(every).second();
            var wt = later.setInterval(watching, watchSched);
            function watching() {
              var request = watch.input.search.request;
              var condition = watch.condition.script.script;
              var transform = watch.transform.search.request;
              var actions = watch.actions;
              client.search(request).then(function(payload){
                var ret = eval(condition);
                if (ret) {
                  client.search(transform).then(function(payload) {
                    _.each(_.values(actions), function(action){
                      if(_.has(action, 'email')) {
                        var subject = mustache.render(action.email.subject, {"payload":payload});
                        var body = mustache.render(action.email.body, {"payload":payload});
                        console.log(subject, body);
                      }
                    });
                  });
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
    }

  });
};
