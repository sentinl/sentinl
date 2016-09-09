module.exports = (function () {
	var conf;
	try {
	  conf = require('/etc/kaae.json');
	  conf.custom = true;
	} catch(e) {
	  conf = require('../../kaae.json');
	  conf.custom = false;
	}
        return conf;
}());
