import { stripObjectPropertiesByNameRegex } from '../../lib/sentinl_helper';
import { isEmpty, forEach, isString, isObject, get, pick, omit, cloneDeep } from 'lodash';

const WATCHER_SRC_FIELDS = [
  'actions', 'input', 'condition', 'transform', 'trigger', 'disable', 'report', 'title', 'wizard',
  'save_payload', 'spy', 'impersonate', 'username', 'password', 'dashboard_link', 'custom'
];

class SentinlHelper {
  stripObjectPropertiesByNameRegex(obj, nameRegexp) {
    stripObjectPropertiesByNameRegex(obj, nameRegexp);
  }

  pickWatcherSource(watcher, fields = WATCHER_SRC_FIELDS) {
    return pick(watcher, fields);
  }

  omitWatcherSource(watcher, fields = WATCHER_SRC_FIELDS) {
    return omit(watcher, fields);
  }

  firstLetterToUpperCase(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  getFieldsFromMappings(mapping) {
    const result = {
      date: [],
      text: [],
      numeric: [],
    };

    if (!isObject(mapping) || isEmpty(mapping)) {
      return result;
    }

    if (!mapping.properties) {
      return this.getFieldsFromMappings(mapping[Object.keys(mapping)[0]]);
    }

    const dataTypes = {
      date: ['date'],
      text: ['text', 'keyword', 'string'],
      numeric: [
        'long', 'integer', 'short', 'byte',
        'double', 'float', 'half_float', 'scaled_float'
      ],
    };

    (function getFields(mapping, fieldAccumulator = '') {
      if (isString(mapping)) {
        forEach(dataTypes, (type, typeName) => {
          if (type.includes(mapping)) {
            if (!result[typeName].includes(fieldAccumulator)) {
              result[typeName].push(fieldAccumulator);
              return;
            }
          }
        });
      }

      if (isObject(mapping)) {
        forEach(mapping, (children, curentFieldName) => {
          let field = fieldAccumulator;
          if (!['properties', 'fields', 'type'].includes(curentFieldName)) {
            field = field ? field + '.' + curentFieldName : curentFieldName;
          }
          getFields(children, field);
        });
      }
    }(mapping.properties));

    return result;
  }
}

export default SentinlHelper;
