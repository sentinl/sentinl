class SuccessAndLog {
  constructor(log, message, data) {
    this.ok = true;
    this.success = true;
    this.payload = data && data.payload || null;
    this.message = message;
    log.info(this.message);
  }
}

export default SuccessAndLog;
