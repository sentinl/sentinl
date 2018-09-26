/* global angular */
import uuid from 'uuid/v4';

const EMAILWATCHER = {
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
    ['email_alarm_' + uuid()]: {
      name: 'email alarm',
      throttle_period: '1m',
      email: {
        stateless: false,
        subject: 'Alarm',
        priority: 'high',
        body: 'Found {{payload.hits.total}} Events'
      }
    }
  }
};

angular.module('apps/sentinl.emailwatcherConstants', []).constant('EMAILWATCHER', EMAILWATCHER);
