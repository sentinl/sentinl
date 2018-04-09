class ErrorAndLog extends Error {
  constructor(log, err, message, ...params) {
    super(message, ...params);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ErrorAndLog);
    }

    this.log = log;
    this.err = err;
    this.date = new Date();
    this.log.error(message, err);
  }
}

export default ErrorAndLog;
