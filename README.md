<img src="http://i.imgur.com/aDHvUxf.png" />
# Kibana Alert App for Elasticsearch <img src="https://camo.githubusercontent.com/15f26c4f603cac9bf415c841a8a60077f6db5102/687474703a2f2f696d6775722e636f6d2f654c446f4f4b592e706e67">

> Proof-of-Concept Kibana4 app & alarm plug-in development based on gitbook:  <http://kibana.logstash.es/content/kibana/v4/plugin/server-develop.html>

---

### Abstract

This Kibana4+ App/Plugin extends the nodejs server/api to provide an independent Elasticsearch "Watcher" alternative.
<br>For an illustrative working example, please check out the [TUTORIAL](TUTORIAL.md)

<img src="http://i.imgur.com/jNYX1mv.gif" />

### Status 

* Work in progress! Please [report](https://github.com/elasticfence/kaae/issues) any ideas, bugs and findings
* Contributors Needed! If you know angular and elasticsearch join us!
 
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




## TODO

- [ ] Add/Edit/Delete for alert rules rows _(es queries)_
- [ ] Add JSON editors for alert rules _(Sense-like?)_
- [ ] Add actual actions for triggers _(Email, slack, etc)_
- [ ] Record & Read alert history to/from elasticsearch indices _(init)_

