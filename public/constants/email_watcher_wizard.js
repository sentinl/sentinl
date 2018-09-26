/* global angular */

import uuid from 'uuid/v4';

const condition = ('{{queryType}} of {{over.type}} over the last {{last.n}} {{last.unit}} {{threshold.direction}} ' +
  '{{threshold.n}} in index {{index}}').replace(/{{/g, '{{watcher.wizard.chart_query_params.');

const emailBody = `<p>Hi {{watcher.username}}</p>
<p>There are {{payload.hits.total}} results found by the watcher <i>{{watcher.title}}</i>.</p>

<div style="color: grey">
  <hr>
  <p>This watcher sends alerts based on the following criteria:</p>
  <ul><li>${condition}</li></ul>
</div>`;


const EMAILWATCHERWIZARD = {
  title: 'watcher_title',
  disable: false,
  report: false,
  save_payload: false,
  impersonate: false,
  spy: false,
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
        stateless: false,
        subject: '{{payload.hits.total}} new results from watcher {{watcher.title}}',
        priority: 'high',
        html: emailBody
      }
    }
  }
};

angular.module('apps/sentinl.emailwatcherwizardConstants', []).constant('EMAILWATCHERWIZARD', EMAILWATCHERWIZARD);
