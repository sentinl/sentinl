export default {
  baseDir: __dirname,
  bulk: [{
    indexName: '.siren',
    indexDefinition: 'index_definition.js',
    source: 'index_data1.js',
    haltOnFailure: true
  }]
};
