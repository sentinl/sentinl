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
  */
  info(message, object = null) {
    this._message('info', message, object);
  }

  /**
  * Debug message
  *
  * @param {string} message
  * @param {object} object to prettify
  */
  debug(message, object = null) {
    this._message('debug', message, object);
  }

  /**
  * Warning message
  *
  * @param {string} message
  * @param {object} object to prettify
  */
  warning(message, object = null) {
    this._message('warning', message, object);
  }

  /**
  * Error message
  *
  * @param {string} message
  * @param {object} object to prettify
  */
  error(message, object = null) {
    this._message('error', message, object);
  }

  /**
  * Prettify object
  *
  * @param {object} object to prettify
  * @return {string} stringified object
  */
  _pretty(object) {
    return JSON.stringify(object, null, 2);
  }

  /**
  * Display message in console
  *
  * @param {string} type of message
  * @param {string} message
  * @param {object} object to prettify
  */
  _message(type, message, object) {
    let prefix = [type, this.appName];
    if (this.place) {
      prefix.push(this.place);
    }
    if (object) {
      message += `, ${this._pretty(object)}`;
    }
    this.server.log(prefix, message);
  }
}

export default Log;
