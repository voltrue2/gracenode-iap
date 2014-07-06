var gracenode = require('../gracenode');
var log = gracenode.log.create('iap-google');
var fs = require('fs');
var crypto = require('crypto');
var async = require('async');

var sandboxPkey = 'iap-sandbox';
var livePkey = 'iap-live';
var config = null;
var pkeyPaths = {};
var pkeys = {};

module.exports.readConfig = function (configIn) {
	config = configIn;
	if (!config) {
		config = {};
	}
	pkeyPaths.sandbox = gracenode.getRootPath() + configIn.googlePublicKeyPath + sandboxPkey;
	pkeyPaths.live = gracenode.getRootPath() + configIn.googlePublicKeyPath + livePkey;
	log.verbose('validation public key paths:', pkeys);
};

module.exports.setup = function (cb) {
	var read = function (prop, next) {
		var path = pkeyPaths[prop];
		fs.readFile(path, function (error, fileData) {
			if (error) {
				//return next(new Error('failed to read public key file: ' + path));
				log.warn('missing public key path for ' + prop + ' at ' + path);
				return next();
			}

			var key = gracenode.lib.chunkSplit(fileData.toString().replace(/\s+$/, ''), 64, '\n'); 

			var pkey = '-----BEGIN PUBLIC KEY-----\n' + key + '-----END PUBLIC KEY-----\n';
			
			log.verbose('validation public key [' + prop + ']:', pkey, 'public key path:' + path);

			pkeys[prop] = pkey;

			next();
		});
	};
	var props = Object.keys(pkeyPaths);
	async.eachSeries(props, read, cb);
};

// receipt is an object
/*
* receipt = { data: 'receipt data', signature: 'receipt signature' };
*/
module.exports.validatePurchase = function (receipt, cb) {
	if (typeof receipt !== 'object') {
		return cb(new Error('malformed receipt: ' + receipt));
	}
	if (!receipt.data || !receipt.signature) {
		return cb(new Error('missing receipt data:\n' + JSON.stringify(receipt)));
	}
	// try live key first
	log.verbose('validate with live public key');
	validatePublicKey(pkeys.live, receipt, function (error, receiptBack, data, validated) {
		if (error) {
			// try sandbox next
			log.error('live validation error:', error);
			log.verbose('validate with sandbox public key');
			return validatePublicKey(pkeys.sandbox, receipt, cb);
		}
		cb(null, receipt, data, validated);
	});
};

function validatePublicKey(pkey, receipt, cb) {
	if (!pkey) {
		return cb(new Error('missing public key'));
	}
	var validater = crypto.createVerify('SHA1');
	validater.update(receipt.data);
	var valid = validater.verify(pkey, receipt.signature, 'base64');

	log.verbose('receipt data:', receipt.data);
	log.verbose('receipt signature:', receipt.signature);	
	log.verbose('valid:', valid);

	if (valid) {
		log.info('purchase validated successfully (google):', data, receipt, valid);
		// validated successfully
		var data = JSON.parse(receipt.data);
		data.status = 0;
		return cb(null, receipt, data, true);
	}
	// failed to validate
	log.error('failed to validate purchase (google):', receipt.data, receipt, valid);
	cb(null, receipt, { status: 1 }, false);
}
