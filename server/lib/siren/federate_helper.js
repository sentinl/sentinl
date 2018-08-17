function federateIsAvailable(server) {
  const elasticsearchPlugins = server.config().get('investigate_core.clusterplugins');
  return ['siren-vanguard', 'siren-federate'].some((p) => elasticsearchPlugins.includes(p));
}

function getClientMethod(client) {
  for (let method of ['investigate_search', 'kibi_search', 'vanguard_search', 'search', 'siren_search']) {
    if (client[method]) {
      return method;
    }
  }
}

export default {
  federateIsAvailable,
  getClientMethod
};
