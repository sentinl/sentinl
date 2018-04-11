class WarningAndLog {
  constructor(log, message) {
    this.ok = true;
    this.warning = true;
    this.message = message;
    log.warning(this.message);
  }
}

export default WarningAndLog;
