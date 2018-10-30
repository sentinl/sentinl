({
  dashboard: {
    order: 15,
    show: (_, mappings) => false && JSON.stringify(mappings).includes('{"type":"geo_point"}'),
  },
  params: {
    idField: 'id',
    id1: '',
    id2: '',
    locationField: 'location',
    distance: '10',
    direction: 'closer',
    trackingTime: '2',
    trackingUnit: 'hours'
  },
  search: (client, searchParams, params) => {
    const later = require('later');
    const timeField = Object.keys(searchParams.time.range)[0];
    const schedule = later.schedule(later.parse.text(`every ${params.trackingTime} ${params.trackingUnit}`));
    const timeRange = {
      range: {
        [timeField]: {
          gte: schedule.prev(2)[1],
          lte: schedule.next(),
          format: 'date_time'
        }
      }
    };

    function getEntity(id) {
      return client.search({
        index: [searchParams.index],
        body: {
          _source: [params.locationField],
          query: {
            bool: {
              must: [
                timeRange,
                {
                  match: {
                    [params.idField]: id
                  }
                }
              ]
            }
          },
          size: 1,
          sort: [
            {
              [timeField]: {
                order: 'desc'
              }
            }
          ]
        }
      });
    }

    function extractLocation(id, resp) {
      if (!resp.hits.total) {
        throw new Error(`${id} has not sent a location update in the last ${params.trackingTime} ${params.trackingUnit}`);
      }
      return resp.hits.hits[0]._source[params.locationField].split(',');
    }

    function calculateDistance([location1, location2]) {
      const EARTH_RADIUS_TO_KM = 6371;
      const toRad = num => num * Math.PI / 180;

      var dLat = toRad(location2[0] - location1[0]);
      var dLon = toRad(location2[1] - location1[1]);
      var lat1 = toRad(location1[0]);
      var lat2 = toRad(location2[0]);

      var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return +(EARTH_RADIUS_TO_KM * c).toFixed(3);
    }

    return Promise.all([
      getEntity(params.id1).then(resp => extractLocation(params.id1, resp)),
      getEntity(params.id2).then(resp => extractLocation(params.id1, resp)),
    ])
      .then(calculateDistance);
  },
  condition: (distance, searchParams, params) => {
    console.log(`${params.id2} is ${distance} kilometers away from ${params.id1}`);
    return (params.direction === 'further') ? distance > params.distance : distance < params.distance;
  },
  template: `
<div class="row">
  <div class="form-group col-md-6">
    <label>ID Field</label>
    <div class="input-group">
      <div class="input-group-addon">
        <i class="far fa-hashtag" aria-hidden="true"></i>
      </div>
      <select ng-model="params.idField" ng-options="field for field in data.fields" class="form-control"></select>
    </div>
    <span class="help-block">The field that distinguishes the source of a record</span>
  </div>

  <div class="form-group col-xs-6 col-md-3">
    <label>Entity 1</label>
    <input type="text" class="form-control" ng-model="params.id1">
  </div>

  <div class="form-group col-xs-6 col-md-3">
    <label>Entity 2</label>
    <input type="text" class="form-control" ng-model="params.id2">
  </div>
</div>

<div class="row">
  <div class="form-group col-md-6">
    <label>Location Field</label>
    <div class="input-group">
      <div class="input-group-addon">
        <i class="far fa-globe" aria-hidden="true"></i>
      </div>
      <select ng-model="params.locationField" ng-options="field for field in data.geoFields" class="form-control"></select>
    </div>
    <span class="help-block">The field that specifies the location of the entity</span>
  </div>

  <div class="form-group col-md-6">
    <div class="row">
      <div class="col-xs-6">
        <label>Direction</label>
        <select ng-model="params.direction" class="form-control">
          <option value="closer" selected>closer</option>
          <option value="further">further</option>
        </select>
      </div>
      <div class="col-xs-6">
        <label>Distance</label>
        <input type="text" class="form-control" ng-model="params.distance">
      </div>
      <span class="help-block col-sm-12">Trigger if the two entities are {{params.direction}} than {{params.distance}} kilometers.</span>
    </div>
  </div>
</div>

<div class="row">
  <div class="form-group col-md-6">
    <label>Tracking Cooldown</label>
    <div>
      <div style="float: left; width: 50%; padding-right: 15px">
        <input type="text" class="form-control" ng-model="params.trackingTime" style="height: 35px">
      </div>
      <div style="float:left; width: 50%; padding-left: 15px">
        <select ng-model="params.trackingUnit" class="form-control" style="height: 35px">
          <option value="seconds">seconds</option>
          <option value="minutes" selected>minutes</option>
          <option value="hours">hours</option>
          <option value="days">days</option>
          <option value="months">months</option>
          <option value="years">years</option>
        </select>
      </div>
    </div>
    <span class="help-block">Alert if an entity hasn't sent a record in {{params.trackingTime}} {{params.trackingUnit}}</span>
  </div>
</div>
`
});
