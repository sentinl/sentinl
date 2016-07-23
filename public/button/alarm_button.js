/*
	// Top Bar placement
	require('ui/registry/chrome_nav_controls').register(function () {
	  return {
	    name: 'alarm button',
	    order: 1000,
	    template: require('plugins/kaae/button/alarm_button.html')
	  };
	});
*/

const linkReqRespStats = function ($scope, config) {
  $scope.$bind('req', 'searchSource.history[searchSource.history.length - 1]');
  $scope.$watchMulti([
    'req',
    'req.started',
    'req.stopped',
    'searchSource'
  ], function () {
    if (!$scope.searchSource || !$scope.req) return;

    const req = $scope.req;
    const resp = $scope.req.resp;
    const stats = $scope.stats = [];

    if (resp && resp.took != null) stats.push(['Query Duration', resp.took + 'ms']);
    if (req && req.ms != null) stats.push(['Request Duration', req.ms + 'ms']);
    if (resp && resp.hits) stats.push(['Hits', resp.hits.total]);

    if (req.fetchParams) {
      if (req.fetchParams.index) stats.push(['Index', req.fetchParams.index]);
      if (req.fetchParams.type) stats.push(['Type', req.fetchParams.type]);
      if (req.fetchParams.id) stats.push(['Id', req.fetchParams.id]);
    }

    const alarm = $scope.alarm = {
	  "_index": "watcher",
	  "_type": "watch",
	  "_id": "new_saved",
	  "_score": 1,
	  "_source": {
	    "trigger": {
	      "schedule": {
	        "interval": "60"
	      }
	    },
	    "input": {
	      "search": {
	        "request": {
	          "indices": [],
	          "body": req.fetchParams.body,
	        }
	      }
	    },
	    "condition": {
	      "script": {
	        "script": "payload.hits.total > 100"
	      }
	    },
	    "transform": {},
	    "actions": {
	      "email_admin": {
	        "throttle_period": "15m",
	        "email": {
	          "to": "alarm@localhost",
	          "subject": "Kaae Alarm",
	          "priority": "high",
	          "body": "Found {{payload.hits.total}} Events"
	        }
	      }
	    }
	  }
	};

	window.localStorage.setItem('kaae_saved_query', JSON.stringify(alarm));

  });
};



// Spy Placement
require('ui/registry/spy_modes').register(function () {
  return {
    display: 'Set Alarm',
    name: 'setalarm',
    order: 1000,
    link: linkReqRespStats,
    template: require('plugins/kaae/button/alarm_spy.html')
  };
});

