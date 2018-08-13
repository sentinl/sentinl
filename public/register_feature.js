import { FeatureCatalogueRegistryProvider, FeatureCatalogueCategory } from 'ui/registry/feature_catalogue';

FeatureCatalogueRegistryProvider.register(() => {
  return {
    id: 'sentinl',
    title: 'Sentinl',
    description: 'Generate Alerts and Reports based on recurring queries and results analysis.',
    icon: '/plugins/kibana/assets/app_discover.svg',
    path: '/app/sentinl',
    showOnHomePage: true,
    category: FeatureCatalogueCategory.DATA
  };
});
