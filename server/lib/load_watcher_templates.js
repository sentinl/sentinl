import fs from 'fs';
import path from 'path';
import kibiUtils from 'kibiutils';
import Log from './log';
import { find } from 'lodash';

const watcherTemplates = [
  'new-results',
  'geo-fence',
  'proximity',
];

async function loadTemplate(scriptFilename, existingScripts, savedObjectsClient, savedObjectsAPI, log) {
  const scriptDefinition = require(path.join(__dirname, 'watcherTemplates', scriptFilename + '.json'));
  scriptDefinition.scriptSource = fs.readFileSync(path.join(__dirname, 'watcherTemplates', scriptFilename + '-source' + '.js'), 'utf-8');

  const id = kibiUtils.slugifyId(scriptDefinition.title);

  // if we find the script already loaded just skip it, a migration will kick in if necessary.
  if (find(existingScripts.saved_objects, { id })) {
    return;
  }

  try {
    await savedObjectsClient.create('script', scriptDefinition, { id }, savedObjectsAPI.getServerCredentials());
  } catch (error) {
    if (error.statusCode === 409) {
      log.info(`Script [${id}] already exists`);
    } else {
      error.message = `Could not load script [${id}]: ` + error.message;
      throw error;
    }
  }

  log.debug(`Script [${id}] successfully loaded`);
}

async function loadWatcherTemplates(server, config) {
  const log = new Log(config.app_name, server, 'load_watcher_templates');

  const savedObjectsClient = server.savedObjectsClientFactory({
    callCluster: server.plugins.elasticsearch.getCluster('admin')
  });
  const savedObjectsAPI = server.plugins.saved_objects_api;

  let format;
  try {
    format = await savedObjectsClient.getDocumentFormat(savedObjectsAPI.getServerCredentials());
  } catch (err) {
    log.error('An error occurred checking for Elasticsearch version: ', err);
    return;
  }

  if (format.statusCode === 404 || (format.statusCode === 200 && format.version === '6')) {
    // If ES6 format or empty Elasticsearch
    log.info('Loading watcher templates');
    const existingScripts = await savedObjectsClient.find({
      type: 'script',
      perPage: 1000
    });
    await Promise.all(watcherTemplates.map(filename => loadTemplate(filename, existingScripts, savedObjectsClient, savedObjectsAPI, log)));
  } else if (format.version === '5') {
    log.info('Skipping loading of scripts to let migrations run first');
  } else {
    log.error('Could not check Elasticsearch version');
  }
}

module.exports = loadWatcherTemplates;
