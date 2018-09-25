export default {
  mappings: require('../server/mappings/sentinl.json'),
  navbarExtensions: [],
  uiSettingDefaults: {
    'sentinl:experimental': {
      value: false,
      description: 'Enable Experimental features in SENTINL'
    },
  },
  app: {
    title: 'Sentinl',
    description: 'Kibana Alert App for Elasticsearch',
    main: 'plugins/sentinl/app',
    icon: 'plugins/sentinl/style/sentinl.svg',
  },
};
