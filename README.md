<img src="http://i.imgur.com/o25tuAG.png" width="300"/>

# Kibana Alert App for Elasticsearch <img src="https://camo.githubusercontent.com/15f26c4f603cac9bf415c841a8a60077f6db5102/687474703a2f2f696d6775722e636f6d2f654c446f4f4b592e706e67">

> Data Series are awesome, but who's Watching them 24/7/365? Introducing KaaE, the Kibana Watcher

---

<img src="https://img.shields.io/badge/kibana-4.5+-yellow.svg"/>
<img src="https://img.shields.io/badge/elasticsearch-*-yellow.svg"/>


### Kibana App: Kaae
**KaaE** extends *Kibana* to provide a free an independent  ["watcher"](https://www.elastic.co/guide/en/watcher/current/introduction.html) and alternative for Alerting and Reporting, based on the same principles and useful to monitor and alert on data series changes using a variety of configurable actions.

**KaaE** is also designed to simplify the process of creating and managing alerts in Kibana, while recycling baseling *logic and format compatibility* with the Elastic's own ```_watcher```

<!--<img src="http://i.imgur.com/aDHvUxf.png" width="400" /> -->

<img src="http://i.imgur.com/sheqvAc.gif" />

---

### Kibana Plugin: Kaae Spy
The Kaae integrated Kibana plug-in extends the default Spy functionality to shape new prototype Watchers based on Visualize queries, and providing them to Kaae for fine editing and deployment.
<img src="http://i.imgur.com/4lDTOVR.png" />

---

### Kibana Alerts Display
KaaE alerts can easily be displayed back in Kibana dashboards using [saved search](https://github.com/elasticfence/kaae/wiki/KAAE-Alerts-in-Dashboard) visualizations

### Kibana Report Snapshots
KaaE alerts can take timed snapshots of Kibana dashboards or any other website using the ```report``` action *(beta)*


--------------

## App Installation

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

## Configuration & Usage

Consult our [wiki](https://github.com/elasticfence/kaae/wiki) to learn how to configure and use **KaaE** and program awesome Watchers


## Project Status 

* Working Status, more testers needed!
  * Please [report](https://github.com/elasticfence/kaae/issues) any ideas, bug reports and findings
* Contributors Needed! If you know angular and elasticsearch, consider joining us!
 


 
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
