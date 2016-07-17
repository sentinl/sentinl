# kaae

> Kibana Alert App for Elasticsearch

---

Proof-of-Concept Kibana4 app & alarm plug-in development based on gitbook:  <http://kibana.logstash.es/content/kibana/v4/plugin/server-develop.html>

### Status 

* Work in progress
 
<br>

#### Dev Plugin Install
<pre>
git clone https://github.com/chenryn/kaae
cd kaae && npm install && npm run package
/opt/kibana/bin/kibana plugin --install kaae -u file://`pwd`/kaae-latest.tar.gz
</pre>

#### Dev Plugin Remove
<pre>
/opt/kibana/bin/kibana plugin -r kaae
</pre>




## TODO

- [ ] Real email action.
- [ ] Webpage for editing alert rules.
- [ ] Record alert history into elasticsearch indices.
- [ ] Webpage for history view(maybe use kibana app?).
