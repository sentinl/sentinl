export default {
  title: 'reporter_title',
  disable: false,
  report: true,
  trigger: {
    schedule: {
      later: 'every 1 hour'
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
          res: '1280x900',
          url: 'http://localhost/app/kibana#/dashboard/Alerts',
          path: '/tmp/',
          params: {
            delay: 5000,
            crop: 'false'
          }
        }
      }
    }
  }
};
