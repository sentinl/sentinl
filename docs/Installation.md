## SentiNL Installation

### Libraries to install
Debian, Ubuntu
```
sudo apt-get install libfontconfig libfreetype6
```
Centos
```
sudo yum install fontconfig freetype
```

## Kibana 4.x
#### Snapshot Plugin Install

Browse to our [releases](https://github.com/sirensolutions/sentinl/releases) and choose the relevant version, ie: ```tag-4.6.4-4``` to use for installing the plugin:

```
/opt/kibana/bin/kibana plugin --install sentinl -u https://github.com/sirensolutions/sentinl/releases/download/tag-4.6.4-4/sentinl.zip
```

#### Dev Plugin Install
```
git clone https://github.com/sirensolutions/sentinl
cd sentinl && npm install && npm run package
/opt/kibana/bin/kibana plugin --install sentinl -u file://`pwd`/sentinl-latest.tar.gz
```

--------------
## Kibana 5.x
There are two modes for Sentinl install

#### User mode
1. Look at the [Sentinl releases](https://github.com/sirensolutions/sentinl/releases), find a release which matches your Kibana version, find .zip package which matches Kibana subversion and copy its URL. For example
https://github.com/sirensolutions/sentinl/releases/download/tag-5.6.2/sentinl-v5.6.5.zip
2. Go in Kibana `cd kibana`
3. Install Sentinl 
```
./bin/kibana-plugin install https://github.com/sirensolutions/sentinl/releases/download/tag-5.6.2/sentinl-v5.6.5.zip
```
4. Start Kibana `./bin/kibana`

#### Developer mode

1. Ensure you have correct Node.js version to run your Kibana `cat kibana/.node_version`
2. Clone Sentinl repo `git clone https://github.com/sirensolutions/sentinl.git`
3. Go in Sentinl folder `cd sentinl` 
4. Install packages `npm install`
5. Look at the available branches `git branch -a`
6. Find a branch which matches your Kibana version, for example `branch-5.6`
7. Checkout inside this branch `git checkout branch-5.6`
8. Ensure you have a subversion which matches Kibana subversion `grep version package.json`. Correct the subversion in `package.json` to match the Kibana subversion. For example, you should have `5.6.5` there if Kibana is `5.6.5`. 
9. Install Sentinl and leave gulp working to live sync code changes `gulp dev --kibanahomepath=/path/to/kibana`
10. Open a new terminal or bash session etc.
11. Go in Kibana `cd kibana`
12. Start Kibana `npm start`

----------

NEXT: Proceed with [configuration](https://github.com/elasticfence/kaae/wiki/SENTINL-Config-Example)