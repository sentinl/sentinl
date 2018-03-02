<img src="http://i.imgur.com/s4TKpbF.png" width="300"/>

### Siren Investigate & Kibana Alerting & Reporting App

> Watching your data, 24/7/365. 

---
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/77b040968c354d6597ff60a615195a1a)](https://www.codacy.com/app/qxip/SENTINL?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=sirensolutions/sentinl&amp;utm_campaign=Badge_Grade)
<img src="https://img.shields.io/badge/kibana-6+-green.svg"/>
<img src="https://img.shields.io/badge/elasticsearch-6.*-green.svg"/>


**SENTINL 6** extends *Siren Investigate* and *Kibana* with **Alerting** and **Reporting** functionality to monitor, notify and report on data series changes using standard queries, programmable validators and a variety of configurable actions - Think of it as a free an independent ["Watcher"](https://github.com/sirensolutions/sentinl/wiki/SENTINL-Introduction#what-is-a-watcher) which also has scheduled ["Reporting"](https://github.com/sirensolutions/sentinl/wiki/SENTINL-Report-Example) capabilities (PNG/PDFs snapshots).

**SENTINL** is also designed to simplify the process of creating and managing alerts and reports in Siren Investigate/Kibana `6.x` via its native App Interface, or by using native watcher tools in Kibana `6.x+`.

<!--<img src="http://i.imgur.com/aDHvUxf.png" width="400" /> -->

<img src="https://user-images.githubusercontent.com/5389745/36905512-d83083b0-1e33-11e8-9ff0-c8be94b493ef.png" />


---

### Event History
Alerts and Reports can easily be tracked and displayed in Kibana Charts, Widgets or Chart Annotations
![sentinl_annotation](https://user-images.githubusercontent.com/1423657/36197513-3ed7dd1a-1174-11e8-92e0-65c630ae63b9.gif)

### Visual Snapshots
Boss wants to see charts and reports? Use Reports to create timed snapshots of Kibana dashboards _(or any other website)_ at a set date or condition, and deliver them as email attachments.

### Help & Documentation
Documentation, Examples and Guides are available at [sentinl.readthedocs.io](http://sentinl.readthedocs.io)


--------------

## App Installation

#### **ATTENTION** Siren 10 users should use the native version bundled with their distribution!

#### Snapshot Plugin Install
Use this example and substitute 6.2.2 with your _actual_ Kibana version or manually pick a [release](https://github.com/sirensolutions/sentinl/releases)
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


### Project Status 

* Production Ready w/ thousands of deployments
* Please help us by starring the Project
* Contributors Needed! Please consider joining us!

### Issues & Bugs
Please [report](https://github.com/sirensolutions/sentinl/issues) any ideas, bug reports and findings on the repository.
 


 
## License
<pre>
This software is licensed under the Apache License, version 2 ("ALv2"), quoted below.

Copyright 2016, 2018 Siren Solutions
Copyright 2016, 2018 QXIP BV
Copyright 2015, Lorenzo Mangani (lorenzo.mangani@gmail.com), Rao Chenlin (rao.chenlin@gmail.com)

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

<img src="https://img.shields.io/badge/made%20with-love-red.svg"/>
