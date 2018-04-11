import {isObject, isError} from 'lodash';

class Log {
  /**
  * Constructor
  *
  * @param {string} appName
  * @param {object} server of Kibana/Investigate
  * @param {string} place where instantiated
  */
  constructor(appName, server, place) {
    this.appName = appName;
    this.server = server;
    this.place = place;
  }

  /**
  * Info message
  *
  * @param {string} message
  * @param {object|string} err
  */
  info(message, err = null) {
    this._message('info', message, err);
  }

  /**
  * Debug message
  *
  * @param {string} message
  * @param {object|string} err
  */
  debug(message, err = null) {
    this._message('debug', message, err);
  }

  /**
  * Warning message
  *
  * @param {string} message
  * @param {object|string} err
  */
  warning(message, err = null) {
    this._message('warning', message, err);
  }

  /**
  * Error message
  *
  * @param {string} message
  * @param {object|string} err
  */
  error(message, err = null) {
    this._message('error', message, err);
  }

  /**
  * Display message in console
  *
  * @param {string} type of message
  * @param {string} message
  * @param {object|string} err
  */
  _message(type, message, err) {
    let prefix = [type, this.appName];

    if (this.place) {
      prefix.push(this.place);
    }

    if (err && isError(err)) {
      message += ': ' + err.message;
    } else if (err && isObject(err)) {
      message += ': ' + JSON.stringify(err);
    } else if (err) {
      message += ': ' + err;
    }

    this.server.log(prefix, message);
  }
}

export default Log;
