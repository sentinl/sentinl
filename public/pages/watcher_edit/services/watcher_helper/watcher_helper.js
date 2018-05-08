class WatcherHelper {
  isScheduleModeEvery(scheduleString) {
    return !!scheduleString.match(/every\s(\d+)\s(seconds|minutes|hours|days|months|years)/);
  }
}

export default WatcherHelper;
