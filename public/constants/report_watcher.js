/* global angular */

import uuid from 'uuid/v4';

const REPORTWATCHER = {
  title: 'reporter_title',
  disable: false,
  report: true,
  save_payload: false,
  impersonate: false,
  spy: false,
  trigger: {
    schedule: {
      later: 'every 1 hour'
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
    ['report_admin_' + uuid()]: {
      name: 'report admin',
      throttle_period: '15m',
      report: {
        name: 'report screenshot',
        auth: {
          active: false,
          mode: 'basic',
        },
        stateless: false,
        to: 'to@email.com',
        from: 'from@email.com',
        subject: 'My Report',
        priority: 'high',
        body: 'Sample Screenshot Report',
        save: true,
        snapshot: {
          res: '1920x1080',
          url: 'http://localhost/app/kibana#/dashboard/Alerts',
          params: {
            delay: 5000,
            crop: 'false'
          }
        }
      }
    }
  }
};

angular.module('apps/sentinl.reportwatcherConstants', []).constant('REPORTWATCHER', REPORTWATCHER);
