/*
 * Copyright 2016, Lorenzo Mangani (lorenzo.mangani@gmail.com)
 * Copyright 2015, Rao Chenlin (rao.chenlin@gmail.com)
 *
 * This file is part of Sentinl (http://github.com/sirensolutions/sentinl)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const linkReqRespStats = function ($scope, config) {
  $scope.$bind('req', 'searchSource.history[searchSource.history.length - 1]');
  $scope.$watchMulti([
    'req',
    'req.started',
    'req.stopped',
    'searchSource'
  ], function () {
    if (!$scope.searchSource || !$scope.req) return;

    const req = $scope.req;
    const resp = $scope.req.resp;
    const stats = $scope.stats = [];
    const indices = $scope.index = [];
    let indexPattern;

    if (resp && resp.took != null) stats.push(['Query Duration', resp.took + 'ms']);
    if (req && req.ms != null) stats.push(['Request Duration', req.ms + 'ms']);
    if (resp && resp.hits) stats.push(['Hits', resp.hits.total]);

    if (req.fetchParams) {
      // if (req.fetchParams.index) stats.push(['Index', req.fetchParams.index]);
      // if (req.fetchParams.type) stats.push(['Type', req.fetchParams.type]);
      // if (req.fetchParams.id) stats.push(['Id', req.fetchParams.id]);

      if (req.fetchParams.index) {
        var idx = (req.fetchParams.index).toString();
        var tmp = idx.replace(/\*/g, '');
        indices.push('<' + tmp + '{now/d}>');
        indices.push('<' + tmp + '{now/d-1d}>');
        indexPattern = req.fetchParams.index;
      }
    }

    $scope.intervals = [
      {name: '1m', value: 'every 1 minute'},
      {name: '5m', value: 'every 5 minutes'},
      {name: '10m', value: 'every 10 minutes'},
      {name: '1h', value: 'every 1 hour'}
    ];

    $scope.ranges = [
      {name: '1m', value: 'now-1m'},
      {name: '5m', value: 'now-5m'},
      {name: '10m', value: 'now-1h'},
      {name: '1h', value: 'now-1h'},
      {name: '6h', value: 'now-6h'},
      {name: '12h', value: 'now-12h'},
      {name: '1d', value: 'now-1d'}
    ];

    $scope.resKeys = [];
    $scope.iterateKeys = function (data) {
      var result = {};
      function recurse(cur, prop) {
        if (Object(cur) !== cur) {
          result[prop] = cur;
        } else if (Array.isArray(cur)) {
          for (var i = 0, l = cur.length; i < l; i++) {
            recurse(cur[i], prop + '[' + i + ']');
          }
          if (cur.length === 0) {
            result[prop] = [];
          }
        } else {
          var isEmpty = true;
          for (var p in cur) {
            if (p) {
              isEmpty = false;
              recurse(cur[p], prop ? prop + '.' + p : p);
            }
          }
          if (isEmpty && prop) {
            result[prop] = {};
          }
        }
      }
      recurse(data, '');
      $scope.resKeys = result;
    };

    if (resp) $scope.iterateKeys({payload:resp});

    /* User can select different form - change here to change labels of the select*/
    $scope.watcher_choose = ['E-Mail', 'HTML E-Mail', 'Slack', 'Webhook'];
    $scope.selectedchoose = '';
    $scope.viewFlag = false;

    /* Enable-disable forms */
    $scope.activeform = {
      'email': false,
      'htmlemail': false,
      'slack': false,
      'webhook': false
    };

    /* Defaults */
    $scope.watcher_id = 'new_saved';
    $scope.watcher_script = 'payload.hits.total > 100';
    $scope.watcher_interval = $scope.intervals[0].value;
    $scope.watcher_range = $scope.ranges[1].value;

    /* fields for e-mail option */
    $scope.watcher_email_to = 'root@localhost';
    $scope.watcher_email_subj = 'SENTINL ALARM {{ payload._id }}';
    $scope.watcher_email_body = 'Series Alarm {{ payload._id}}: {{ payload.hits.total }}';

    /*fields for html_e-mail option */
    $scope.watcher_email_html_to = 'root@localhost';
    $scope.watcher_email_html_subj = 'SENTINL ALARM {{ payload._id }}';
    $scope.watcher_email_html_body = 'Series Alarm {{ payload._id}}: {{ payload.hits.total }}';
    $scope.watcher_email_html_html = '<p>Series Alarm {{ payload._id}}: {{payload.hits.total}}</p>';

    /* fields for slack webhook option */
    $scope.watcher_slack_channel = '#<channel>';
    $scope.watcher_slack_message = 'Series Alarm {{ payload._id}}: {{payload.hits.total}}';

    /* fields for generic webhook option */
    $scope.watcher_webhook_method = 'POST';
    $scope.watcher_webhook_host = 'remote.server';
    $scope.watcher_webhook_port = 9200;
    $scope.watcher_webhook_path = ':/{{payload.watcher_id}';
    $scope.watcher_webhook_body = '{{payload.watcher_id}}:{{payload.hits.total}}';

    $scope.savedWatcher = {};
    $scope.savedWatcher.actions = {};
    var alarm = {};

    $scope.watcherUpdate = function () {
      $scope.savedWatcher.interval = $scope.watcher_interval;
      $scope.savedWatcher.range = $scope.watcher_range;
      $scope.savedWatcher.id = $scope.watcher_id;
      $scope.savedWatcher.script = $scope.watcher_script;
      $scope.savedWatcher.keys = $scope.resKeys;
      config.savedWatcher = $scope.savedWatcher;
    };

    $scope.makeAlarm = function () {
      // console.log('updainge proto watcher..');
      $scope.watcherUpdate();
      $scope.alarm = {
        '_index': 'watcher',
        '_type': 'watch',
        '_id': $scope.watcher_id,
        '_new': 'true',
        '_source': {
          'trigger': {
            'schedule': {
              'later': $scope.watcher_interval ? $scope.watcher_interval : 'every 5 minutes'
            }
          },
          'input': {
            'search': {
              'request': {
                'index': [],
                'body': req.fetchParams.body,
              }
            }
          },
          'condition': {
            'script': {
              'script': $scope.savedWatcher.script
            }
          },
          'transform': {},
          'actions': {
            'kibi_actions': $scope.savedWatcher.actions
          }
        }
      };

      // Patch Indices
      $scope.alarm._source.input.search.request.index = $scope.indices ? $scope.indices : [];
      // Patch Range
      $scope.alarm._source.input.search.request.body.query.filtered.filter =
      {'range': { '@timestamp': {'from': $scope.watcher_range ? $scope.watcher_range : 'now-1h' } } };

      // Store Watcher
      alarm = $scope.alarm;
      window.localStorage.setItem('sentinl_saved_query', JSON.stringify($scope.alarm));

    };

    $scope.manageForm = function () {
      if ($scope.selectedchoose === $scope.watcher_choose[0]) {
        if ($scope.savedWatcher.actions.email) {
          $scope.viewFlag = true;
        } else {
          $scope.viewFlag = false;
        }
      } else
        if ($scope.selectedchoose === $scope.watcher_choose[1]) {
          if ($scope.savedWatcher.actions.email_html) {
            $scope.viewFlag = true;
          } else {
            $scope.viewFlag = false;
          }
        } else
          if ($scope.selectedchoose === $scope.watcher_choose[2]) {
            if ($scope.savedWatcher.actions.slack) {
              $scope.viewFlag = true;
            } else {
              $scope.viewFlag = false;
            }
          } else
            if ($scope.selectedchoose === $scope.watcher_choose[3]) {
              if ($scope.savedWatcher.actions.webhook) {
                $scope.viewFlag = true;
              } else {
                $scope.viewFlag = false;
              }
            }
    };

    $scope.switchViewFlag = function (flag) {
      if (flag) {
        $scope.viewFlag = true;
        $scope.manageViewArray(true);
        $scope.updateAction();
      } else {
        var proceed = confirm('Are you sure to delete this action?');
        if (proceed) {
          $scope.viewFlag = false;
          $scope.manageViewArray(false);
          $scope.deleteAction();
        }
      }
    };

    $scope.manageViewArray = function (flag) {
      switch ($scope.selectedchoose) {
        case 'E-Mail':
          $scope.activeform.email = flag;
          break;
        case 'HTML E-Mail':
          $scope.activeform.htmlemail = flag;
          break;
        case 'Slack':
          $scope.activeform.slack = flag;
          break;
        case 'Webhook':
          $scope.activeform.webhook = flag;
          break;
      }
    };

    $scope.goToCompiledForm = function (nameForm) {
      $scope.selectedchoose = nameForm;
      $scope.viewFlag = true;
    };

    $scope.deleteAction = function () {
      if ($scope.selectedchoose === $scope.watcher_choose[0]) {
        if ($scope.savedWatcher.actions.email) {
          delete $scope.savedWatcher.actions.email;
          $scope.watcher_email_to = 'root@localhost';
          $scope.watcher_email_subj = 'SENTINL ALARM {{ payload._id }}';
          $scope.watcher_email_body = 'Series Alarm {{ payload._id}}: {{ payload.hits.total }}';
        }
      } else if ($scope.selectedchoose === $scope.watcher_choose[1]) {
        if ($scope.savedWatcher.actions.email_html) {
          delete $scope.savedWatcher.actions.email_html;
          $scope.watcher_email_html_to = 'root@localhost';
          $scope.watcher_email_html_subj = 'SENTINL ALARM {{ payload._id }}';
          $scope.watcher_email_html_body = 'Series Alarm {{ payload._id}}: {{ payload.hits.total }}';
          $scope.watcher_email_html_html = '<p>Series Alarm {{ payload._id}}: {{payload.hits.total}}</p>';
        }
      } else if ($scope.selectedchoose === $scope.watcher_choose[2]) {
        if ($scope.savedWatcher.actions.slack) {
          delete $scope.savedWatcher.actions.slack;
          $scope.watcher_slack_channel = '#<channel>';
          $scope.watcher_slack_message = 'Series Alarm {{ payload._id}}: {{payload.hits.total}}';
        }
      } else if ($scope.selectedchoose === $scope.watcher_choose[3]) {
        if ($scope.savedWatcher.actions.webhook) {
          delete $scope.savedWatcher.actions.webhook;
          $scope.watcher_webhook_method = 'POST';
          $scope.watcher_webhook_host = 'remote.server';
          $scope.watcher_webhook_port = 9200;
          $scope.watcher_webhook_path = ':/{{payload.watcher_id}';
          $scope.watcher_webhook_body = '{{payload.watcher_id}}:{{payload.hits.total}}';
        }
      }
      $scope.selectedchoose = '';
    };

    $scope.updateAction = function () {
      if ($scope.selectedchoose === $scope.watcher_choose[0]) {
        $scope.savedWatcher.actions.email = {
          'to': $scope.watcher_email_to ? $scope.watcher_email_to : 'alarm@localhost',
          'from': $scope.watcher_email_from ? $scope.watcher_email_from : 'sentinl@localhost',
          'subject': $scope.watcher_email_subj ? $scope.watcher_email_subj : 'Sentinl Alarm',
          'priority': 'high',
          'body': $scope.watcher_email_body ? $scope.watcher_email_body : 'Found {{payload.hits.total}} Events'
        };
      } else if ($scope.selectedchoose === $scope.watcher_choose[1]) {
        $scope.savedWatcher.actions.email_html = {
          'to': $scope.watcher_email_html_to ? $scope.watcher_email_html_to : 'alarm@localhost',
          'from': $scope.watcher_email_html_from ? $scope.watcher_email_html_from : 'sentinl@localhost',
          'subject': $scope.watcher_email_html_subj ? $scope.watcher_email_html_subj : 'Sentinl Alarm',
          'priority': 'high',
          'body': $scope.watcher_email_html_body ? $scope.watcher_email_html_body : 'Found {{payload.hits.total}} Events',
          'html': $scope.watcher_email_html_html ? $scope.watcher_email_html_html :
          '<p>Series Alarm {{ payload._id}}: {{payload.hits.total}}</p>'
        };
      } else if ($scope.selectedchoose === $scope.watcher_choose[2]) {
        $scope.savedWatcher.actions.slack = {
          'channel': $scope.watcher_slack_channel ? $scope.watcher_slack_channel : '#<channel>',
          'message': $scope.watcher_slack_message ? $scope.watcher_slack_message : 'Series Alarm {{ payload._id}}: {{payload.hits.total}}'
        };
      } else if ($scope.selectedchoose === $scope.watcher_choose[3]) {
        $scope.savedWatcher.actions.webhook = {
          'method': $scope.watcher_webhook_method ? $scope.watcher_webhook_method : 'POST',
          'host': $scope.watcher_webhook_host ? $scope.watcher_webhook_host : 'remote.server',
          'port': $scope.watcher_webhook_port ? $scope.watcher_webhook_port : 9200,
          'path': $scope.watcher_webhook_path ? $scope.watcher_webhook_path : ':/{{payload.watcher_id}',
          'body': $scope.watcher_webhook_body ? $scope.watcher_webhook_body : '{{payload.watcher_id}}:{{payload.hits.total}}'
        };
      }
    };
    $scope.makeAlarm();
    $scope.updateAction();

  });
};



// Spy Placement
require('ui/registry/spy_modes').register(function () {
  return {
    display: 'Set Watcher',
    name: 'setalarm',
    order: 1000,
    link: linkReqRespStats,
    template: require('plugins/sentinl/button/alarm_spy.html')
  };
});
