/*
* Module requirements
* 1. module dependencies: request, mysql
* requies mysql table created by iap/schema.sql
*/
var request = require('request');
var gracenode = require('../gracenode');
var log = gracenode.log.create('iap-apple');

var errorMap = {
	21000: 'The App Store could not read the JSON object you provided.',
	21002: 'The data in the receipt-data property was malformed.',
	21003: 'The receipt could not be authenticated.',
	21004: 'The shared secret you provided does not match the shared secret on file for your account.',
	21005: 'The receipt server is not currently available.',
	21006: 'This receipt is valid but the subscription has expired. When this status code is returned to your server, the receipt data is also decoded and returned as part of the response.',
	21007: 'This receipt is a sandbox receipt, but it was sent to the production service for verification.',
	21008: 'This receipt is a production receipt, but it was sent to the sandbox service for verification.'
};

var sandboxHost = 'sandbox.itunes.apple.com';
var liveHost = 'buy.itunes.apple.com';
var path = '/verifyReceipt';

var config = null;

var host = null;

module.exports.readConfig = function (configIn) {
	config = configIn;
};

module.exports.validatePurchase = function (receipt, cb) {
	var content = { 'receipt-data': receipt };
	log.info('validate purchase with: ', content);
	var options = {
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		}
	};
	send('https://' + liveHost + path, content, function (error, res, data) {
		if (error) {
			return cb(error);
		}
		if (data.status === 21007) {
			// sandbox receipt sent to production. send the validation to sandbox now
			log.info('sending sandbox validation');
			return send('https://' + sandboxHost + path, content, function (error, res, data) {
				if (error) {
					return cb(error);
				}
				log.info('sandbox validation response:', data);
				handleResponse(receipt, data, cb);
			});
		}
		log.info('live validation response: ', data);
		handleResponse(receipt, data, cb);
	});
};

function send(url, content, cb) {
	var options = {
		encoding: null,
		url: url,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: content,
		json: true
	};
	log.info('validation request sent:', url);
	request.post(options, function (error, res, body) {
		return cb(error, res, body);
	});
}

function handleResponse(receipt, data, cb) {
	if (data.status === 0) {
		// validated successfully
		log.info('purchase validated successfully (apple):', data, receipt, true);
		return cb(null, receipt, data, true);
	}
	// failed to validate
	log.error('failed to validate purchase (apple):', data, receipt, false);
	log.error(getErrorByCode(data.status));
	cb(null, receipt, data, false);
}

function getErrorByCode(errorCode) {
	if (errorMap[errorCode]) {
		return errorMap[errorCode];
	}
	return 'Unknown error.';
}

