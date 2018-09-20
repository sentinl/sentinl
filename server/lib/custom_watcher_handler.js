import { has } from 'lodash';
import later from 'later';
import moment from 'moment';
import WarningAndLog from './messages/warning_and_log';
import SuccessAndLog from './messages/success_and_log';
import WatcherHandler from './watcher_handler';
import kibiUtils from 'kibiutils';
import logHistory from './log_history';
import sirenFederateHelper from './siren/federate_helper';

/**
* Helper class to handle watchers
*/
export default class CustomWatcherHandler extends WatcherHandler {
  constructor(server, client, config) {
    super(server, client, config);
  }

  async getWatchersTemplate(type) {
    const savedObjectsClient = this.server.savedObjectsClientFactory({
      callCluster: this.server.plugins.elasticsearch.getCluster('admin')
    });
    const savedObjectsAPI = this.server.plugins.saved_objects_api;
    return savedObjectsClient.get('script', kibiUtils.slugifyId(type), savedObjectsAPI.getServerCredentials())
      .then(resp => resp.attributes);
  }

  /**
   * Execute watcher.
   *
   * @param {object} task - Elasticsearch watcher object
   * @param {boolean} async - Whether or not to calculate search query time range asynchronously
   */
  async execute(task, { async = false } = {}) {
    try {
      const templateScript = await this.getWatchersTemplate(task._source.custom.type);

      const template = eval(templateScript.scriptSource); // eslint-disable-line no-eval

      if (this.config.settings.authentication.impersonate || task._source.impersonate) {
        this.client = await this.getImpersonatedClient(task._id);
      }
      const client = { search: this.client[this.getAvailableSearchMethod()].bind(this.client) };

      const searchParams = {
        defaultRequest: this.createDefaultRequest(task._source.input.search.request, task._source.trigger.schedule.later, async),
        ...task._source.input.search.request
      };

      const response = await template.search(client, searchParams, task._source.custom.params);
      const condition = template.condition(response, searchParams, task._source.custom.params);

      if (condition) {
        this.doActions(response, this.server, task._source.actions, task);
        return new SuccessAndLog(this.log, 'successfuly executed');
      } else {
        return new WarningAndLog(this.log, 'no data satisfy condition');
      }

    } catch (err) {
      logHistory({
        server: this.server,
        watcherTitle: task._source.title,
        message: 'execute wizard watcher: ' + err.toString(),
        level: 'high',
        isError: true,
      });
      err.message = 'execute wizard watcher: ' + err.message;
      throw err;
    }
  }

  getAvailableSearchMethod() {
    let method = 'search';
    try {
      if (sirenFederateHelper.federateIsAvailable(this.server)) {
        method = sirenFederateHelper.getClientMethod(this.client);
      }
    } catch (err) {
      this.log.warning('Siren federate: "elasticsearch.plugins" is not available when running from kibana: ' + err.toString());
    }
    return method;
  }

  createDefaultRequest(searchParams, textSchedule, async) {
    const timeField = Object.keys(searchParams.time.range)[0];
    const schedule = later.schedule(later.parse.text(textSchedule));

    let start = moment(schedule.prev(2)[1]);
    let end = moment(schedule.prev(2)[0]);
    if (async) {
      start = moment().subtract(end - start);
      end = moment();
    }
    searchParams.time.range[timeField] = {
      gt: start.toISOString(),
      lte: end.toISOString(),
      format: 'date_time'
    };

    const body = {
      query: {
        bool: {
          must: [searchParams.time],
          must_not: []
        }
      },
      size: 10000
    };

    if (searchParams.queries) {
      body.query.bool.must.push(...searchParams.queries);
    } else {
      body.query.bool.must.push({ match_all: {} });
    }

    searchParams.filters
      .filter(filter => !filter.meta.disabled)
      .forEach(filter => {
        let filterQuery;
        if (filter.join_sequence) {
          filter.meta.type = 'join_sequence';
        }

        switch (filter.meta.type) {
          case 'phrase':
            filterQuery = filter.query;
            break;
          default:
            filterQuery = {
              [filter.meta.type]: filter[filter.meta.type]
            };
        }

        if (filter.meta.negate) {
          body.query.bool.must_not.push(filterQuery);
        } else {
          body.query.bool.must.push(filterQuery);
        }
      });

    return {
      index: [searchParams.index],
      body
    };
  }
}
