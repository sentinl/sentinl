Sentinl with Kibana 5.5.2 + Search Guard 5.5.2 demo

**ATTENTION!** In a production environment, you should use unique passwords and valid trusted certificates. Read more about this in [Search Guard documentation](http://floragunncom.github.io/search-guard-docs/).

# Install Search Guard
- Install the Search Guard plugin for your [Elasticsearch version](https://github.com/floragunncom/search-guard/wiki), e.g.:
```
<ES directory>/bin/elasticsearch-plugin install https://github.com/floragunncom/search-guard/releases/tag/ves-5.5.2-16
```
- `cd <ES directory>/plugins/search-guard-<version>/tools`
- Execute `./install_demo_configuration.sh`, chmod the script first if necessary. This will generate all required TLS certificates and add the Search Guard configuration to your `elasticsearch.yml` file.
- Start Elasticsearch `./bin/elasticsearch`
- Execute `./sgadmin_demo.sh`, `chmod` the script if necessary first. This will execute `sgadmin` and populate the Search Guard configuration index with the files contained in the plugins/search-guard-<version>/sgconfig directory.
- Test the installation
```
curl -uadmin:admin -sS -i --insecure -XGET https://localhost:9200/_searchguard/authinfo?pretty
```

## Allow Sentinl access
Allow Sentinl to access `watcher` and `credit_card` indices in `sg_roles.yml`.

```
sg_kibana_server:
  cluster:
      - CLUSTER_MONITOR
      - CLUSTER_COMPOSITE_OPS
      - cluster:admin/xpack/monitoring*
  indices:
    '?kibana':
      '*':
        - INDICES_ALL
    'watcher*':
      '*':
       - indices:data/read/search
       - MANAGE
       - CREATE_INDEX
       - INDEX
       - READ
       - WRITE
       - DELETE
    'credit_card':
      '*':
       - indices:data/read/search
```

## Apply Search Guard configuration
- `cd` in `elasticsearch`
- Execute
```
./plugins/search-guard-5/tools/sgadmin.sh -cd plugins/search-guard-5/sgconfig/ -ts config/truststore.jks -ks config/kirk.jks -icl -nhnv
```
More details are [here](https://github.com/floragunncom/search-guard-docs/blob/master/sgadmin.md#configuring-the-admin-certificate)


# Install Search Guard Kibana plugin 
- `cd` into `kibana` folder
- Execute: 
```
./bin/kibana-plugin install https://github.com/floragunncom/search-guard-kibana-plugin/releases/download/v5.5.2-4/searchguard-kibana-5.5.2-4.zip
```
- Set HTTPS connection for Elasticsearch in `kibana/config/kibana.yml`
```
elasticsearch.url: "https://localhost:9200"
```
- Set Kibana user and password in `kibana/config/kibana.yml`
```
elasticsearch.username: "kibanaserver"
elasticsearch.password: "kibanaserver"
```
- Disregard validity of SSL certificate in `kibana/config/kibana.yml`
```
elasticsearch.ssl.verificationMode: 'none'
```