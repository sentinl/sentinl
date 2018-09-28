/**
 * Stores a Sentinl Watcher log and returns the query response.
 */
import Log from './log';
import getConfiguration from './get_configuration';
import getElasticsearchClient from './get_elasticsearch_client';

async function logHistory({
  server,
  watcherTitle,
  actionName,
  message,
  level = 'info',
  isReport = false,
  isError = false,
  attachment = null,
  payload = null,
}) {
  const config = getConfiguration(server);
  const client = getElasticsearchClient({server, config});

  const log = new Log(config.app_name, server, 'log_history');
  log.debug(`storing alarm to Elasticsearch, action: ${actionName}`);

  const body = {
    '@timestamp': new Date().toISOString(),
    error: isError,
    report: isReport,
    watcher: watcherTitle,
    action: actionName || 'unknown action',
    level,
    message
  };

  if (attachment) {
    body.attachment = attachment;
  }

  if (payload) {
    body.payload = payload;
  }

  try {
    return await client.index({
      index: config.es.alarm_index + '-' + new Date().toISOString().substr(0, 10).replace(/-/g, '.'),
      type: config.es.alarm_type,
      body
    });
  } catch (err) {
    throw new Error('store alarm: ' + err.toString());
  }
}

export default logHistory;
