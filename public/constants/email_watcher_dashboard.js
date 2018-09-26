/* global angular */
import uuid from 'uuid/v4';

const emailBody = `<p>Hi {{watcher.username}},</p>
<p>There are {{payload.hits.total}} results found by the watcher <i>{{watcher.title}}</i>.</p>
<p>Click <a target="_blank" href="{{watcher.dashboard_link}}">here</a> to see the dashboard.</p>
<div style="color: grey">
  <hr>
  <p>This watcher sends alerts based on the following criteria:</p>
  <ul><li>{{watcher.condition.script.script}}</li></ul>
</div>`;

const EMAILWATCHERDASHBOARD = {
  title: 'watcher_title',
  disable: false,
  report: false,
  save_payload: false,
  impersonate: false,
  spy: true,
  trigger: {
    schedule: {
      later: 'every 2 minutes'
    }
  },
  input: {
    search: {
      request: {
        index: [],
        body: {}
      }
    }
  },
  condition: {
    script: {
      script: 'payload.hits.total >= 0'
    }
  },
  actions: {
    ['email_html_alarm_' + uuid()]: {
      name: 'email html alarm',
      throttle_period: '1m',
      email_html: {
        to: '',
        from: '',
        stateless: false,
        subject: '{{payload.hits.total}} new results from watcher {{watcher.title}}',
        priority: 'high',
        html: emailBody
      }
    }
  }
};

angular.module('apps/sentinl.emailwatcherdashboardConstants', []).constant('EMAILWATCHERDASHBOARD', EMAILWATCHERDASHBOARD);
