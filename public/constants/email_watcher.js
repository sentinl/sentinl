export default {
  title: 'watcher_title',
  disable: false,
  report: false,
  save_payload: false,
  spy: false,
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
      script: 'payload.hits.total > 100'
    }
  },
  actions: {
    email_admin: {
      throttle_period: '15m',
      email: {
        stateless: false,
        to: 'alarm@localhost',
        from: 'sentinl@localhost',
        subject: 'Alarm',
        priority: 'high',
        body: 'Found {{payload.hits.total}} Events'
      }
    }
  }
};
