export default function timefilterFactory(angularInjector) {
  let timefilter;

  if (angularInjector.has('timefilter')) { // Kibana v5.6-6.2
    timefilter = angularInjector.get('timefilter');
  } else {
    timefilter = require('ui/timefilter').timefilter; // Kibana v6.3+
  }

  timefilter.enable = (isEnabled = true) => {
    if (timefilter.enableAutoRefreshSelector) { // Kibana v6.2.4+
      if (isEnabled) {
        timefilter.enableAutoRefreshSelector();
        timefilter.enableTimeRangeSelector();
      } else {
        timefilter.disableAutoRefreshSelector();
        timefilter.disableTimeRangeSelector();
      }
    } else { // Kibana v5.6
      timefilter.enabled = isEnabled;
    }
  };

  if (!timefilter.getTime) { // Kibana v5.6-6.2
    timefilter.getTime = () => timefilter.time;
  }

  return timefilter;
}
