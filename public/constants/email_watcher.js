export default {
  title: 'watcher_title',
  disable: false,
  report: false,
  trigger: {
    schedule: {
      later: 'every 5 minutes'
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
    email_admin: {
      throttle_period: '1m',
      email: {
        subject: 'Alarm',
        priority: 'high',
        body: 'Found {{payload.hits.total}} Events'
      }
    }
  }
};
