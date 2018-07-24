/**
 * Stores a Sentinl Watcher log and returns the query response.
 *
 * @param {object} server - kibana server instance
 * @param {object} client - elasticsearch client instance
 * @param {object} config of sentinl
 * @param {string} actiontype - sentinl action type
 * @param {string} message  - sentinl log message body
 * @param {string} level - sentinl log level
 * @param {object} payload - sentinl json payload
 * @param {boolean} report - enabling reports
 * @param {string} object - optional base64 attachment object (screenshot for report)
 *
 * @return {object} elasticsearch response.
 */
import Log from './log';
import getConfiguration from './get_configuration';
import getElasticsearchClient from './get_elasticsearch_client';

async function logEvent({server, watcherTitle, actionName, message, level, payload, report, object} = {}) {
  const config = getConfiguration(server);
  const client = getElasticsearchClient({server, config});

  level = level || 'INFO';
  payload = payload || {};
  report = report || false;

  const log = new Log(config.app_name, server, 'log_history');
  log.debug(`storing alarm to Elasticsearch, action: ${actionName}`);

  const doc = {
    type: config.es.alarm_type,
    date: '-' + new Date().toISOString().substr(0, 10).replace(/-/g, '.'),
    body: {
      '@timestamp': new Date().toISOString(),
      watcher: watcherTitle,
      level,
      message,
      action: actionName,
      payload,
      report,
    },
  };

  doc.index = config.es.alarm_index + doc.date;
  if (object) {
    doc.body.attachment = object;
  }

  try {
    return await client.index({index: doc.index, type: doc.type, body: doc.body});
  } catch (err) {
    log.error(err);
    throw new Error(`fail to store alarm ${watcherTitle}, action ${actionName}`);
  }
}

export default logEvent;
