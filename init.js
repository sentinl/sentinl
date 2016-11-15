import later from 'later';
import _ from 'lodash';
import mustache from 'mustache';
import masterRoute from './server/routes/routes';
import scheduler from './server/lib/scheduler';
import helpers from './server/lib/helpers';
import $window from 'jquery';

module.exports = function (server, options) {

      var debug = false;
      var config = require('./server/lib/config');

      var $ = require('jquery');
      server.log(['status', 'info', 'KaaE'], 'KaaE Initializing');
      server.kaaeStore = [];
      masterRoute(server);

      // Create KaaE Indices, if required
      helpers.createKaaeIndex(server,config);
      helpers.createKaaeAlarmIndex(server,config);

      /* Bird Watching and Duck Hunting */
      var client = server.plugins.elasticsearch.client;
      // var sched = later.parse.text('every 25 seconds');
      var sched = later.parse.recur().on(25,55).second();;
      var t = later.setInterval(function(){ scheduler.doalert(server,client) }, sched);
      /* run NOW, plus later */
      scheduler.doalert(server,client);
};
