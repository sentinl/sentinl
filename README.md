<img src="http://i.imgur.com/aDHvUxf.png" />
# Kibana Alert App for Elasticsearch <img src="https://camo.githubusercontent.com/15f26c4f603cac9bf415c841a8a60077f6db5102/687474703a2f2f696d6775722e636f6d2f654c446f4f4b592e706e67">

> Proof-of-Concept Kibana4 app & alarm plug-in development based on gitbook:  <http://kibana.logstash.es/content/kibana/v4/plugin/server-develop.html>

---



### Kibana App: Kaae
The Kaae Kibana 4.5+ App extends the nodejs server/api to provide an independent Elasticsearch "Watcher" alternative based on the same principles and trigger object format _(pontentially compatible for use with the original ```_watcher```)_
<img src="http://i.imgur.com/jNYX1mv.gif" />

---

### Kibana Plugin: Kaae Spy
The Kaae integrated Kibana plug-in extends the default Spy functionality to shape new prototype Watchers based on Visualize queries, and providing them to Kaae for fine editing and scheduling.
<img src="http://i.imgur.com/4lDTOVR.png" />


<br>
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

- [x] Add Background watcher load execution skeleton  _(Kibana core)_
- [x] Add Kibana plugin to extend SPY and generate Watchers  _(Kibana plugin)_
- [x] Add JSON editors for watcher rules _(Sense-like)_
- [X] Save & load watcher history & results to/from elasticsearch custom indices _(init)_
- [ ] Add/Edit/Delete for watcher rules rows _(es queries)_
- [ ] Add actual actions for watcher triggers _(Email, slack, etc)_
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
