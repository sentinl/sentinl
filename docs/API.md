# SENTINL API

(work in progress)

### Execute API
The ```execute``` API forces the execution of an existing or saved SENTINL watch outside of its triggering logic, or to simulate the watch execution during development.

#### Requirements
For CURL usage, Kibi/Kibana options should include ```server.xsrf.disableProtection: true```

#### Usage
The following examples assume an existing Watcher with id ```yccmk929mma-zbzolg4b9r-9vdj0k4hxv9``` exists. 

##### Users
```
POST  http://kibana:5601/api/sentinl/watcher/_execute/yccmk929mma-zbzolg4b9r-9vdj0k4hxv9
```
##### Developers
```
  $http.post('../api/sentinl/watcher/_execute/yccmk929mma-zbzolg4b9r-9vdj0k4hxv9', {
    trigger: 4,
    throttle: 2,
    recover: 10000
  })  
  .then(function (resp) {
    console.log(resp);
  })  
  .catch(function (err) {
    console.log(err);
  }); 
```
