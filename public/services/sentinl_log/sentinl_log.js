class SentinlLog {
  constructor($log) {
    this.$log = $log;
  }

  initLocation(locationName) {
    this.locationName = locationName;
  }

  warn(...args) {
    this.$log.warn([this.locationName], ...args);
  }

  error(...args) {
    this.$log.error([this.locationName], ...args);
  }

  debug(...args) {
    this.$log.debug([this.locationName], ...args);
  }

  info(...args) {
    this.$log.info([this.locationName], ...args);
  }
}

export default SentinlLog;
