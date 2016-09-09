<img src="http://i.imgur.com/o25tuAG.png" width="300"/>

# Kibana Alert App for Elasticsearch <img src="https://camo.githubusercontent.com/15f26c4f603cac9bf415c841a8a60077f6db5102/687474703a2f2f696d6775722e636f6d2f654c446f4f4b592e706e67">

> Data Series are awesome, but who's Watching them 24/7/365? Introducing KaaE, the Kibana Watcher

---

<img src="https://img.shields.io/badge/kibana-4.5+-yellow.svg"/>
<img src="https://img.shields.io/badge/elasticsearch-*-yellow.svg"/>


### Kibana App: Kaae
**KaaE** extends *Kibana* to provide a free an independent  ["watcher"](https://www.elastic.co/guide/en/watcher/current/introduction.html) alternative based on the same principles and useful to monitor and alert on data series changes.

**KaaE** is designed to simplify the process of creating and managing alerts in Kibana, while retaining *logic compatibility* with the Elastic's own ```_watcher``` where possible

<!--<img src="http://i.imgur.com/aDHvUxf.png" width="400" /> -->

<img src="http://i.imgur.com/sheqvAc.gif" />

---

### Kibana Plugin: Kaae Spy
The Kaae integrated Kibana plug-in extends the default Spy functionality to shape new prototype Watchers based on Visualize queries, and providing them to Kaae for fine editing and scheduling.
<img src="http://i.imgur.com/4lDTOVR.png" />


## KAAE Watcher Anatomy

  * Trigger
    * Schedule
  * Input
    * Search
  * Condition
    * Script
  * Transform
  * Action
    * Actions
   
For examples and details refer to the project [Wiki](https://github.com/elasticfence/kaae/wiki)

#### Alarm Actions
Currently supported __"actions"__ for KaaE watchers:

   * Elasticsearch Index (stable)
   * Console (stable)
   * Email/SMTP (testers needed!)
   * Slack (testers needed!)

<img src="http://i.imgur.com/abOO76s.png"> 

#### Configuration
KaaE configuration is still in development!<br>
Current settings can be configured/restored on each execution in ```/opt/kibana/installedPlugins/kaae/kaae.json```

--------------

## Installation

#### Snapshot Plugin Install
<pre>
/opt/kibana/bin/kibana plugin --install kaae -u https://github.com/elasticfence/kaae/releases/download/snapshot/kaae-latest.tar.gz
</pre>

#### Dev Plugin Install
<pre>
git clone https://github.com/elasticfence/kaae
cd kaae && npm install && npm run package
/opt/kibana/bin/kibana plugin --install kaae -u file://`pwd`/kaae-latest.tar.gz
</pre>

#### Dev Plugin Remove
<pre>
/opt/kibana/bin/kibana plugin -r kaae
</pre>


## Status 

* Work in progress! Please [report](https://github.com/elasticfence/kaae/issues) any ideas, bugs and findings
* Contributors Needed! If you know angular and elasticsearch join us!
 

##### TODO/DONE (live)

- [x] Background watcher load/execution skeleton  _(Kaae core)_
- [x] Kibana plugin to extend SPY and generate Watchers  _(Kibana plugin)_
- [x] JSON editors for watcher rules _(Sense-like)_
- [x] Save & load watcher history & results to/from elasticsearch custom indices _(init)_
- [x] Add/Edit/Delete for watcher rules rows _(es queries)_
- [x] Actions for watcher triggers beyond console _(email, slack, etc)_
- [x] Dynamic reload of watchers on add/edit _(Kaae core)_
- [ ] User configuration for action preferences _(email server, slack hooks, etc)_
- [ ] Extend Spy plugin with more action types, options
- [ ] Major Code & Style cleanup _(help welcome!)_
 
## License
<pre>
This software is licensed under the Apache License, version 2 ("ALv2"), quoted below.

Copyright 2016, Lorenzo Mangani (lorenzo.mangani@gmail.com)
Copyright 2015, Rao Chenlin (rao.chenlin@gmail.com)

Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
</pre>

<img src="https://img.shields.io/github/license/elasticfence/kaae.svg"/>
<img src="https://img.shields.io/badge/made%20with-love-red.svg"/>
<img src="https://img.shields.io/badge/edited%20with-nano-blue.svg"/>
