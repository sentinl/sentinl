import { has } from 'lodash';
import later from 'later';
import moment from 'moment';
import WarningAndLog from './messages/warning_and_log';
import SuccessAndLog from './messages/success_and_log';
import WatcherHandler from './watcher_handler';
import sirenFederateHelper from './siren/federate_helper';
import apiClient from './api_client';

/**
* Helper class to handle watchers
*/
export default class CustomWatcherHandler extends WatcherHandler {
  constructor(server, client, config) {
    super(server, client, config);
    // Use Elasticsearch API because Kibana savedObjectsClient
    // can't be used without session user from request
    this._client = apiClient(server, 'elasticsearchAPI');
    this.savedObjectsClient = this.server.savedObjectsClientFactory({
      callCluster: this.server.plugins.elasticsearch.getCluster('admin')
    });
  }

  getWatchersTemplate(title) {
    const req = this.server.plugins.saved_objects_api.getServerCredentials();
    if (req) {
      req.auth = {
        credentials: {
          roles: ['sirenalert']
        }
      };
    }
    return this.savedObjectsClient.find({
      type: 'script',
      search: title,
      searchFields: ['title']
    }, req)
      .then(resp => {
        const template = resp.saved_objects.find(savedObject => savedObject.attributes.title === title);
        if (!template) {
          throw new Error(`Could not find customer watcher type ${title}`);
        } else {
          return template.attributes;
        }
      });
  }

  /**
   * Execute watcher.
   *
   * @param {object} task - Elasticsearch watcher object
   * @param {boolean} async - Whether or not to calculate search query time range asynchronously
   */
  async execute(task, { async = false } = {}) {
    try {
      const templateScript = await this.getWatchersTemplate(task.custom.type);

      const template = eval(templateScript.scriptSource); // eslint-disable-line no-eval

      if (this.config.settings.authentication.impersonate || task.impersonate) {
        await this._client.impersonate(task.id);
      }
      const client = {
        search: ({ index, body }) => this._client.search({ index, body: this._translateToEs(body) })
      };

      const searchParams = {
        defaultRequest: this.createDefaultRequest(task.input.search.request, task.trigger.schedule.later, async),
        ...task.input.search.request
      };

      const response = await template.search(client, searchParams, task.custom.params);
      const condition = template.condition(response, searchParams, task.custom.params);

      if (condition) {
        this.doActions(response, this.server, task.actions, task);
        return new SuccessAndLog(this.log, 'successfuly executed');
      } else {
        return new WarningAndLog(this.log, 'no data satisfy condition');
      }

    } catch (err) {
      this._client.logAlarm({
        watcherTitle: task.title,
        message: 'execute custom watcher: ' + err.toString(),
        level: 'high',
        isError: true,
      });
      err.message = 'execute custom watcher: ' + err.message;
      throw err;
    }
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
