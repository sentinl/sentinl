<!--
Thanks for taking time to report an issue.
Please fill all the following fields to make sure we have all the data we need to help you.
This section will NOT appear in your Issue report!
-->

**Kibana version:**

**Elasticsearch version:**

**Server OS version:**

**Browser version:**

**Browser OS version:**

**Original install method (e.g. release pkg link, gulp, from source, etc.):**

**Describe the bug:**

**Steps to reproduce:**
1.
2.
3.

**Expected behavior:**

**Sample of data you have in Elasticsearch**

**Full watcher document**

**Screenshots (if relevant):**

**Errors in browser console (if relevant):**

**Provide Kibana logs and/or server output (if relevant):**

**Any additional context:**

**Tips:**

1. Try to query Elasticsearch manually first. Do you receive the results you want for your query?
For example, on Linux, you can query Elasticsearch using `curl`:
```
curl -X GET "localhost:9200/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": { 
    "match_all": {}
  }
}
'
```
