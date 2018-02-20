 /**
 * Stores a Sentinl Watcher log and returns the query response.
 *
 * @param {Server} server   - A Kibana Server instance.
 * @param {Client} client   - An Elasticsearch Client instance.
 * @param {Config} config   - A Kibana config instance.
 * @param {String} type     - A SENTINL Log Type.
 * @param {String} message  - A SENTINL Log Message Body.
 * @param {String} loglevel - A SENTINL Log Level.
 * @param {String} payload  - A SENTINL Log JSON Payload.
 * @param {Bool}   isReport - An optional boolean defining reports.
 * @param {string} object   - An optional base64 attachment object.
 *
 * @return {String} Response.
 */
import Log from './log';

export default function logEvent(server, client, config, watcherTitle, type, message, loglevel, payload, isReport, object) {
  const log = new Log(config.app_name, server, 'log_history');

  if (!loglevel) {
    loglevel = 'INFO';
  }
  if (!payload) {
    payload = {};
  }
  if (!isReport) {
    isReport = false;
  }
  log.debug(`storing alarm to Elasticsearch, type: ${type}`);
  const indexDate = '-' + new Date().toISOString().substr(0, 10).replace(/-/g, '.');
  const indexName = config.es.alarm_index ? config.es.alarm_index + indexDate : `${config.es.alarm_index}${indexDate}`;
  const indexBody = {
    '@timestamp': new Date().toISOString(),
    watcher: watcherTitle,
    level: loglevel,
    message: message,
    action: type,
    payload: payload,
    report: isReport
  };

  if (object) {
    indexBody.attachment = object;
  }

  client.index({
    index: indexName,
    type: type,
    body: indexBody
  }).then(function (resp) {
    log.debug(`alarm stored successfully to Elasticsearch, type: [${type}]`);
  }).catch(function (err) {
    log.error(`fail to store alarm: ${err}`);
  });

}
