<img src="http://i.imgur.com/s4TKpbF.png" width="400"/>

# Siren Investigate & Kibana Alerting & Reporting App

> Watching your data, 24/7/365. 

---
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/77b040968c354d6597ff60a615195a1a)](https://www.codacy.com/app/lorenzo-mangani/sentinl?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=sirensolutions/sentinl&amp;utm_campaign=Badge_Grade)
<img src="https://img.shields.io/badge/kibana-5+-green.svg"/>
<img src="https://img.shields.io/badge/elasticsearch-5.*-green.svg"/>


**SENTINL 6** extends *Siren Investigate* and *Kibana 4.6+* with **Alerting** and **Reporting** functionality to monitor, notify and report on data series changes using standard queries, programmable validators and a variety of configurable actions - Think of it as a free an independent ["Watcher"](https://github.com/sirensolutions/sentinl/wiki/SENTINL-Introduction#what-is-a-watcher) which also has scheduled ["Reporting"](https://github.com/sirensolutions/sentinl/wiki/SENTINL-Report-Example) capabilities (PNG/PDFs snapshots).

**SENTINL** is also designed to simplify the process of creating and managing alerts and reports in Siren Investigate/Kibana via its App and Spy integration, directly in the Siren Investigate/Kibana UI.

<!--<img src="http://i.imgur.com/aDHvUxf.png" width="400" /> -->

<img src="http://i.imgur.com/PsNsAiy.png" />


---

### Siren Investigate/Kibana Alerts Display
SENTINL alerts can easily be displayed back in Kibana dashboards using [saved search](https://user-images.githubusercontent.com/5389745/36902779-f700a1d8-1e2b-11e8-8a02-be97d2e4a0d5.png) visualizations

### Siren Investigate/Kibana Report Snapshots
Boss wants to see charts and reports? SENTINL can grab timed snapshots of Kibana dashboards _(or any other website)_ and deliver them via email using the [report](https://github.com/sirensolutions/sentinl/wiki/SENTINL-Report-Example) action

### Configuration & Usage
Consult our [wiki](https://github.com/sirensolutions/sentinl/wiki) to learn how to configure and use **SENTINL** and program awesome Watchers

--------------

## App Installation

**ATTENTION** If you use it with Siren Investigate, don't install SENTINL, always use SENTINL bundled inside the distribution.

#### Snapshot Plugin Install (substitute 6.2.2 with your Kibana version)
<pre>
/opt/kibana/bin/kibana-plugin install https://github.com/sirensolutions/sentinl/releases/download/tag-6.2.2/sentinl-v6.2.2.zip
</pre>

#### Gulp Plugin Install
<pre>
git clone https://github.com/sirensolutions/sentinl
cd sentinl && npm install && gulp package --version=6.2.2
/opt/kibana/bin/kibana-plugin install file:///`pwd`/target/gulp/sentinl.zip
</pre>

#### Dev Plugin Remove
<pre>
/opt/kibana/bin/kibana-plugin remove sentinl
</pre>




## Project Status 

* Working Status, more testers needed!
  * Please [report](https://github.com/sirensolutions/sentinl/issues) any ideas, bug reports and findings
* Contributors Needed! If you know angular and elasticsearch, consider joining us!
 


 
## License
<pre>
This software is licensed under the Apache License, version 2 ("ALv2"), quoted below.

Copyright 2016, 2017, 2018 Siren Solutions
Copyright 2016, 2017, 2018 QXIP BV, Lorenzo Mangani (lorenzo.mangani@gmail.com)
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

<img src="https://img.shields.io/github/license/sirensolutions/sentinl.svg"/>
<img src="https://img.shields.io/badge/made%20with-love-red.svg"/>
