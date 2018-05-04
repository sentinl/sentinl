export default {
  title: 'reporter_title',
  disable: false,
  report: true,
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
    report_admin: {
      throttle_period: '15m',
      report: {
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
